import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SearchHistoryItem } from '../models/feature.models';
import { ApiPage } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class SearchHistoryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  add(item: {
    query: string;
    cityId?: string;
    placeTypeId?: string;
    latitude?: number;
    longitude?: number;
    radiusKm?: number;
    resultsCount?: number;
  }): Observable<SearchHistoryItem> {
    return this.http.post<SearchHistoryItem>(`${this.baseUrl}/search-history`, item);
  }

  getAll(page = 1, pageSize = 50): Observable<ApiPage<SearchHistoryItem>> {
    return this.http.get<ApiPage<SearchHistoryItem>>(
      `${this.baseUrl}/search-history?page=${page}&pageSize=${pageSize}`
    );
  }

  clear(): Observable<any> {
    return this.http.delete(`${this.baseUrl}/search-history`);
  }

  deleteItem(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/search-history/${id}`);
  }
}
