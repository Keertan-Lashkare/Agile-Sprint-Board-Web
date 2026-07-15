import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Task, TaskService } from '../../services/task';
import { AuthService } from '../../services/auth';
import { ToastService } from '../../services/toast';
import { TaskModalComponent } from '../task-modal/task-modal';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-board',
  templateUrl: './board.html',
  styleUrls: ['./board.css'],
  imports: [CommonModule, DragDropModule, TaskModalComponent]
})
export class BoardComponent implements OnInit {
  todoTasks: Task[] = [];
  inProgressTasks: Task[] = [];
  doneTasks: Task[] = [];

  todoTotal = 0;
  inProgressTotal = 0;
  doneTotal = 0;

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
  readonly pageSize = 10;

  todoLoadedAll = false;
  inProgressLoadedAll = false;
  doneLoadedAll = false;

  loadingTodo = false;
  loadingInProgress = false;
  loadingDone = false;

  constructor(
    private taskService: TaskService,
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe({
      next: (user) => {
        if (user) {
          this.userName = user.name;
          this.currentUserId = user.id;
          this.loadAllColumns();
          this.cdr.markForCheck();
        }
      }
    });
  }

  getAssignedParam(): number | null {
    return this.filterAssigned === 'me' ? this.currentUserId : null;
  }

  loadAllColumns(): void {
    this.todoPage = 1;
    this.inProgressPage = 1;
    this.donePage = 1;

    this.todoLoadedAll = false;
    this.inProgressLoadedAll = false;
    this.doneLoadedAll = false;

    this.loadingTodo = true;
    this.loadingInProgress = true;
    this.loadingDone = true;

    forkJoin({
      todo: this.taskService.getTasks('todo', this.todoPage, this.pageSize, this.searchText, this.selectedPriority, this.getAssignedParam()),
      inProgress: this.taskService.getTasks('in_progress', this.inProgressPage, this.pageSize, this.searchText, this.selectedPriority, this.getAssignedParam()),
      done: this.taskService.getTasks('done', this.donePage, this.pageSize, this.searchText, this.selectedPriority, this.getAssignedParam())
    }).subscribe({
      next: ({ todo, inProgress, done }) => {
        this.todoTasks = todo.tasks;
        this.todoTotal = todo.total;
        this.todoLoadedAll = this.todoTasks.length >= todo.total;

        this.inProgressTasks = inProgress.tasks;
        this.inProgressTotal = inProgress.total;
        this.inProgressLoadedAll = this.inProgressTasks.length >= inProgress.total;

        this.doneTasks = done.tasks;
        this.doneTotal = done.total;
        this.doneLoadedAll = this.doneTasks.length >= done.total;

        this.loadingTodo = false;
        this.loadingInProgress = false;
        this.loadingDone = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingTodo = false;
        this.loadingInProgress = false;
        this.loadingDone = false;
        this.toastService.show('Failed to load tasks.', 'error');
      }
    });
  }

  loadNextPage(column: 'todo' | 'in_progress' | 'done'): void {
    if (column === 'todo') {
      if (this.loadingTodo || this.todoLoadedAll) return;
      this.loadingTodo = true;
      this.todoPage++;
      this.taskService.getTasks('todo', this.todoPage, this.pageSize, this.searchText, this.selectedPriority, this.getAssignedParam()).subscribe({
        next: (res) => {
          this.todoTasks = [...this.todoTasks, ...res.tasks];
          this.todoTotal = res.total;
          this.todoLoadedAll = this.todoTasks.length >= res.total;
          this.loadingTodo = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.loadingTodo = false;
        }
      });
    } else if (column === 'in_progress') {
      if (this.loadingInProgress || this.inProgressLoadedAll) return;
      this.loadingInProgress = true;
      this.inProgressPage++;
      this.taskService.getTasks('in_progress', this.inProgressPage, this.pageSize, this.searchText, this.selectedPriority, this.getAssignedParam()).subscribe({
        next: (res) => {
          this.inProgressTasks = [...this.inProgressTasks, ...res.tasks];
          this.inProgressTotal = res.total;
          this.inProgressLoadedAll = this.inProgressTasks.length >= res.total;
          this.loadingInProgress = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.loadingInProgress = false;
        }
      });
    } else {
      if (this.loadingDone || this.doneLoadedAll) return;
      this.loadingDone = true;
      this.donePage++;
      this.taskService.getTasks('done', this.donePage, this.pageSize, this.searchText, this.selectedPriority, this.getAssignedParam()).subscribe({
        next: (res) => {
          this.doneTasks = [...this.doneTasks, ...res.tasks];
          this.doneTotal = res.total;
          this.doneLoadedAll = this.doneTasks.length >= res.total;
          this.loadingDone = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.loadingDone = false;
        }
      });
    }
  }

  onScroll(event: Event, column: 'todo' | 'in_progress' | 'done'): void {
    const el = event.target as HTMLElement;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 20) {
      this.loadNextPage(column);
    }
  }

  getColumnTasks(column: 'todo' | 'in_progress' | 'done'): Task[] {
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
    const oldColumn = task.column;
    const sourceArray = this.getColumnTasks(oldColumn);
    const sourceIndex = sourceArray.findIndex(t => t.id === task.id);
    if (sourceIndex === -1) return;

    sourceArray.splice(sourceIndex, 1);
    task.column = newColumn;
    this.cdr.markForCheck();

    this.taskService.updateTask(task.id, { column: newColumn }).subscribe({
      next: () => {
        this.loadAllColumns();
      },
      error: () => {
        sourceArray.splice(sourceIndex, 0, task);
        task.column = oldColumn;
        this.toastService.show('Failed to move task.', 'error');
        this.cdr.markForCheck();
      }
    });
  }

  getColumnName(containerId: string): 'todo' | 'in_progress' | 'done' {
    if (containerId.includes('in_progress')) return 'in_progress';
    if (containerId.includes('done')) return 'done';
    return 'todo';
  }

  canDrag(task: Task): boolean {
    return task.createdBy === this.currentUserId || task.assignedTo === this.currentUserId;
  }

  canDelete(task: Task): boolean {
    return task.createdBy === this.currentUserId;
  }

  onSearchChange(event: Event): void {
    this.searchText = (event.target as HTMLInputElement).value.toLowerCase();
    this.loadAllColumns();
  }

  onPriorityFilterChange(event: Event): void {
    this.selectedPriority = (event.target as HTMLSelectElement).value;
    this.loadAllColumns();
  }

  onToggleFilter(value: 'all' | 'me'): void {
    this.filterAssigned = value;
    this.loadAllColumns();
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
    this.loadAllColumns();
    this.cdr.markForCheck();
  }

  onDeleteTask(id: number): void {
    this.taskService.deleteTask(id).subscribe({
      next: () => {
        this.toastService.show('Task deleted.', 'success');
        this.loadAllColumns();
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
