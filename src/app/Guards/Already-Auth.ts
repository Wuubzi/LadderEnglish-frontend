import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../Services/Auth';
import { inject } from '@angular/core';

export const alreadyAuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  if (authService.isLoggedIn()) {
    router.navigate(['/']);
    return false;
  } else {
    return true;
  }
};