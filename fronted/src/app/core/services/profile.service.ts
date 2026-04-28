import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
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
    return this.http.get<UserProfile>(`${this.baseUrl}/users/profile`).pipe(
      catchError(() => {
        console.warn('Backend is offline. Using MOCK offline profile.');
        const cached = localStorage.getItem('mock_profile_data');
        let mockData: UserProfile | null = null;
        
        if (cached) {
          try {
            mockData = JSON.parse(cached);
          } catch (e) {
            console.error('Failed to parse cached profile data, resetting.', e);
            localStorage.removeItem('mock_profile_data');
          }
        }
        
        if (!mockData) {
          mockData = {
            id: 'mock-owner-1',
            email: 'owner@ubica2.com',
            fullName: 'Usuario Demo',
            phone: '3000000000',
            avatarUrl: null,
            userRoles: [{ role: { name: 'Owner', code: 'OWNER' } }],
            userSubscriptions: [{ plan: { name: 'Plan Business', price: 99000 }, startDate: new Date().toISOString(), endDate: new Date(Date.now() + 30*24*60*60*1000).toISOString() }],
            favorites: [],
            analytics: [],
            places: [],
            _count: { places: 0, analytics: 0 }
          };
          try {
            localStorage.setItem('mock_profile_data', JSON.stringify(mockData));
          } catch (e) {
            console.error('Could not save default mock data', e);
          }
        }
        return of(mockData);
      })
    );
  }

  updateProfile(data: { fullName?: string; phone?: string; avatarUrl?: string }): Observable<any> {
    return this.http.put(`${this.baseUrl}/users/profile`, data).pipe(
      catchError(() => {
        console.warn('Backend is offline. Updating MOCK offline profile.');
        const cached = localStorage.getItem('mock_profile_data');
        if (cached) {
          try {
            const mockData = JSON.parse(cached);
            const updated = { ...mockData, ...data };
            localStorage.setItem('mock_profile_data', JSON.stringify(updated));
            return of(updated);
          } catch (e) {
            console.error('Failed to parse cached profile data during update.', e);
            localStorage.removeItem('mock_profile_data');
            return of(data);
          }
        }
        return of(data);
      })
    );
  }
}
