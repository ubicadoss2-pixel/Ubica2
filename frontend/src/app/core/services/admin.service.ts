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

  getPendingEvents() {
    return this.http.get<EventItem[]>(`${this.baseUrl}/events/pending`);
  }

  getPendingPlaces() {
    return this.http.get<Place[]>(`${this.baseUrl}/admin/places/pending`);
  }

  moderateEvent(id: string, status: 'ACTIVE' | 'REJECTED', reason?: string) {
    return this.http.patch<{message: string}>(`${this.baseUrl}/admin/events/${id}/moderate`, { status, reason });
  }

  moderatePlace(id: string, status: 'PUBLISHED' | 'SUSPENDED', reason?: string) {
    return this.http.patch<{message: string}>(`${this.baseUrl}/admin/places/${id}/moderate`, { status, reason });
  }

  audit() {
    return this.http.get<AuditLog[]>(`${this.baseUrl}/admin/audit`);
  }

  getUsers(page: number, pageSize: number, search: string, roleCode: string) {
    let params: any = { page: page.toString(), pageSize: pageSize.toString() };
    if (search) params.search = search;
    if (roleCode) params.roleCode = roleCode;
    return this.http.get<any>(`${this.baseUrl}/users`, { params });
  }

  updateUserRole(userId: string, roleCode: string) {
    return this.http.put<any>(`${this.baseUrl}/users/${userId}/role`, { roleCode });
  }

  exportReport(type: string, format: string, dateFrom?: string, dateTo?: string) {
    let params: any = { type, format };
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    
    return this.http.get(`${this.baseUrl}/admin/exports/reports`, {
      params,
      responseType: 'blob'
    });
  }
}
