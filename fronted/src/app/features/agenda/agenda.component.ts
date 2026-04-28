import { CommonModule } from '@angular/common';
import { Component, effect, inject, OnInit, signal, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { CatalogItem, City, EventItem } from '../../core/models/api.models';
import { CatalogsService } from '../../core/services/catalogs.service';
import { EventsService } from '../../core/services/events.service';
import { AppStateService } from '../../core/services/app-state.service';
import { timeout } from 'rxjs/operators';

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './agenda.component.html',
  styleUrl: './agenda.component.scss',
})
export class AgendaComponent implements OnInit {
  @ViewChild('carouselContainer') carouselContainer?: ElementRef<HTMLDivElement>;

  private readonly fb = inject(FormBuilder);
  private readonly eventsService = inject(EventsService);
  private readonly catalogsService = inject(CatalogsService);
  private readonly appState = inject(AppStateService);
  private readonly router = inject(Router);

  readonly cities = signal<City[]>([]);
  readonly categories = signal<CatalogItem[]>([]);
  readonly events = signal<EventItem[]>([]);
  readonly todayEvents = signal<EventItem[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    cityId: '',
    categoryId: '',
    weekday: '',
    date: '',
    time: '',
    pageSize: 20,
  });

  constructor() {
    this.catalogsService.getCities().subscribe((cities) => this.cities.set(cities));
    this.catalogsService.getEventCategories().subscribe((cats) => this.categories.set(cats));
    this.loadAgenda();
    this.loadTodayEvents();

    // Listen for app state changes to reload data
    effect(() => {
      const _ = this.appState.refreshPlaces$;
      console.log('[AGENDA] Refreshing events...');
      this.loadAgenda();
      this.loadTodayEvents();
    });

    // Listen for route changes
    this.router.events.subscribe(() => {
      this.loadAgenda();
    });
  }

  ngOnInit() {
    this.form.valueChanges.subscribe(() => {
      this.loadAgenda();
    });
  }

  onFilter(): void {
    this.loadAgenda();
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

  private loadTodayEvents(): void {
    const today = new Date().toISOString().split('T')[0];
    this.eventsService.listAgenda({ date: today, pageSize: 15 })
    .pipe(timeout(2000))
    .subscribe({
      next: (response) => {
        if (response.items.length > 0) {
          this.todayEvents.set(response.items);
        } else {
          // Fallback to highly visual neon-themed mock events
          this.todayEvents.set([
            {
              id: 'm1',
              title: 'Techno Neon Underground',
              placeId: 'p1',
              categoryId: 'c1',
              startTime: new Date().toISOString(),
              currency: 'COP',
              status: 'ACTIVE',
              category: { name: 'Techno' } as any,
              place: { name: 'Cyber Club' } as any,
              photos: [{ url: 'https://images.unsplash.com/photo-1557124816-e9b7d5440de2?auto=format&fit=crop&w=800&q=60' }] as any
            },
            {
              id: 'm2',
              title: 'Jazz Lounge Glow',
              placeId: 'p2',
              categoryId: 'c2',
              startTime: new Date().toISOString(),
              currency: 'COP',
              status: 'ACTIVE',
              category: { name: 'Jazz' } as any,
              place: { name: 'The Glass Cafe' } as any,
              photos: [{ url: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=800&q=60' }] as any
            },
            {
              id: 'm3',
              title: 'Reggaeton Fusion Night',
              placeId: 'p3',
              categoryId: 'c3',
              startTime: new Date().toISOString(),
              currency: 'COP',
              status: 'ACTIVE',
              category: { name: 'Reggaeton' } as any,
              place: { name: 'Neon Rooftop' } as any,
              photos: [{ url: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=800&q=60' }] as any
            },
            {
              id: 'm4',
              title: 'Rock Echoes',
              placeId: 'p4',
              categoryId: 'c4',
              startTime: new Date().toISOString(),
              currency: 'COP',
              status: 'ACTIVE',
              category: { name: 'Rock' } as any,
              place: { name: 'Stone Stage' } as any,
              photos: [{ url: 'https://images.unsplash.com/photo-1459749411177-042180ce673f?auto=format&fit=crop&w=800&q=60' }] as any
            },
            {
              id: 'm5',
              title: 'Pop Sparkle Party',
              placeId: 'p5',
              categoryId: 'c5',
              startTime: new Date().toISOString(),
              currency: 'COP',
              status: 'ACTIVE',
              category: { name: 'Pop' } as any,
              place: { name: 'Glitter Bar' } as any,
              photos: [{ url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=60' }] as any
            },
            {
              id: 'm6',
              title: 'Deep House Vibes',
              placeId: 'p6',
              categoryId: 'c6',
              startTime: new Date().toISOString(),
              currency: 'COP',
              status: 'ACTIVE',
              category: { name: 'Electronic' } as any,
              place: { name: 'Deep Lounge' } as any,
              photos: [{ url: 'https://images.unsplash.com/photo-1571266028243-e4733b000be1?auto=format&fit=crop&w=800&q=60' }] as any
            }
          ]);
        }
      },
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
    this.error.set(null);

    this.eventsService.listAgenda(this.form.getRawValue())
    .pipe(timeout(2000))
    .subscribe({
      next: (response) => {
        this.events.set(response.items);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Modo offline: Mostrando eventos destacados.');
        
        // Fallback mock events for the main agenda list
        const fallbackEvents: any[] = [
          { id: 'm1', title: 'Techno Neon Underground', placeId: 'p1', categoryId: 'c1', startTime: new Date().toISOString(), currency: 'COP', status: 'ACTIVE', category: { name: 'Techno' }, place: { name: 'Cyber Club' }, photos: [{ url: 'https://images.unsplash.com/photo-1557124816-e9b7d5440de2?auto=format&fit=crop&w=800&q=60' }] },
          { id: 'm2', title: 'Jazz Lounge Glow', placeId: 'p2', categoryId: 'c2', startTime: new Date().toISOString(), currency: 'COP', status: 'ACTIVE', category: { name: 'Jazz' }, place: { name: 'The Glass Cafe' }, photos: [{ url: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=800&q=60' }] },
          { id: 'm3', title: 'Reggaeton Fusion Night', placeId: 'p3', categoryId: 'c3', startTime: new Date().toISOString(), currency: 'COP', status: 'ACTIVE', category: { name: 'Reggaeton' }, place: { name: 'Neon Rooftop' }, photos: [{ url: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=800&q=60' }] },
          { id: 'm4', title: 'Rock Echoes', placeId: 'p4', categoryId: 'c4', startTime: new Date().toISOString(), currency: 'COP', status: 'ACTIVE', category: { name: 'Rock' }, place: { name: 'Stone Stage' }, photos: [{ url: 'https://images.unsplash.com/photo-1459749411177-042180ce673f?auto=format&fit=crop&w=800&q=60' }] },
          { id: 'm5', title: 'Pop Sparkle Party', placeId: 'p5', categoryId: 'c5', startTime: new Date().toISOString(), currency: 'COP', status: 'ACTIVE', category: { name: 'Pop' }, place: { name: 'Glitter Bar' }, photos: [{ url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=60' }] },
          { id: 'm6', title: 'Deep House Vibes', placeId: 'p6', categoryId: 'c6', startTime: new Date().toISOString(), currency: 'COP', status: 'ACTIVE', category: { name: 'Electronic' }, place: { name: 'Deep Lounge' }, photos: [{ url: 'https://images.unsplash.com/photo-1571266028243-e4733b000be1?auto=format&fit=crop&w=800&q=60' }] }
        ];

        this.events.set(fallbackEvents);
        this.loading.set(false);
      },
    });
  }
}
