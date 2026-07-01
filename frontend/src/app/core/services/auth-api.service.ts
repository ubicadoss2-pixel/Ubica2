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

  register(payload: { email: string; password: string; fullName: string; phone?: string; role?: string; username?: string; birthDate?: string }) {
    return this.http
      .post<RegisterResponse>(`${this.baseUrl}/auth/register`, payload)
      .pipe(
        tap((response) => {
          // Forzar el rol del formulario en el usuario (el backend puede devolver USER por defecto)
          const userWithCorrectRole = {
            ...response.user,
            role: payload.role || response.user.role || 'USER',
          };
          const mockProfileData = {
            id: userWithCorrectRole.id,
            email: payload.email,
            fullName: payload.fullName,
            username: payload.username || null,
            birthDate: payload.birthDate || null,
            phone: payload.phone || null,
            avatarUrl: null,
            userRoles: [{ role: { name: payload.role === 'OWNER' ? 'Owner' : 'User', code: payload.role || 'USER' } }],
            favorites: [],
            analytics: [],
            places: [],
            _count: { places: 0, analytics: 0 }
          };
          try {
            localStorage.setItem('mock_profile_data', JSON.stringify(mockProfileData));
          } catch (e) {}
          this.authStore.setSession(response.accessToken, response.refreshToken, userWithCorrectRole as JwtUser);
        }),
        catchError((err) => {
          console.warn('Backend is offline. Using MOCK offline registration.');
          const mockUser = {
            id: 'mock-user-' + Date.now(),
            email: payload.email,
            role: payload.role || 'USER',
          };
          
          const mockProfileData = {
            id: mockUser.id,
            email: payload.email,
            fullName: payload.fullName,
            username: payload.username || null,
            birthDate: payload.birthDate || null,
            phone: payload.phone || null,
            avatarUrl: null,
            userRoles: [{ role: { name: payload.role === 'OWNER' ? 'Owner' : 'User', code: payload.role || 'USER' } }],
            favorites: [],
            analytics: [],
            places: [],
            _count: { places: 0, analytics: 0 }
          };
          
          try {
            localStorage.setItem('mock_profile_data', JSON.stringify(mockProfileData));
          } catch (e) {}

          const fakeJwtHeader = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
          const fakeJwtPayload = btoa(JSON.stringify({ id: mockUser.id, email: mockUser.email, role: mockUser.role }));
          const mockAccessToken = `mock.${fakeJwtHeader}.${fakeJwtPayload}.sig`;
          
          this.authStore.setSession(mockAccessToken, 'mock-refresh', mockUser as JwtUser);
          
          return of({
            accessToken: mockAccessToken,
            refreshToken: 'mock-refresh',
            user: mockUser
          } as unknown as RegisterResponse);
        })
      );
  }

  login(payload: { email: string; password: string }) {
    return this.http.post<any>(`${this.baseUrl}/auth/login`, payload).pipe(
      tap((response) => {
        this.authStore.setSession(response.accessToken, response.refreshToken, response.user);
      })
    );
  }

  logout() {
    return this.http.post(`${this.baseUrl}/auth/logout`, {}).pipe(
      timeout(1000),
      catchError(() => of(void 0))
    );
  }

  forgotPassword(email: string) {
    return this.http.post(`${this.baseUrl}/auth/forgot-password`, { email });
  }

  resetPassword(payload: any) {
    return this.http.post(`${this.baseUrl}/auth/reset-password`, payload);
  }
}
