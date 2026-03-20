import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStoreService } from '../services/auth-store.service';

export const authGuard: CanActivateFn = () => {
  const authStore = inject(AuthStoreService);
  const router = inject(Router);

  if (authStore.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};

export const roleGuard = (...roles: string[]): CanActivateFn => {
  return () => {
    const authStore = inject(AuthStoreService);
    const router = inject(Router);

    if (!authStore.isAuthenticated()) {
      return router.createUrlTree(['/login']);
    }

    if (authStore.hasRole(...roles)) {
      return true;
    }

    return router.createUrlTree(['/']);
  };
};
