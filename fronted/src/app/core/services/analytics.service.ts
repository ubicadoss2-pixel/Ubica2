import { Injectable } from '@angular/core';
import { AnalyticsSummary } from '../models/api.models';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class AnalyticsService extends ApiService {
  create(payload: {
    eventType:
      | 'PLACE_VIEW'
      | 'EVENT_VIEW'
      | 'CONTACT_CLICK'
      | 'FAVORITE_ADD'
      | 'FAVORITE_REMOVE'
      | 'REPORT_CREATE';
    placeId?: string;
    eventId?: string;
    meta?: Record<string, unknown>;
  }) {
    return this.http.post(`${this.baseUrl}/analytics`, payload);
  }

  summary() {
    return this.http.get<AnalyticsSummary>(`${this.baseUrl}/analytics/summary`);
  }
}
