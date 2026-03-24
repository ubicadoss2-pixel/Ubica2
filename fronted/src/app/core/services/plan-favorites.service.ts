import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PlanFavorite } from '../models/feature.models';

@Injectable({ providedIn: 'root' })
export class PlanFavoritesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  getAll(): Observable<PlanFavorite[]> {
    return this.http.get<PlanFavorite[]>(`${this.baseUrl}/plan-favorites`);
  }

  add(planId: string): Observable<PlanFavorite> {
    return this.http.post<PlanFavorite>(`${this.baseUrl}/plan-favorites/${planId}`, {});
  }

  remove(planId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/plan-favorites/${planId}`);
  }

  check(planId: string): Observable<{ isFavorited: boolean }> {
    return this.http.get<{ isFavorited: boolean }>(`${this.baseUrl}/plan-favorites/${planId}/check`);
  }
}
