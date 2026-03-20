import { Injectable } from '@angular/core';
import { Favorite } from '../models/api.models';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class FavoritesService extends ApiService {
  list() {
    return this.http.get<Favorite[]>(`${this.baseUrl}/favorites`);
  }

  add(placeId: string) {
    return this.http.post(`${this.baseUrl}/favorites/${placeId}`, {});
  }

  remove(placeId: string) {
    return this.http.delete(`${this.baseUrl}/favorites/${placeId}`);
  }
}
