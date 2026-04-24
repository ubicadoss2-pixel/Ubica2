import { CommonModule } from '@angular/common';
import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { CatalogItem, City, EventItem } from '../../core/models/api.models';
import { CatalogsService } from '../../core/services/catalogs.service';
import { EventsService } from '../../core/services/events.service';
import { AppStateService } from '../../core/services/app-state.service';

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './agenda.component.html',
  styleUrl: './agenda.component.scss',
})
export class AgendaComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly eventsService = inject(EventsService);
  private readonly catalogsService = inject(CatalogsService);
  private readonly appState = inject(AppStateService);
  private readonly router = inject(Router);

  readonly cities = signal<City[]>([]);
  readonly categories = signal<CatalogItem[]>([]);
  readonly events = signal<EventItem[]>([]);
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

    // Listen for app state changes to reload data
    effect(() => {
      const _ = this.appState.refreshPlaces$;
      console.log('[AGENDA] Refreshing events...');
      this.loadAgenda();
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

  private loadAgenda(): void {
    this.loading.set(true);
    this.error.set(null);

    this.eventsService.listAgenda(this.form.getRawValue()).subscribe({
      next: (response) => {
        this.events.set(response.items);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'No se pudo cargar la agenda.');
        this.loading.set(false);
      },
    });
  }
}
