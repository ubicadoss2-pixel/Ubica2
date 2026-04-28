import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiPage, Place } from '../models/api.models';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class PlacesService extends ApiService {
  list(params: Record<string, string | number | boolean | null | undefined>) {
    return this.http.get<ApiPage<Place>>(`${this.baseUrl}/places`, {
      params: this.toHttpParams(params),
    });
  }

  getById(id: string) {
    return this.http.get<Place>(`${this.baseUrl}/places/${id}`).pipe(
      catchError(err => {
        const mocks: Record<string, any> = {
          'mock-real-1': { id: 'mock-real-1', name: 'Restaurante La Fogata', description: 'El restaurante más icónico de Armenia. Famoso por su baby beef y su atención impecable desde 1963.', city: { name: 'Armenia' }, placeType: { name: 'Restaurante' }, priceLevel: 5, photos: [{ url: 'https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&w=800&q=60' }], latitude: 4.5512, longitude: -75.6598 },
          'mock-real-2': { id: 'mock-real-2', name: 'El Solar Gastrobar', description: 'Ambiente rústico y moderno en el norte de la ciudad. Coctelería premium y platos para compartir.', city: { name: 'Armenia' }, placeType: { name: 'Gastrobar' }, priceLevel: 3, photos: [{ url: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=800&q=60' }], latitude: 4.5495, longitude: -75.6631 },
          'mock-real-3': { id: 'mock-real-3', name: 'Dar Papaya', description: 'El epicentro de la rumba en Armenia. Decoración de neón y los mejores DJs de la región.', city: { name: 'Armenia' }, placeType: { name: 'Discoteca/Bar' }, priceLevel: 3, photos: [{ url: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?auto=format&fit=crop&w=800&q=60' }], latitude: 4.5540, longitude: -75.6580 },
          'mock-real-4': { id: 'mock-real-4', name: 'Museo del Oro Quimbaya', description: 'Un museo espectacular diseñado por Rogelio Salmona. Alberga tesoros arqueológicos invaluables.', city: { name: 'Armenia' }, placeType: { name: 'Museo' }, priceLevel: 2, photos: [{ url: 'https://arquitecturapanamericana.com/wp-content/uploads/2016/10/Salmona-1.jpg' }], latitude: 4.5501, longitude: -75.6606 },
          'mock-real-bunker': {
            id: 'mock-real-bunker',
            name: 'El Bunker',
            description: 'Experiencia clandestina en el corazón de Armenia. Coctelería de autor y ambiente industrial con toques de neón.',
            city: { name: 'Armenia' },
            placeType: { name: 'Bar/Gastrobar' },
            priceLevel: 4,
            photos: [{ url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=60' }],
            latitude: 4.5450,
            longitude: -75.6680
          }
        };

        if (mocks[id]) return of(mocks[id] as Place);
        throw err;
      })
    );
  }

  create(payload: any) {
    return this.http.post<Place>(`${this.baseUrl}/places`, payload);
  }

  update(id: string, payload: any) {
    return this.http.patch<Place>(`${this.baseUrl}/places/${id}`, payload);
  }

  updateStatus(id: string, status: 'DRAFT' | 'PUBLISHED' | 'SUSPENDED') {
    return this.http.patch<Place>(`${this.baseUrl}/places/${id}/status`, { status });
  }

  private toHttpParams(params: Record<string, string | number | boolean | null | undefined>) {
    return Object.entries(params).reduce(
      (acc, [key, value]) => {
        if (value === null || value === undefined || value === '') return acc;
        acc[key] = String(value);
        return acc;
      },
      {} as Record<string, string>
    );
  }
}
