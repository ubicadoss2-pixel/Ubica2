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
    }).pipe(
      catchError(() => {
        let mockItems: Place[] = [
          { id: 'mock-real-1', cityId: 'city-1', placeTypeId: 'type-1', name: 'Restaurante La Fogata', description: 'El restaurante más icónico de Armenia. Famoso por su baby beef y su atención impecable desde 1963.', city: { name: 'Armenia' } as any, placeType: { name: 'Restaurante' } as any, priceLevel: 5, photos: [{ url: 'https://images.unsplash.com/photo-1550966842-2849a221082b?auto=format&fit=crop&w=800&q=80' }] as any, latitude: 4.5512 as any, longitude: -75.6598 as any, status: 'PUBLISHED' as any, slug: 'la-fogata' },
          { id: 'mock-real-2', cityId: 'city-1', placeTypeId: 'type-1', name: 'El Solar Gastrobar', description: 'Ambiente rústico y moderno en el norte de la ciudad. Coctelería premium y platos para compartir.', city: { name: 'Armenia' } as any, placeType: { name: 'Gastrobar' } as any, priceLevel: 3, photos: [{ url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80' }] as any, latitude: 4.5495 as any, longitude: -75.6631 as any, status: 'PUBLISHED' as any, slug: 'el-solar-gastrobar' },
          { id: 'mock-real-3', cityId: 'city-1', placeTypeId: 'type-1', name: 'Dar Papaya', description: 'El epicentro de la rumba en Armenia. Decoración de neón y los mejores DJs de la región.', city: { name: 'Armenia' } as any, placeType: { name: 'Discoteca/Bar' } as any, priceLevel: 3, photos: [{ url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80' }] as any, latitude: 4.5540 as any, longitude: -75.6580 as any, status: 'PUBLISHED' as any, slug: 'dar-papaya' },
          { id: 'mock-real-4', cityId: 'city-1', placeTypeId: 'type-1', name: 'Museo del Oro Quimbaya', description: 'Un museo espectacular diseñado por Rogelio Salmona. Alberga tesoros arqueológicos invaluables.', city: { name: 'Armenia' } as any, placeType: { name: 'Museo' } as any, priceLevel: 2, photos: [{ url: 'https://arquitecturapanamericana.com/wp-content/uploads/2016/10/Salmona-1.jpg' }] as any, latitude: 4.5501 as any, longitude: -75.6606 as any, status: 'PUBLISHED' as any, slug: 'museo-del-oro-quimbaya' },
          { id: 'mock-real-bunker', cityId: 'city-1', placeTypeId: 'type-1', name: 'El Bunker', description: 'Experiencia clandestina en el corazón de Armenia. Coctelería de autor y ambiente industrial con toques de neón.', city: { name: 'Armenia' } as any, placeType: { name: 'Bar/Gastrobar' } as any, priceLevel: 4, photos: [{ url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=60' }] as any, latitude: 4.5450 as any, longitude: -75.6680 as any, status: 'PUBLISHED' as any, slug: 'el-bunker' },
          { id: 'terraza-1', cityId: 'city-1', placeTypeId: 'type-1', name: 'La Terraza', description: 'La Terraza: el lugar ideal para eventos especiales en Armenia. Vista espectacular, coctelería y música en vivo.', city: { name: 'Armenia' } as any, placeType: { name: 'Bar' } as any, priceLevel: 2, photos: [{ url: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80' }] as any, latitude: 4.5620 as any, longitude: -75.6560 as any, status: 'PUBLISHED' as any, slug: 'la-terraza' }
        ];

        if (params['ownerId']) {
          // In mock mode, assign simulated ownership of 'terraza-1' and 'mock-real-bunker' to the owner
          mockItems.forEach(item => {
            if (item.id === 'terraza-1' || item.id === 'mock-real-bunker') {
              (item as any).ownerUserId = String(params['ownerId']);
            }
          });
          mockItems = mockItems.filter(item => (item as any).ownerUserId === params['ownerId']);
        }

        return of({
          items: mockItems,
          meta: { total: mockItems.length, page: 1, pageSize: 50, totalPages: 1 }
        });
      })
    );
  }

  getById(id: string) {
    return this.http.get<Place>(`${this.baseUrl}/places/${id}`).pipe(
      catchError(err => {
        const mocks: Record<string, any> = {
          'mock-real-1': { id: 'mock-real-1', cityId: 'city-1', placeTypeId: 'type-1', name: 'Restaurante La Fogata', description: 'El restaurante más icónico de Armenia. Famoso por su baby beef y su atención impecable desde 1963.', city: { name: 'Armenia' }, placeType: { name: 'Restaurante' }, priceLevel: 5, photos: [{ url: 'https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&w=800&q=60' }], latitude: 4.5512, longitude: -75.6598, status: 'PUBLISHED', slug: 'la-fogata' },
          'mock-real-2': { id: 'mock-real-2', cityId: 'city-1', placeTypeId: 'type-1', name: 'El Solar Gastrobar', description: 'Ambiente rústico y moderno en el norte de la ciudad. Coctelería premium y platos para compartir.', city: { name: 'Armenia' }, placeType: { name: 'Gastrobar' }, priceLevel: 3, photos: [{ url: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=800&q=60' }], latitude: 4.5495, longitude: -75.6631, status: 'PUBLISHED', slug: 'el-solar-gastrobar' },
          'mock-real-3': { id: 'mock-real-3', cityId: 'city-1', placeTypeId: 'type-1', name: 'Dar Papaya', description: 'El epicentro de la rumba en Armenia. Decoración de neón y los mejores DJs de la región.', city: { name: 'Armenia' }, placeType: { name: 'Discoteca/Bar' }, priceLevel: 3, photos: [{ url: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?auto=format&fit=crop&w=800&q=60' }], latitude: 4.5540, longitude: -75.6580, status: 'PUBLISHED', slug: 'dar-papaya' },
          'mock-real-4': { id: 'mock-real-4', cityId: 'city-1', placeTypeId: 'type-1', name: 'Museo del Oro Quimbaya', description: 'Un museo espectacular diseñado por Rogelio Salmona. Alberga tesoros arqueológicos invaluables.', city: { name: 'Armenia' }, placeType: { name: 'Museo' }, priceLevel: 2, photos: [{ url: 'https://arquitecturapanamericana.com/wp-content/uploads/2016/10/Salmona-1.jpg' }], latitude: 4.5501, longitude: -75.6606, status: 'PUBLISHED', slug: 'museo-del-oro-quimbaya' },
          'mock-real-bunker': {
            id: 'mock-real-bunker',
            cityId: 'city-1',
            placeTypeId: 'type-1',
            name: 'El Bunker',
            description: 'Experiencia clandestina en el corazón de Armenia. Coctelería de autor y ambiente industrial con toques de neón.',
            city: { name: 'Armenia' },
            placeType: { name: 'Bar/Gastrobar' },
            priceLevel: 4,
            photos: [{ url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=60' }],
            latitude: 4.5450,
            longitude: -75.6680,
            status: 'PUBLISHED',
            slug: 'el-bunker'
          },
          'terraza-1': {
            id: 'terraza-1',
            cityId: 'city-1',
            placeTypeId: 'type-1',
            name: 'La Terraza',
            description: 'La Terraza: el lugar ideal para eventos especiales en Armenia. Vista espectacular, coctelería y música en vivo.',
            city: { name: 'Armenia' },
            placeType: { name: 'Bar' },
            priceLevel: 2,
            photos: [{ url: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80' }],
            latitude: 4.5620,
            longitude: -75.6560,
            status: 'PUBLISHED',
            slug: 'la-terraza',
            contacts: [
              { contactType: 'WHATSAPP', value: '+573123456789', isPrimary: true }
            ],
            socialLinks: [
              { platform: 'INSTAGRAM', url: 'https://instagram.com/laterraza_armenia' }
            ],
            openingHours: [
              { weekday: 4, openTime: '1970-01-01T18:00:00.000Z', closeTime: '1970-01-01T23:59:00.000Z', isClosed: false },
              { weekday: 5, openTime: '1970-01-01T18:00:00.000Z', closeTime: '1970-01-02T02:00:00.000Z', isClosed: false }
            ]
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
