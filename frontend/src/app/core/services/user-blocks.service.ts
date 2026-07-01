import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserBlock } from '../models/feature.models';

@Injectable({ providedIn: 'root' })
export class UserBlocksService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  getBlocked(): Observable<UserBlock[]> {
    return this.http.get<UserBlock[]>(`${this.baseUrl}/user-blocks`);
  }

  block(userId: string, reason?: string): Observable<UserBlock> {
    return this.http.post<UserBlock>(`${this.baseUrl}/user-blocks`, { blockedId: userId, reason });
  }

  unblock(userId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/user-blocks/${userId}`);
  }

  isBlocked(userId: string): Observable<{ isBlocked: boolean }> {
    return this.http.get<{ isBlocked: boolean }>(`${this.baseUrl}/user-blocks/${userId}/check`);
  }
}
