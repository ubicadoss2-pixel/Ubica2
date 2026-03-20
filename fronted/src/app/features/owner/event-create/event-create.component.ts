import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CatalogsService } from '../../../core/services/catalogs.service';
import { EventsService } from '../../../core/services/events.service';
import { PlacesService } from '../../../core/services/places.service';
import { PlansService, UserPlan } from '../../../core/services/plans.service';

@Component({
  selector: 'app-event-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './event-create.component.html',
  styleUrl: './event-create.component.scss',
})
export class EventCreateComponent {
  private readonly fb = inject(FormBuilder);
  private readonly eventsService = inject(EventsService);
  private readonly placesService = inject(PlacesService);
  private readonly catalogsService = inject(CatalogsService);
  private readonly plansService = inject(PlansService);

  readonly places = signal<Array<{ id: string; name: string }>>([]);
  readonly categories = signal<Array<{ id: string; name: string }>>([]);
  readonly error = signal<string | null>(null);
  readonly info = signal<string | null>(null);

  readonly currentStep = signal(1);
  readonly totalSteps = 3;

  readonly myPlan = signal<UserPlan | null>(null);
  readonly maxPhotos = signal(3);
  readonly photos = signal<string[]>([]);
  readonly photoUrlInput = signal<string>('');

  readonly form = this.fb.nonNullable.group({
    placeId: ['', Validators.required],
    categoryId: [''],
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    addressLine: [''],
    neighborhood: [''],
    dressCode: [''],
    minAge: [''],
    currency: ['COP'],
    priceFrom: [''],
    priceTo: [''],
    startTime: ['', Validators.required],
    endTime: [''],
    status: ['ACTIVE'],
    recurrenceWeekday: [''],
    specialDate: [''],
  });

  constructor() {
    this.placesService.list({ pageSize: 100 }).subscribe((response) => this.places.set(response.items));
    this.catalogsService.getEventCategories().subscribe((items) => this.categories.set(items));
    this.plansService.getMyPlan().subscribe((p) => {
      this.myPlan.set(p);
      this.maxPhotos.set(p && Number(p.plan.price) > 0 ? 10 : 3);
    });
  }

  nextStep(): void {
    if (this.currentStep() < this.totalSteps) {
      if (this.currentStep() === 1 && (!this.form.value.title || !this.form.value.placeId)) {
        this.error.set('Por favor completa el título y el lugar principal.');
        return;
      }
      if (this.currentStep() === 2 && !this.form.value.startTime) {
        this.error.set('La fecha/hora de inicio es obligatoria.');
        return;
      }
      this.error.set(null);
      this.currentStep.set(this.currentStep() + 1);
    }
  }

  prevStep(): void {
    if (this.currentStep() > 1) {
      this.error.set(null);
      this.currentStep.set(this.currentStep() - 1);
    }
  }

  addPhoto(url: string): void {
    if (!url.trim()) return;
    if (this.photos().length >= this.maxPhotos()) {
      this.error.set(`Límite alcanzado: Tu plan permite hasta ${this.maxPhotos()} fotos.`);
      return;
    }
    this.photos.update(p => [...p, url]);
    this.photoUrlInput.set(''); 
    this.error.set(null);
  }

  removePhoto(index: number): void {
    this.photos.update(p => p.filter((_, i) => i !== index));
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const values = this.form.getRawValue();
    const payload: any = {
      placeId: values.placeId,
      categoryId: values.categoryId || undefined,
      title: values.title,
      description: values.description || undefined,
      addressLine: values.addressLine || undefined,
      neighborhood: values.neighborhood || undefined,
      dressCode: values.dressCode || undefined,
      minAge: values.minAge ? Number(values.minAge) : undefined,
      currency: values.currency || 'COP',
      priceFrom: values.priceFrom ? Number(values.priceFrom) : undefined,
      priceTo: values.priceTo ? Number(values.priceTo) : undefined,
      startTime: values.startTime,
      endTime: values.endTime || undefined,
      status: values.status,
    };

    if (values.recurrenceWeekday !== '') {
      payload.recurrence = { weekday: Number(values.recurrenceWeekday) };
    }

    if (values.specialDate) {
      payload.specialDates = [
        {
          eventDate: values.specialDate,
          dateType: 'OCCURRENCE',
        },
      ];
    }

    if (this.photos().length > 0) {
      payload.photos = this.photos();
    }

    this.eventsService.create(payload).subscribe({
      next: (event) => {
        this.info.set(`Evento creado: ${event.title}`);
        this.error.set(null);
        this.form.reset();
        this.currentStep.set(1);
        this.photos.set([]);
      },
      error: (err) => this.error.set(err?.error?.message ?? 'No fue posible crear el evento.'),
    });
  }
}
