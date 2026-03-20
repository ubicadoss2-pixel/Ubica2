import { Injectable, computed, signal, inject } from '@angular/core';
import { JwtUser, RegisterResponse } from '../models/api.models';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { tap } from 'rxjs';

const ACCESS_TOKEN_KEY = 'ubica2_access_token';
const REFRESH_TOKEN_KEY = 'ubica2_refresh_token';

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
  readonly isAuthenticated = computed(() => !!this.accessTokenSignal());

  constructor() {
    this.hydrateFromStorage();
  }

  setSession(accessToken: string, refreshToken: string, user?: JwtUser): void {
    this.accessTokenSignal.set(accessToken);
    this.refreshTokenSignal.set(refreshToken);
    this.userSignal.set(user ?? this.decodeToken(accessToken));

    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  refreshSession() {
    return this.http.get<RegisterResponse>(`${this.baseUrl}/auth/me`).pipe(
      tap(session => {
        this.setSession(session.accessToken, session.refreshToken, session.user);
      })
    );
  }


  logout(): void {
    this.accessTokenSignal.set(null);
    this.refreshTokenSignal.set(null);
    this.userSignal.set(null);

    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  hasRole(...roles: string[]): boolean {
    const currentUser = this.userSignal();
    return !!currentUser && roles.includes(currentUser.role);
  }

  private hydrateFromStorage(): void {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    if (!accessToken || !refreshToken) {
      return;
    }

    const user = this.decodeToken(accessToken);
    if (!user) {
      this.logout();
      return;
    }

    this.accessTokenSignal.set(accessToken);
    this.refreshTokenSignal.set(refreshToken);
    this.userSignal.set(user);
  }

  private decodeToken(token: string): JwtUser | null {
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));

      if (!decoded?.id || !decoded?.role) return null;
      return {
        id: String(decoded.id),
        email: decoded.email ? String(decoded.email) : undefined,
        role: decoded.role,
      } as JwtUser;
    } catch {
      return null;
    }
  }
}
