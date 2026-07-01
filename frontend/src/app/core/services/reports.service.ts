import { Injectable } from '@angular/core';
import { Report } from '../models/api.models';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class ReportsService extends ApiService {
  create(payload: {
    targetType: 'PLACE' | 'EVENT';
    placeId?: string;
    eventId?: string;
    reason: 'WRONG_INFO' | 'SPAM' | 'INAPPROPRIATE' | 'CLOSED' | 'OTHER';
    details?: string;
  }) {
    return this.http.post<Report>(`${this.baseUrl}/reports`, payload);
  }

  list(status?: 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'REJECTED') {
    return this.http.get<Report[]>(`${this.baseUrl}/reports`, {
      params: status ? { status } : undefined,
    });
  }

  update(id: string, status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'REJECTED') {
    return this.http.patch<Report>(`${this.baseUrl}/reports/${id}`, { status });
  }
}
