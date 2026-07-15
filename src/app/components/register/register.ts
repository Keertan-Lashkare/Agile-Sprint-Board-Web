import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';
import { ToastService } from '../../services/toast';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  templateUrl: './register.html',
  styleUrl: './register.css',
  imports: [ReactiveFormsModule, RouterModule, CommonModule]
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  isLoading = false;
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    if (this.authService.isLoggedIn) {
      console.log('User is already logged in.');
    }
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      return;
    }

    this.isLoading = true;
    const { name, email, password } = this.registerForm.value;

    this.authService.register(name, email, password).subscribe({
      next: () => {
        this.isLoading = false;
        this.toastService.show('Registration successful! Redirecting...', 'success');
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (err: any) => {
        this.isLoading = false;
        this.toastService.show(err.error?.message || 'Registration failed. Try again.', 'error');
      }
    });
  }
}