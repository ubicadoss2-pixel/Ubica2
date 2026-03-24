import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Preference } from '../models/feature.models';

@Injectable({ providedIn: 'root' })
export class PreferencesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  getAll(): Observable<Record<string, string>> {
    return this.http.get<Record<string, string>>(`${this.baseUrl}/preferences`);
  }

  set(key: string, value: string): Observable<Preference> {
    return this.http.post<Preference>(`${this.baseUrl}/preferences`, { key, value });
  }

  setBulk(preferences: { key: string; value: string }[]): Observable<Preference[]> {
    return this.http.post<Preference[]>(`${this.baseUrl}/preferences/bulk`, { preferences });
  }

  delete(key: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/preferences/${encodeURIComponent(key)}`);
  }

  getKnown(): Observable<{ key: string }[]> {
    return this.http.get<{ key: string }[]>(`${this.baseUrl}/preferences/known`);
  }
}
