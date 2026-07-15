import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Task, TaskService } from '../../services/task';
import { AuthService } from '../../services/auth';
import { ToastService } from '../../services/toast';

@Component({
  selector: 'app-board',
  templateUrl: './board.html',
  styleUrls: ['./board.css'],
  imports: [CommonModule, DragDropModule]
})
export class BoardComponent implements OnInit {
  todoTasks: Task[] = [];
  inProgressTasks: Task[] = [];
  doneTasks: Task[] = [];
  
  userName = '';
  currentUserId: number | null = null;
  
  searchText = '';
  selectedPriority = 'all';
  filterAssigned: 'all' | 'me' = 'all';

  constructor(
    private taskService: TaskService,
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      this.userName = currentUser.name;
      this.currentUserId = currentUser.id;
    }
    this.loadTasks();
  }

  loadTasks(): void {
    this.taskService.getTasks().subscribe({
      next: (tasks) => {
        this.todoTasks = tasks.filter(t => t.column === 'todo');
        this.inProgressTasks = tasks.filter(t => t.column === 'in_progress');
        this.doneTasks = tasks.filter(t => t.column === 'done');
      },
      error: () => {
        this.toastService.show('Failed to load tasks.', 'error');
      }
    });
  }

  onDrop(event: CdkDragDrop<Task[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      const task = event.container.data[event.currentIndex];
      const newColumn = this.getColumnName(event.container.id);

      this.taskService.updateTask(task.id, { column: newColumn }).subscribe({
        error: () => {
          this.toastService.show('Failed to update task column.', 'error');
          this.loadTasks();
        }
      });
    }
  }

  getColumnName(containerId: string): 'todo' | 'in_progress' | 'done' {
    if (containerId === 'in_progress' || containerId.includes('in_progress')) {
      return 'in_progress';
    }
    if (containerId === 'done' || containerId.includes('done')) {
      return 'done';
    }
    return 'todo';
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchText = target.value.toLowerCase();
  }

  onPriorityFilterChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedPriority = target.value;
  }

  onToggleFilter(value: 'all' | 'me'): void {
    this.filterAssigned = value;
  }

  getFilteredTasks(tasks: Task[]): Task[] {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(this.searchText) ||
                            task.description.toLowerCase().includes(this.searchText);
      
      const matchesPriority = this.selectedPriority === 'all' || 
                              task.priority === this.selectedPriority;
      
      const matchesAssigned = this.filterAssigned === 'all' || 
                              task.assignedTo === this.currentUserId;

      return matchesSearch && matchesPriority && matchesAssigned;
    });
  }

  onDeleteTask(id: number): void {
    this.taskService.deleteTask(id).subscribe({
      next: () => {
        this.toastService.show('Task deleted successfully.', 'success');
        this.loadTasks();
      },
      error: () => {
        this.toastService.show('Failed to delete task.', 'error');
      }
    });
  }

  onLogout(): void {
    this.authService.logout();
    this.toastService.show('Logged out successfully.', 'success');
    this.router.navigate(['/login']);
  }
}
