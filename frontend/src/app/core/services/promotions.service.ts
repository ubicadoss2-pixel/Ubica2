import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Promotion, PromotionRedemption } from '../models/feature.models';
import { ApiPage } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class PromotionsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  getActive(cityId?: string, page = 1, pageSize = 20): Observable<ApiPage<Promotion>> {
    let url = `${this.baseUrl}/promotions?page=${page}&pageSize=${pageSize}`;
    if (cityId) url += `&cityId=${cityId}`;
    return this.http.get<ApiPage<Promotion>>(url);
  }

  getByPlace(placeId: string): Observable<Promotion[]> {
    return this.http.get<Promotion[]>(`${this.baseUrl}/promotions/place/${placeId}`);
  }

  getByCode(code: string): Observable<Promotion> {
    return this.http.get<Promotion>(`${this.baseUrl}/promotions/code/${code}`);
  }

  redeem(code: string): Observable<{ message: string; redemption: PromotionRedemption }> {
    return this.http.post<{ message: string; redemption: PromotionRedemption }>(
      `${this.baseUrl}/promotions/redeem`,
      { code }
    );
  }
}
