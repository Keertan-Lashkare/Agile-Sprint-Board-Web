import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Task, TaskService } from '../../services/task';
import { AuthService } from '../../services/auth';
import { ToastService } from '../../services/toast';
import { TaskModalComponent } from '../task-modal/task-modal';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-board',
  templateUrl: './board.html',
  styleUrls: ['./board.css'],
  imports: [CommonModule, DragDropModule, TaskModalComponent]
})
export class BoardComponent implements OnInit, OnDestroy {
  todoTasks: Task[] = [];
  inProgressTasks: Task[] = [];
  doneTasks: Task[] = [];

  userName = '';
  currentUserId: number | null = null;

  searchText = '';
  selectedPriority = 'all';
  filterAssigned: 'all' | 'me' = 'all';
  showModal = false;
  selectedTask: Task | null = null;

  todoPage = 1;
  inProgressPage = 1;
  donePage = 1;
  pageSize = 4;

  private userSub!: Subscription;

  constructor(
    private taskService: TaskService,
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.userSub = this.authService.currentUser$.subscribe({
      next: (user) => {
        if (user) {
          this.userName = user.name;
          this.currentUserId = user.id;
          this.loadTasks();
          this.cdr.markForCheck();
        }
      }
    });
  }

  ngOnDestroy(): void {
    if (this.userSub) {
      this.userSub.unsubscribe();
    }
  }

  loadTasks(): void {
    this.taskService.getTasks().subscribe({
      next: (tasks) => {
        this.todoTasks = tasks.filter(t => t.column === 'todo');
        this.inProgressTasks = tasks.filter(t => t.column === 'in_progress');
        this.doneTasks = tasks.filter(t => t.column === 'done');
        this.clampPages();
        this.cdr.markForCheck();
      },
      error: () => {
        this.toastService.show('Failed to load tasks.', 'error');
      }
    });
  }

  clampPages(): void {
    if (this.todoPage > this.getTotalPages(this.todoTasks)) this.todoPage = this.getTotalPages(this.todoTasks);
    if (this.inProgressPage > this.getTotalPages(this.inProgressTasks)) this.inProgressPage = this.getTotalPages(this.inProgressTasks);
    if (this.donePage > this.getTotalPages(this.doneTasks)) this.donePage = this.getTotalPages(this.doneTasks);
  }

  getColumnArray(column: 'todo' | 'in_progress' | 'done'): Task[] {
    if (column === 'todo') return this.todoTasks;
    if (column === 'in_progress') return this.inProgressTasks;
    return this.doneTasks;
  }

  onDrop(event: CdkDragDrop<Task[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      this.cdr.markForCheck();
      return;
    }

    const task = event.item.data as Task;
    const newColumn = this.getColumnName(event.container.id);

    const sourceArray = event.previousContainer.data;
    const sourceIndex = sourceArray.findIndex(t => t.id === task.id);
    if (sourceIndex === -1) return;

    const [movedTask] = sourceArray.splice(sourceIndex, 1);
    movedTask.column = newColumn;
    const targetArray = this.getColumnArray(newColumn);
    targetArray.unshift(movedTask);

    this.clampPages();
    this.cdr.markForCheck();

    this.taskService.updateTask(task.id, { column: newColumn }).subscribe({
      next: () => {
        this.cdr.markForCheck();
      },
      error: () => {
        targetArray.splice(targetArray.indexOf(movedTask), 1);
        sourceArray.splice(sourceIndex, 0, movedTask);
        movedTask.column = task.column;
        this.toastService.show('Failed to move task.', 'error');
        this.clampPages();
        this.cdr.markForCheck();
      }
    });
  }

  getColumnName(containerId: string): 'todo' | 'in_progress' | 'done' {
    if (containerId.includes('in_progress')) return 'in_progress';
    if (containerId.includes('done')) return 'done';
    return 'todo';
  }

  onSearchChange(event: Event): void {
    this.searchText = (event.target as HTMLInputElement).value.toLowerCase();
    this.todoPage = 1;
    this.inProgressPage = 1;
    this.donePage = 1;
    this.cdr.markForCheck();
  }

  onPriorityFilterChange(event: Event): void {
    this.selectedPriority = (event.target as HTMLSelectElement).value;
    this.todoPage = 1;
    this.inProgressPage = 1;
    this.donePage = 1;
    this.cdr.markForCheck();
  }

  onToggleFilter(value: 'all' | 'me'): void {
    this.filterAssigned = value;
    this.todoPage = 1;
    this.inProgressPage = 1;
    this.donePage = 1;
    this.cdr.markForCheck();
  }

  getFilteredTasks(tasks: Task[]): Task[] {
    return tasks.filter(task => {
      const isOwnerOrAssignee = task.createdBy === this.currentUserId || task.assignedTo === this.currentUserId;
      if (!isOwnerOrAssignee) {
        return false;
      }
      const matchesSearch = task.title.toLowerCase().includes(this.searchText) ||
                            task.description.toLowerCase().includes(this.searchText);
      const matchesPriority = this.selectedPriority === 'all' || task.priority === this.selectedPriority;
      const matchesAssigned = this.filterAssigned === 'all' || task.assignedTo === this.currentUserId;
      return matchesSearch && matchesPriority && matchesAssigned;
    });
  }

  getPaginatedTasks(tasks: Task[], page: number): Task[] {
    const filtered = this.getFilteredTasks(tasks);
    return filtered.slice((page - 1) * this.pageSize, page * this.pageSize);
  }

  getTotalPages(tasks: Task[]): number {
    return Math.ceil(this.getFilteredTasks(tasks).length / this.pageSize) || 1;
  }

  canDrag(task: Task): boolean {
    return task.createdBy === this.currentUserId || task.assignedTo === this.currentUserId;
  }

  onAddTask(): void {
    this.selectedTask = null;
    this.showModal = true;
    this.cdr.markForCheck();
  }

  onEditTask(task: Task): void {
    this.selectedTask = task;
    this.showModal = true;
    this.cdr.markForCheck();
  }

  onCloseModal(): void {
    this.showModal = false;
    this.cdr.markForCheck();
  }

  onTaskCreated(): void {
    this.showModal = false;
    this.loadTasks();
    this.cdr.markForCheck();
  }

  onDeleteTask(id: number): void {
    this.taskService.deleteTask(id).subscribe({
      next: () => {
        this.todoTasks = this.todoTasks.filter(t => t.id !== id);
        this.inProgressTasks = this.inProgressTasks.filter(t => t.id !== id);
        this.doneTasks = this.doneTasks.filter(t => t.id !== id);
        this.clampPages();
        this.toastService.show('Task deleted.', 'success');
        this.cdr.markForCheck();
      },
      error: () => {
        this.toastService.show('Failed to delete task.', 'error');
      }
    });
  }

  onLogout(): void {
    this.authService.logout();
    this.toastService.show('Logged out.', 'success');
    this.router.navigate(['/login']);
  }
}
