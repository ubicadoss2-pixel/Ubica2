import { Injectable } from '@angular/core';
import { ApiPage, Place } from '../models/api.models';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class PlacesService extends ApiService {
  list(params: Record<string, string | number | boolean | null | undefined>) {
    return this.http.get<ApiPage<Place>>(`${this.baseUrl}/places`, {
      params: this.toHttpParams(params),
    });
  }

  getById(id: string) {
    return this.http.get<Place>(`${this.baseUrl}/places/${id}`);
  }

  create(payload: any) {
    return this.http.post<Place>(`${this.baseUrl}/places`, payload);
  }

  update(id: string, payload: any) {
    return this.http.patch<Place>(`${this.baseUrl}/places/${id}`, payload);
  }

  updateStatus(id: string, status: 'DRAFT' | 'PUBLISHED' | 'SUSPENDED') {
    return this.http.patch<Place>(`${this.baseUrl}/places/${id}/status`, { status });
  }

  private toHttpParams(params: Record<string, string | number | boolean | null | undefined>) {
    return Object.entries(params).reduce(
      (acc, [key, value]) => {
        if (value === null || value === undefined || value === '') return acc;
        acc[key] = String(value);
        return acc;
      },
      {} as Record<string, string>
    );
  }
}
