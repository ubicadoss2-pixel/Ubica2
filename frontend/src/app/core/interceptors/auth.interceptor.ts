import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError, EMPTY } from 'rxjs';
import { AuthStoreService } from '../services/auth-store.service';

let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authStore = inject(AuthStoreService);
  const router = inject(Router);
  const token = authStore.accessToken();

  const isAuthRequest = req.url.includes('/auth/login') || 
                        req.url.includes('/auth/register') ||
                        req.url.includes('/auth/forgot-password') ||
                        req.url.includes('/auth/reset-password') ||
                        req.url.includes('/auth/me');

  const currentUrl = router.url;
  const isOnAuthPage = currentUrl.includes('/login') || 
                       currentUrl.includes('/register') || 
                       currentUrl.includes('/forgot-password');

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
      if (error.status === 401 && !isAuthRequest && !isOnAuthPage) {
        if (!token) {
          return throwError(() => error);
        }

        if (!isRefreshing) {
          isRefreshing = true;

          return authStore.refreshSession().pipe(
            switchMap(() => {
              isRefreshing = false;
              const newToken = authStore.accessToken();
              if (newToken) {
                const newReq = req.clone({
                  setHeaders: {
                    Authorization: `Bearer ${newToken}`,
                  },
                });
                return next(newReq);
              }
              authStore.logout();
              router.navigate(['/login']);
              return EMPTY;
            }),
            catchError((refreshError) => {
              isRefreshing = false;
              authStore.logout();
              router.navigate(['/login']);
              return EMPTY;
            })
          );
        }
        
        return EMPTY;
      }
      
      if (error.status === 401 && isOnAuthPage) {
        return throwError(() => error);
      }
      
      return throwError(() => error);
    })
  );
};
