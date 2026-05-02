import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return (await authService.isAuthenticated()) || router.createUrlTree(['/login']);
};

export const loginGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return (await authService.isAuthenticated()) ? router.createUrlTree(['/']) : true;
};
