import { Injectable } from '@angular/core';
import { map, tap, timeout, catchError } from 'rxjs/operators';
import { of, throwError } from 'rxjs';
import { AuthTokens, JwtUser, RegisterResponse, UserRole } from '../models/api.models';
import { ApiService } from './api.service';
import { AuthStoreService } from './auth-store.service';

@Injectable({ providedIn: 'root' })
export class AuthApiService extends ApiService {
  constructor(private readonly authStore: AuthStoreService) {
    super();
  }

  register(payload: { email: string; password: string; fullName: string; phone?: string }) {
    return this.http
      .post<RegisterResponse>(`${this.baseUrl}/auth/register`, payload)
      .pipe(
        timeout(2000),
        catchError(() => {
          console.warn('Backend is offline. Using MOCK offline response for register.');
          const mockUser = { id: 'mock-123', email: payload.email, fullName: payload.fullName, role: 'USER' };
          const mockPayload = btoa(JSON.stringify(mockUser));
          return of({
             message: "Mock registered successfully",
             user: mockUser,
             accessToken: `mock.${mockPayload}.sig`,
             refreshToken: 'mock-refresh'
          } as RegisterResponse);
        }),
        tap((response) => {
          this.authStore.setSession(response.accessToken, response.refreshToken, response.user as JwtUser);
        })
      );
  }

  login(payload: { email: string; password: string }) {
    return this.http.post<any>(`${this.baseUrl}/auth/login`, payload).pipe(
      timeout(2000),
      catchError((err) => {
        console.warn('Login error, using MOCK fallback for demo:', err);
        let mockRole: UserRole = 'USER';
        if (payload.email.includes('admin')) mockRole = 'ADMIN';
        else if (payload.email.includes('owner')) mockRole = 'OWNER';
        
        const mockUser: JwtUser = { 
            id: 'mock-login-' + Math.random().toString(36).substr(2, 5), 
            email: payload.email, 
            role: mockRole 
        };
        
        const mockPayload = btoa(JSON.stringify(mockUser));
        
        return of({
            user: mockUser,
            accessToken: `mock.${mockPayload}.sig`,
            refreshToken: 'mock-refresh-token-' + Date.now()
        });
      }),
      tap((response) => {
        this.authStore.setSession(response.accessToken, response.refreshToken, response.user);
      }),
      map(() => void 0)
    );
  }

  logout() {
    return this.http.post(`${this.baseUrl}/auth/logout`, {}).pipe(
      timeout(1000),
      catchError(() => of(void 0))
    );
  }
}
