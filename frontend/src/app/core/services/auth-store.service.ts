import { Injectable, computed, signal, inject } from '@angular/core';
import { JwtUser, RegisterResponse } from '../models/api.models';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

const ACCESS_TOKEN_KEY = 'ubica2_access_token';
const REFRESH_TOKEN_KEY = 'ubica2_refresh_token';
const USER_ROLE_OVERRIDE_KEY = 'ubica2_user_role';

@Injectable({ providedIn: 'root' })
export class AuthStoreService {
  private readonly accessTokenSignal = signal<string | null>(null);
  private readonly refreshTokenSignal = signal<string | null>(null);
  private readonly userSignal = signal<JwtUser | null>(null);
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  readonly accessToken = this.accessTokenSignal.asReadonly();
  readonly refreshToken = this.refreshTokenSignal.asReadonly();
  readonly user = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => {
    const token = this.accessTokenSignal();
    return !!token && token.length > 10; // Token mínimo razonable para evitar "null" o basura
  });
  readonly isOwner = computed(() => this.hasRole('OWNER', 'ADMIN'));
  readonly isAdmin = computed(() => this.hasRole('ADMIN'));

  constructor() {
    this.hydrateFromStorage();
  }

  setSession(accessToken: string, refreshToken: string, user?: JwtUser): void {
    this.accessTokenSignal.set(accessToken);
    this.refreshTokenSignal.set(refreshToken);
    const resolvedUser = user ?? this.decodeToken(accessToken);
    this.userSignal.set(resolvedUser);

    try {
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      // Guardar el rol explícitamente para que persista tras recargar
      if (resolvedUser?.role) {
        localStorage.setItem(USER_ROLE_OVERRIDE_KEY, resolvedUser.role);
      }
    } catch (e) {
      console.warn('[AUTH_STORE] Could not save session to localStorage:', e);
    }
  }

  setUser(user: JwtUser): void {
    this.userSignal.set(user);
  }

  refreshSession() {
    return this.http.get<RegisterResponse>(`${this.baseUrl}/auth/me`).pipe(
      tap(session => {
        this.setSession(session.accessToken, session.refreshToken, session.user);
      }),
      catchError(err => {
        console.warn('[AUTH_STORE] Refresh failed, but keeping mock session for demo.');
        const currentToken = this.accessTokenSignal();
        if (currentToken && currentToken.startsWith('mock')) {
           return of({
             accessToken: currentToken,
             refreshToken: this.refreshTokenSignal() || 'mock-refresh',
             user: this.userSignal()
           } as any);
        }
        throw err;
      })
    );
  }


  logout(): void {
    this.accessTokenSignal.set(null);
    this.refreshTokenSignal.set(null);
    this.userSignal.set(null);

    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_ROLE_OVERRIDE_KEY);
      localStorage.removeItem('mock_profile_data');
    } catch (e) {
      console.warn('[AUTH_STORE] Could not clear localStorage:', e);
    }
  }

  hasRole(...roles: string[]): boolean {
    const currentUser = this.userSignal();
    return !!currentUser && roles.includes(currentUser.role);
  }

  private hydrateFromStorage(): void {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    const savedRole = localStorage.getItem(USER_ROLE_OVERRIDE_KEY);

    if (!accessToken || !refreshToken) {
      return;
    }

    const user = this.decodeToken(accessToken);
    if (!user) {
      this.logout();
      return;
    }

    // Restaurar el rol guardado (puede diferir del codificado en el JWT)
    if (savedRole) {
      user.role = savedRole as any;
    }

    this.accessTokenSignal.set(accessToken);
    this.refreshTokenSignal.set(refreshToken);
    this.userSignal.set(user);
  }

  private decodeToken(token: string): JwtUser | null {
    try {
      const parts = token.split('.');
      let payload = parts[1];
      if (parts[0] === 'mock') {
        payload = parts[2];
      }
      if (!payload) return null;
      
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
      const decoded = JSON.parse(atob(padded));

      if (!decoded?.id || !decoded?.role) return null;
      return {
        id: String(decoded.id),
        email: decoded.email ? String(decoded.email) : undefined,
        role: decoded.role,
      } as JwtUser;
    } catch (e) {
      console.error('[AUTH_STORE] Error decoding token:', e, token);
      return null;
    }
  }
}
