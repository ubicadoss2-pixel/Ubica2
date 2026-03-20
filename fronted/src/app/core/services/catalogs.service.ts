import { Injectable } from '@angular/core';
import { CatalogItem, City } from '../models/api.models';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class CatalogsService extends ApiService {
  getCities() {
    return this.http.get<City[]>(`${this.baseUrl}/catalogs/cities`);
  }

  getPlaceTypes() {
    return this.http.get<CatalogItem[]>(`${this.baseUrl}/catalogs/place-types`);
  }

  getEventCategories() {
    return this.http.get<CatalogItem[]>(`${this.baseUrl}/catalogs/event-categories`);
  }
}
