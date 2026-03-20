import { Injectable } from '@angular/core';
import { ApiPage, EventItem } from '../models/api.models';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class EventsService extends ApiService {
  listAgenda(params: Record<string, string | number | null | undefined>) {
    return this.http.get<ApiPage<EventItem>>(`${this.baseUrl}/events/agenda`, {
      params: this.toHttpParams(params),
    });
  }

  listByPlace(placeId: string, params: Record<string, string | number | null | undefined> = {}) {
    return this.http.get<ApiPage<EventItem>>(`${this.baseUrl}/events/place/${placeId}`, {
      params: this.toHttpParams(params),
    });
  }

  getById(id: string) {
    return this.http.get<EventItem>(`${this.baseUrl}/events/${id}`);
  }

  create(payload: any) {
    return this.http.post<EventItem>(`${this.baseUrl}/events`, payload);
  }

  update(id: string, payload: any) {
    return this.http.patch<EventItem>(`${this.baseUrl}/events/${id}`, payload);
  }

  private toHttpParams(params: Record<string, string | number | null | undefined>) {
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
