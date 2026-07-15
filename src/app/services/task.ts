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

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private apiUrl = `${environment.apiUrl}/tasks`;

  constructor(private http: HttpClient) {}

  getTasks(page?: number, limit?: number): Observable<Task[]> {
    let url = this.apiUrl;
    if (page !== undefined && limit !== undefined) {
      url = `${this.apiUrl}?page=${page}&limit=${limit}`;
    }
    return this.http.get<Task[]>(url);
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
