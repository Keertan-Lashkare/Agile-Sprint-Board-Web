import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { RegisterComponent } from './components/register/register';
import { BoardComponent } from './components/board/board';
import { AuthGuard } from './guards/auth-guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'board', component: BoardComponent, canActivate: [AuthGuard] },
  { path: '', redirectTo: '/board', pathMatch: 'full' },
  { path: '**', redirectTo: '/board' }
];