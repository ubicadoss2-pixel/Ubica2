import { CommonModule } from '@angular/common';
import { NotificationService } from '../../core/services/notification.service';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';
import { Component, effect, inject, OnInit, signal, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CatalogItem, City, EventItem } from '../../core/models/api.models';
import { CatalogsService } from '../../core/services/catalogs.service';
import { EventsService } from '../../core/services/events.service';
import { AppStateService } from '../../core/services/app-state.service';
import { AuthStoreService } from '../../core/services/auth-store.service';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { environment } from '../../../environments/environment';
import { of } from 'rxjs';
import { timeout, catchError } from 'rxjs/operators';
import { EventCardComponent } from '../../shared/components/event-card/event-card.component';

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslatePipe, EventCardComponent, SkeletonComponent],
  templateUrl: './agenda.component.html',
  styleUrl: './agenda.component.scss',
})
export class AgendaComponent implements OnInit {
  @ViewChild('carouselContainer') carouselContainer?: ElementRef<HTMLDivElement>;

  private readonly fb = inject(FormBuilder);
  private readonly eventsService = inject(EventsService);
  private readonly catalogsService = inject(CatalogsService);
  private readonly appState = inject(AppStateService);
  readonly authStore = inject(AuthStoreService);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiBaseUrl;

  readonly cities = signal<City[]>([]);
  readonly categories = signal<CatalogItem[]>([]);
  readonly events = signal<EventItem[]>([]);
  readonly todayEvents = signal<EventItem[]>([]);
  readonly loading = signal(false);
  private readonly notificationService = inject(NotificationService);

  readonly form = this.fb.nonNullable.group({
    cityId: '',
    categoryId: '',
    weekday: '',
    date: '',
    time: '',
    pageSize: 20,
  });

  constructor() {
    this.catalogsService.getCities().subscribe((cities) => {
      const armeniaOnly = cities.filter(c => c.name.toLowerCase() === 'armenia');
      this.cities.set(armeniaOnly);
    });
    this.catalogsService.getEventCategories().subscribe((cats) => this.categories.set(cats));
    this.loadAgenda();
    this.loadTodayEvents();

    // Listen for app state changes to reload data
    this.appState.refreshEvents$.subscribe(() => {
      console.log('[AGENDA] Refreshing events...');
      this.loadAgenda();
      this.loadTodayEvents();
    });


  }

  ngOnInit() {
    this.form.valueChanges.subscribe(() => {
      this.loadAgenda();
    });
  }

  onFilter(): void {
    this.loadAgenda();
    this.scrollToGrid();
  }

