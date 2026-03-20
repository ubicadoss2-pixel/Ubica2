import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthStoreService } from '../services/auth-store.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authStore = inject(AuthStoreService);
  const router = inject(Router);
  const token = authStore.accessToken();

  let modifiedReq = req;
  if (token) {
    modifiedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(modifiedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authStore.logout();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
