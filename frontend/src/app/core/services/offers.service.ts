import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Offer } from '../models/feature.models';
import { ApiPage } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class OffersService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  getActive(cityId?: string, page = 1, pageSize = 20): Observable<ApiPage<Offer>> {
    let url = `${this.baseUrl}/offers?page=${page}&pageSize=${pageSize}`;
    if (cityId) url += `&cityId=${cityId}`;
    return this.http.get<ApiPage<Offer>>(url);
  }

  getByPlace(placeId: string): Observable<Offer[]> {
    return this.http.get<Offer[]>(`${this.baseUrl}/offers/place/${placeId}`);
  }

  getByOwner(): Observable<Offer[]> {
    return this.http.get<Offer[]>(`${this.baseUrl}/offers/owner/me`);
  }

  create(offer: Partial<Offer>): Observable<Offer> {
    return this.http.post<Offer>(`${this.baseUrl}/offers`, offer);
  }

  update(id: string, offer: Partial<Offer>): Observable<Offer> {
    return this.http.patch<Offer>(`${this.baseUrl}/offers/${id}`, offer);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/offers/${id}`);
  }
}
