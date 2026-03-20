import { Injectable } from '@angular/core';
import { map, tap } from 'rxjs/operators';
import { AuthTokens, JwtUser, RegisterResponse } from '../models/api.models';
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
        tap((response) => {
          this.authStore.setSession(response.accessToken, response.refreshToken, response.user as JwtUser);
        })
      );
  }

  login(payload: { email: string; password: string }) {
    return this.http.post<AuthTokens>(`${this.baseUrl}/auth/login`, payload).pipe(
      tap((response) => {
        this.authStore.setSession(response.accessToken, response.refreshToken);
      }),
      map(() => void 0)
    );
  }
}
