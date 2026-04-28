import { Injectable } from '@angular/core';
import { CatalogItem, City } from '../models/api.models';
import { ApiService } from './api.service';
import { catchError, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CatalogsService extends ApiService {
  getCities() {
    return this.http.get<City[]>(`${this.baseUrl}/catalogs/cities`).pipe(
      catchError(() => of([
        { id: 'city-1', name: 'Armenia', countryCode: 'CO', timezone: 'America/Bogota' }
      ] as City[]))
    );
  }

  getPlaceTypes() {
    return this.http.get<CatalogItem[]>(`${this.baseUrl}/catalogs/place-types`).pipe(
      catchError(() => of([
        { id: 'type-1', name: 'Gastrobar' },
        { id: 'type-2', name: 'Discoteca' },
        { id: 'type-3', name: 'Mirador' },
        { id: 'type-4', name: 'Restaurante' },
        { id: 'type-5', name: 'Museo' },
        { id: 'type-6', name: 'Parque' }
      ] as CatalogItem[]))
    );
  }

  getEventCategories() {
    return this.http.get<CatalogItem[]>(`${this.baseUrl}/catalogs/event-categories`).pipe(
      catchError(() => of([
        { id: 'cat-1', name: 'Concierto' },
        { id: 'cat-2', name: 'Teatro' },
        { id: 'cat-3', name: 'Festival' }
      ] as CatalogItem[]))
    );
  }
}
