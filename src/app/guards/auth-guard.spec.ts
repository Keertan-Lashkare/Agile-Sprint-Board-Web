import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthGuard } from './auth-guard';
import { AuthService } from '../services/auth';
import { provideHttpClient } from '@angular/common/http';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let authServiceSpy: any;
  let routerSpy: any;

  beforeEach(() => {
    authServiceSpy = { isLoggedIn: false };
    routerSpy = { parseUrl: () => 'login-url-tree' };

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        provideHttpClient(),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });
    guard = TestBed.inject(AuthGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
