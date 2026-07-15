import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TaskService } from '../../services/task';
import { AuthService, User } from '../../services/auth';
import { ToastService } from '../../services/toast';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-task-modal',
  templateUrl: './task-modal.html',
  styleUrls: ['./task-modal.css'],
  imports: [ReactiveFormsModule, CommonModule]
})
export class TaskModalComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() taskCreated = new EventEmitter<void>();

  taskForm!: FormGroup;
  isLoading = false;
  users: User[] = [];
  currentUserId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private taskService: TaskService,
    private authService: AuthService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      this.currentUserId = currentUser.id;
    }

    this.taskForm = this.fb.group({
      title: ['', [Validators.required]],
      description: ['', [Validators.required]],
      priority: ['low', [Validators.required]],
      dueDate: [''],
      assignToTeammate: [false],
      assignedTo: ['']
    });

    this.loadUsers();
  }

  loadUsers(): void {
    this.authService.getUsers().subscribe({
      next: (usersList) => {
        this.users = usersList.filter(u => u.id !== this.currentUserId);
      },
      error: (err: any) => {
        this.toastService.show(err.error?.message || 'Failed to load users list.', 'error');
      }
    });
  }

  onCancel(): void {
    this.close.emit();
  }

  onSubmit(): void {
    if (this.taskForm.invalid) {
      return;
    }

    this.isLoading = true;
    const { title, description, priority, dueDate, assignToTeammate, assignedTo } = this.taskForm.value;

    const taskData = {
      title,
      description,
      priority,
      dueDate: dueDate || null,
      assignedTo: assignToTeammate && assignedTo ? parseInt(assignedTo) : null
    };

    this.taskService.createTask(taskData).subscribe({
      next: () => {
        this.isLoading = false;
        this.toastService.show('Task created successfully.', 'success');
        this.taskCreated.emit();
      },
      error: (err: any) => {
        this.isLoading = false;
        this.toastService.show(err.error?.message || 'Failed to create task.', 'error');
      }
    });
  }
}
