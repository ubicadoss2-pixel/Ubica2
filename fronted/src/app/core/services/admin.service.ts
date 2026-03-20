import { Injectable } from '@angular/core';
import { AuditLog, EventItem, Place } from '../models/api.models';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class AdminService extends ApiService {
  updatePlaceStatus(id: string, status: 'DRAFT' | 'PUBLISHED' | 'SUSPENDED') {
    return this.http.patch<Place>(`${this.baseUrl}/admin/places/${id}/status`, { status });
  }

  updateEventStatus(id: string, status: 'ACTIVE' | 'CANCELLED' | 'SUSPENDED') {
    return this.http.patch<EventItem>(`${this.baseUrl}/admin/events/${id}/status`, { status });
  }

  audit() {
    return this.http.get<AuditLog[]>(`${this.baseUrl}/admin/audit`);
  }
}
