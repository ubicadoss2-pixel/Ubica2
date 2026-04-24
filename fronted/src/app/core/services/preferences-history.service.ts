import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UserPreferences {
  notifications_enabled?: string;
  email_notifications?: string;
  theme?: string;
  language?: string;
  font_size?: string;
  [key: string]: string | undefined;
}

export interface Category {
  id: string;
  code: string;
  name: string;
}

export interface HistoryItem {
  id: string;
  item_id: string;
  item_type: 'place' | 'event';
  item_name: string;
  item_description?: string;
  latitude?: number;
  longitude?: number;
  viewed_at: string;
}

@Injectable({ providedIn: 'root' })
export class PreferencesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  getPreferences(): Observable<{ 
    preferences: UserPreferences; 
    favoriteCategories: Category[] 
  }> {
    return this.http.get<any>(`${this.baseUrl}/preferences`);
  }

  updatePreferences(data: {
    notifications_enabled?: boolean;
    email_notifications?: boolean;
    theme?: string;
    language?: string;
    font_size?: string;
    favoriteCategories?: string[];
  }): Observable<{ message: string; saved: boolean }> {
    return this.http.put<any>(`${this.baseUrl}/preferences`, data);
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<any>(`${this.baseUrl}/preferences/categories`);
  }
}

@Injectable({ providedIn: 'root' })
export class HistoryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  getHistory(limit = 50): Observable<{ items: HistoryItem[]; total: number; message?: string }> {
    return this.http.get<any>(`${this.baseUrl}/history?limit=${limit}`);
  }

  addToHistory(itemId: string, itemType: 'place' | 'event'): Observable<{ message: string }> {
    return this.http.post<any>(`${this.baseUrl}/history`, { item_id: itemId, item_type: itemType });
  }

  clearHistory(): Observable<{ message: string; cleared: boolean }> {
    return this.http.delete<any>(`${this.baseUrl}/history`);
  }
}