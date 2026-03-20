import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CatalogsService } from '../../../core/services/catalogs.service';
import { EventsService } from '../../../core/services/events.service';
import { PlacesService } from '../../../core/services/places.service';
import { PlansService, UserPlan } from '../../../core/services/plans.service';

@Component({
  selector: 'app-event-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './event-edit.component.html',
  styleUrl: '../event-create/event-create.component.scss',
})
export class EventEditComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly catalogsService = inject(CatalogsService);
  private readonly eventsService = inject(EventsService);
  private readonly placesService = inject(PlacesService);
  private readonly plansService = inject(PlansService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly myPlaces = signal<Array<{ id: string; name: string }>>([]);
  readonly categories = signal<Array<{ id: string; name: string }>>([]);
  readonly error = signal<string | null>(null);
  readonly info = signal<string | null>(null);

  readonly currentStep = signal(1);
  readonly totalSteps = 3;
  readonly eventId = signal<string | null>(null);

  readonly myPlan = signal<UserPlan | null>(null);
  readonly maxPhotos = signal(3);
  readonly photos = signal<string[]>([]);

  readonly form = this.fb.nonNullable.group({
    placeId: ['', Validators.required],
    categoryId: ['', Validators.required],
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    startTime: ['', Validators.required],
    endTime: [''],
    priceFrom: [''],
    priceTo: [''],
    currency: ['COP'],
    status: ['ACTIVE'],
    recurrenceWeekday: [''],
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.eventId.set(id);
      this.loadEvent(id);
    }

    this.catalogsService.getEventCategories().subscribe((items) => this.categories.set(items));
    this.placesService.list({ pageSize: 100 }).subscribe((res) => this.myPlaces.set(res.items));
    this.plansService.getMyPlan().subscribe((p) => {
      this.myPlan.set(p);
      this.maxPhotos.set(p && Number(p.plan.price) > 0 ? 10 : 3);
    });
  }

  loadEvent(id: string) {
    this.eventsService.getById(id).subscribe({
      next: (event) => {
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
          recurrenceWeekday: event.recurrence?.weekday?.toString() || '',
        });
        // Photos mapping if exist in EventItem
        const anyEvent = event as any;
        if (anyEvent.photos) {
          this.photos.set(anyEvent.photos.map((p: any) => p.url));
        }
      },
      error: () => this.error.set('No se pudo cargar el evento.')
    });
  }

  nextStep(): void {
    if (this.currentStep() < this.totalSteps) {
      this.currentStep.set(this.currentStep() + 1);
    }
  }

  prevStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.set(this.currentStep() - 1);
    }
  }

  addPhoto(url: string): void {
    if (url && this.photos().length < this.maxPhotos()) {
      this.photos.update(p => [...p, url]);
    }
  }

  removePhoto(index: number): void {
    this.photos.update(p => p.filter((_, i) => i !== index));
  }

  submit(): void {
    if (this.form.invalid || !this.eventId()) return;

    const values = this.form.getRawValue();
    const payload: any = {
      placeId: values.placeId,
      categoryId: values.categoryId,
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

    if (values.recurrenceWeekday) {
      payload.recurrence = { weekday: Number(values.recurrenceWeekday) };
    }

    this.eventsService.update(this.eventId()!, payload).subscribe({
      next: () => {
        this.info.set('Evento actualizado.');
        setTimeout(() => this.router.navigate(['/profile']), 2000);
      },
      error: (err) => this.error.set(err?.error?.message ?? 'Error al actualizar.')
    });
  }
}
