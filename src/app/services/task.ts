import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from './auth';
import { environment } from '../../environments/environment';

export interface Task {
  id: number;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  column: 'todo' | 'in_progress' | 'done';
  dueDate: string | null;
  assignedTo: number | null;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  creator?: User;
  assignee?: User;
}

export interface TaskPage {
  tasks: Task[];
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private apiUrl = `${environment.apiUrl}/tasks`;

  constructor(private http: HttpClient) {}

  getTasks(
    column?: 'todo' | 'in_progress' | 'done',
    page?: number,
    limit?: number,
    search?: string,
    priority?: string,
    assignedTo?: number | null
  ): Observable<TaskPage> {
    let url = this.apiUrl;
    const params: string[] = [];

    if (column !== undefined) params.push(`column=${column}`);
    if (page !== undefined) params.push(`page=${page}`);
    if (limit !== undefined) params.push(`limit=${limit}`);
    if (search) params.push(`search=${encodeURIComponent(search)}`);
    if (priority && priority !== 'all') params.push(`priority=${priority}`);
    if (assignedTo !== undefined && assignedTo !== null) params.push(`assignedTo=${assignedTo}`);

    if (params.length > 0) {
      url = `${this.apiUrl}?${params.join('&')}`;
    }
    return this.http.get<TaskPage>(url);
  }

  createTask(taskData: Partial<Task>): Observable<Task> {
    return this.http.post<Task>(this.apiUrl, taskData);
  }

  updateTask(id: number, taskData: Partial<Task>): Observable<Task> {
    return this.http.patch<Task>(`${this.apiUrl}/${id}`, taskData);
  }

  deleteTask(id: number): Observable<{ message: string; taskId: number }> {
    return this.http.delete<{ message: string; taskId: number }>(`${this.apiUrl}/${id}`);
  }
}
