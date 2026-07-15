import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  message: string;
  type: 'success' | 'error';
  visible: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastSubject = new BehaviorSubject<Toast>({ message: '', type: 'success', visible: false });
  public toast$ = this.toastSubject.asObservable();

  show(message: string, type: 'success' | 'error' = 'success'): void {
    this.toastSubject.next({ message, type, visible: true });
    setTimeout(() => {
      this.hide();
    }, 3000);
  }

  hide(): void {
    this.toastSubject.next({ ...this.toastSubject.value, visible: false });
  }
}