  scrollToGrid(): void {
    const element = document.getElementById('events-grid');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  viewOnMap(event: EventItem): void {
    const queryParams: any = { placeId: event.placeId, eventId: event.id };
    const lat = event.latitude ?? event.place?.latitude;
    const lng = event.longitude ?? event.place?.longitude;
    
    // Check if coordinates exist
    if (lat && lng) {
      queryParams.lat = Number(lat);
      queryParams.lng = Number(lng);
      this.router.navigate(['/'], { queryParams });
    } else {
      // Fallback: Notify user that coordinates are not available for this event
      this.notificationService.error('Agenda', 'No hay coordenadas disponibles para este evento.');
      
    }
  }

  generateRoute(event: EventItem): void {
    const queryParams: any = { placeId: event.placeId, eventId: event.id, route: 'true' };
    const lat = event.latitude ?? event.place?.latitude;
    const lng = event.longitude ?? event.place?.longitude;

    if (lat && lng) {
      queryParams.lat = Number(lat);
      queryParams.lng = Number(lng);
      this.router.navigate(['/'], { queryParams });
    } else {
      this.notificationService.error('Agenda', 'No hay coordenadas para calcular la ruta de este evento.');
      
    }
  }


  clearFilters(): void {
    this.form.reset({
      cityId: '',
      categoryId: '',
      weekday: '',
      date: '',
      time: '',
      pageSize: 20,
    });
  }

  formatEventTime(timeStr: string | null | undefined): string {
    if (!timeStr) return '';
    if (timeStr.includes('T')) {
      return new Date(timeStr).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    }
    if (timeStr.includes(':')) {
      const parts = timeStr.split(':');
      const d = new Date();
      d.setHours(Number(parts[0]));
      d.setMinutes(Number(parts[1]));
      return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    }
    return timeStr;
  }

  private loadTodayEvents(): void {
    const today = new Date().toISOString().split('T')[0];
    this.eventsService.listAgenda({ date: today, pageSize: 15 })
    .pipe(
      timeout(15000),
      catchError((err: any) => {
        console.warn('[AGENDA] Error loading today events:', err);
        return of({ items: [] });
      })
    )
    .subscribe({
      next: (response: any) => {
        // Filtrar duplicados por título
        const uniqueItems = response.items.reduce((acc: EventItem[], current: any) => {
          const x = acc.find(item => item.title === current.title);
          if (!x) return acc.concat([current]);
          else return acc;
        }, []);

        this.todayEvents.set(uniqueItems);
      },
      error: (err) => {
        console.error('Error loading today events:', err);
      }
    });
  }

  scrollCarousel(direction: number): void {
    if (!this.carouselContainer) return;
    const container = this.carouselContainer.nativeElement;
    const scrollAmount = container.clientWidth * 0.8;
    container.scrollBy({
      left: direction * scrollAmount,
      behavior: 'smooth'
    });
  }

  private loadAgenda(): void {
    this.loading.set(true);
    

    this.eventsService.listAgenda(this.form.getRawValue())
    .pipe(timeout(2000))
    .subscribe({
      next: (response) => {
        // Filtrar duplicados por título
        const uniqueItems = response.items.reduce((acc: EventItem[], current) => {
          const x = acc.find(item => item.title === current.title);
          if (!x) return acc.concat([current]);
          else return acc;
        }, []);

        this.events.set(uniqueItems);
        this.loading.set(false);
      },
      error: (err) => {
        this.notificationService.error('Error', err?.error?.message ?? 'Modo offline: Mostrando eventos destacados.');
        
        // Fallback mock events for the main agenda list
        const fallbackEvents: any[] = [
          { id: 'e1', title: 'Cata de Café Sensorial', placeId: 'mock-real-1', categoryId: 'cat1', startTime: new Date().toISOString(), currency: 'COP', status: 'ACTIVE', category: { name: 'Cultura' }, place: { name: 'Café del Norte', latitude: 4.555, longitude: -75.661 }, photos: [{ url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=60' }] },
          { id: 'e2', title: 'Noche de Jazz & Blues', placeId: 'mock-real-2', categoryId: 'cat2', startTime: new Date().toISOString(), currency: 'COP', status: 'ACTIVE', category: { name: 'Música' }, place: { name: 'El Solar Gastrobar', latitude: 4.5495, longitude: -75.6631 }, photos: [{ url: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=800&q=60' }] },
          { id: 'e3', title: 'Rumba Crossover: Tropical Glow', placeId: 'mock-real-3', categoryId: 'cat3', startTime: new Date().toISOString(), currency: 'COP', status: 'ACTIVE', category: { name: 'Rumba' }, place: { name: 'Dar Papaya', latitude: 4.540, longitude: -75.665 }, photos: [{ url: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=800&q=60' }] },
          { id: 'e4', title: 'Festival Gastronómico del Eje', placeId: 'mock-real-1', categoryId: 'cat4', startTime: new Date().toISOString(), currency: 'COP', status: 'ACTIVE', category: { name: 'Comida' }, place: { name: 'Restaurante La Fogata', latitude: 4.542, longitude: -75.662 }, photos: [{ url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=60' }] },
          { id: 'e5', title: 'Stand Up Comedy: Risas Propias', placeId: 'mock-real-bunker', categoryId: 'cat5', startTime: new Date().toISOString(), currency: 'COP', status: 'ACTIVE', category: { name: 'Teatro' }, place: { name: 'El Bunker', latitude: 4.545, longitude: -75.668 }, photos: [{ url: 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?auto=format&fit=crop&w=800&q=60' }] },
          { id: 'e6', title: 'Tarde de Picnic & Acústico', placeId: 'mock-real-4', categoryId: 'cat6', startTime: new Date().toISOString(), currency: 'COP', status: 'ACTIVE', category: { name: 'Aire Libre' }, place: { name: 'Parque de la Vida', latitude: 4.5451, longitude: -75.6620 }, photos: [{ url: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=60' }] }
        ];

        this.events.set(fallbackEvents);
        this.loading.set(false);
      },
    });
  }
}
