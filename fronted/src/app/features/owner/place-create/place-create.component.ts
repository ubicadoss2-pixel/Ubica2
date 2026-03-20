import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CatalogsService } from '../../../core/services/catalogs.service';
import { PlacesService } from '../../../core/services/places.service';
import { PlansService, UserPlan } from '../../../core/services/plans.service';

@Component({
  selector: 'app-place-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './place-create.component.html',
  styleUrl: './place-create.component.scss',
})
export class PlaceCreateComponent {
  private readonly fb = inject(FormBuilder);
  private readonly catalogsService = inject(CatalogsService);
  private readonly placesService = inject(PlacesService);
  private readonly plansService = inject(PlansService);

  readonly cities = signal<Array<{ id: string; name: string }>>([]);
  readonly placeTypes = signal<Array<{ id: string; name: string }>>([]);
  readonly error = signal<string | null>(null);
  readonly info = signal<string | null>(null);

  readonly currentStep = signal(1);
  readonly totalSteps = 3;

  readonly myPlan = signal<UserPlan | null>(null);
  readonly maxPhotos = signal(3); // Por defecto 3
  readonly photos = signal<string[]>([]);
  readonly photoUrlInput = signal<string>('');

  readonly form = this.fb.nonNullable.group({
    cityId: ['', Validators.required],
    placeTypeId: ['', Validators.required],
    name: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    addressLine: [''],
    neighborhood: [''],
    latitude: [''],
    longitude: [''],
    priceLevel: [''],
    status: ['PUBLISHED'],
    contactValue: [''],
    contactType: ['PHONE'],
  });

  constructor() {
    this.catalogsService.getCities().subscribe((items) => this.cities.set(items));
    this.catalogsService.getPlaceTypes().subscribe((items) => this.placeTypes.set(items));
    this.plansService.getMyPlan().subscribe((p) => {
      this.myPlan.set(p);
      if (p && Number(p.plan.price) > 0) {
        this.maxPhotos.set(10); // Plan Premium o superior
      } else {
        this.maxPhotos.set(3); // Plan Básico
      }
    });
  }

  nextStep(): void {
    if (this.currentStep() < this.totalSteps) {
      // Validaciones basicas antes de avanzar
      if (this.currentStep() === 1 && (!this.form.value.name || !this.form.value.placeTypeId)) {
         this.error.set('Por favor completa el nombre y categoría.');
         return;
      }
      if (this.currentStep() === 2 && !this.form.value.cityId) {
         this.error.set('Por favor selecciona una ciudad válida.');
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
      this.error.set(`Límite alcanzado: Tu plan solo permite hasta ${this.maxPhotos()} fotos.`);
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
      cityId: values.cityId,
      placeTypeId: values.placeTypeId,
      name: values.name,
      description: values.description || undefined,
      addressLine: values.addressLine || undefined,
      neighborhood: values.neighborhood || undefined,
      latitude: values.latitude ? Number(values.latitude) : undefined,
      longitude: values.longitude ? Number(values.longitude) : undefined,
      priceLevel: values.priceLevel ? Number(values.priceLevel) : undefined,
      status: values.status,
    };

    if (values.contactValue) {
      payload.contacts = [
        {
          contactType: values.contactType,
          value: values.contactValue,
          isPrimary: true,
        },
      ];
    }

    if (this.photos().length > 0) {
      payload.photos = this.photos();
    }

    this.placesService.create(payload).subscribe({
      next: (place) => {
        this.info.set(`Lugar creado: ${place.name}`);
        this.error.set(null);
        // Reset form to go again or navigate away
        this.form.reset();
        this.currentStep.set(1);
        this.photos.set([]);
      },
      error: (err) => this.error.set(err?.error?.message ?? 'No fue posible crear el lugar.'),
    });
  }
}
