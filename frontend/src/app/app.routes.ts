import { Routes } from '@angular/router';
import { authGuard, loginGuard } from './auth/auth.guard';
import { HomePage } from './home/home.page';
import { LoginPage } from './login/login.page';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginPage,
    canActivate: [loginGuard],
  },
  {
    path: '',
    component: HomePage,
    canActivate: [authGuard],
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
