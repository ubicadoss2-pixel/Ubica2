import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  userRoles: { role: { name: string, code: string } }[];
  userSubscriptions: { plan: { name: string, price: number }, startDate: string, endDate: string }[];
  favorites: { place: { id: string, name: string, placeType: { name: string } } }[];
  analytics: { eventType: string, meta: any, occurredAt: string }[];
  places?: {
    id: string,
    name: string,
    status: string,
    city: { name: string },
    events: { id: string, title: string, status: string }[],
    _count: { favorites: number, comments: number }
  }[];
  _count?: {
    places: number,
    analytics: number
  };
}

@Injectable({ providedIn: 'root' })
export class ProfileService extends ApiService {
  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.baseUrl}/users/profile`);
  }

  updateProfile(data: { fullName?: string; phone?: string; avatarUrl?: string }): Observable<any> {
    return this.http.put(`${this.baseUrl}/users/profile`, data);
  }
}
