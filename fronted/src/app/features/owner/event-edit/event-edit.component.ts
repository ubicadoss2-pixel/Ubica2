import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CatalogsService } from '../../../core/services/catalogs.service';
import { EventsService } from '../../../core/services/events.service';
import { PlacesService } from '../../../core/services/places.service';
import { PlansService, UserPlan } from '../../../core/services/plans.service';
import { AppStateService } from '../../../core/services/app-state.service';
import { AuthStoreService } from '../../../core/services/auth-store.service';

@Component({
  selector: 'app-event-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './event-edit.component.html',
  styleUrl: '../place-create/place-create.component.scss',
})
export class EventEditComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly catalogsService = inject(CatalogsService);
  private readonly eventsService = inject(EventsService);
  private readonly placesService = inject(PlacesService);
  private readonly plansService = inject(PlansService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly appState = inject(AppStateService);
  private readonly authStore = inject(AuthStoreService);

  readonly myPlaces = signal<Array<{ id: string; name: string }>>([]);
  readonly categories = signal<Array<{ id: string; name: string }>>([]);
  readonly error = signal<string | null>(null);
  readonly info = signal<string | null>(null);
  readonly loading = signal(false);

  readonly eventId = signal<string | null>(null);

  readonly myPlan = signal<UserPlan | null>(null);
  readonly maxPhotos = signal(3);
  readonly photos = signal<string[]>([]);

  readonly form = this.fb.nonNullable.group({
    placeId: ['', Validators.required],
    categoryId: [''],
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    startTime: ['', Validators.required],
    endTime: [''],
    priceFrom: [''],
    priceTo: [''],
    currency: ['COP'],
    status: ['ACTIVE'],
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.eventId.set(id);
      this.loadEvent(id);
    }

    const currentUser = this.authStore.user();
    if (currentUser) {
      this.placesService.list({ pageSize: 100, ownerId: currentUser.id }).subscribe((res) => this.myPlaces.set(res.items));
    }
    this.catalogsService.getEventCategories().subscribe((items) => this.categories.set(items));
    this.loadMyPlan();
  }

  private loadMyPlan(): void {
    this.plansService.getMyPlan().subscribe({
      next: (p) => {
        this.myPlan.set(p);
        if (p && Number(p.plan.limitEvents) > 3) {
          this.maxPhotos.set(10);
        } else {
          this.maxPhotos.set(3);
        }
      },
      error: () => {
        this.maxPhotos.set(3);
      }
    });
  }

  loadEvent(id: string) {
    this.loading.set(true);
    this.eventsService.getById(id).subscribe({
      next: (event) => {
        this.loading.set(false);
        this.form.patchValue({
          placeId: event.placeId,
          categoryId: event.categoryId || '',
          title: event.title,
          description: event.description || '',
          startTime: event.startTime ? event.startTime.substring(11, 16) : '',
          endTime: event.endTime ? event.endTime.substring(11, 16) : '',
          priceFrom: event.priceFrom?.toString() || '',
          priceTo: event.priceTo?.toString() || '',
          currency: event.currency,
          status: event.status as any,
        });
        const anyEvent = event as any;
        if (anyEvent.photos) {
          this.photos.set(anyEvent.photos.map((p: any) => p.url));
        }
      },
      error: () => {
        this.loading.set(false);
        this.error.set('No se pudo cargar el evento.');
      }
    });
  }

  addPhoto(url: string): void {
    if (!url.trim()) return;
    if (this.photos().length >= this.maxPhotos()) {
      this.error.set(`Límite alcanzado: Tu plan permite hasta ${this.maxPhotos()} fotos.`);
      return;
    }
    this.photos.update(p => [...p, url]);
    this.error.set(null);
  }

  removePhoto(index: number): void {
    this.photos.update(p => p.filter((_, i) => i !== index));
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Por favor completa todos los campos requeridos.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const values = this.form.getRawValue();
    const payload: any = {
      placeId: values.placeId,
      categoryId: values.categoryId || undefined,
      title: values.title,
      description: values.description || undefined,
      startTime: values.startTime,
      endTime: values.endTime || undefined,
      priceFrom: values.priceFrom ? Number(values.priceFrom) : undefined,
      priceTo: values.priceTo ? Number(values.priceTo) : undefined,
      currency: values.currency,
      status: values.status,
      photos: this.photos(),
    };

    this.eventsService.update(this.eventId()!, payload).subscribe({
      next: (event) => {
        this.loading.set(false);
        this.info.set('¡Perfecto! Los cambios han sido guardados exitosamente.');
        
        this.appState.triggerPlacesRefresh();

        setTimeout(() => {
          this.router.navigate(['/agenda']);
        }, 2000);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'No fue posible guardar los cambios. Intenta de nuevo.');
      },
    });
  }
}
