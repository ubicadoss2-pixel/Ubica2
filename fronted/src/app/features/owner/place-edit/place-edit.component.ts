import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CatalogsService } from '../../../core/services/catalogs.service';
import { PlacesService } from '../../../core/services/places.service';
import { PlansService, UserPlan } from '../../../core/services/plans.service';

@Component({
  selector: 'app-place-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './place-edit.component.html',
  styleUrl: '../place-create/place-create.component.scss', // Reusing SCSS
})
export class PlaceEditComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly catalogsService = inject(CatalogsService);
  private readonly placesService = inject(PlacesService);
  private readonly plansService = inject(PlansService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly cities = signal<Array<{ id: string; name: string }>>([]);
  readonly placeTypes = signal<Array<{ id: string; name: string }>>([]);
  readonly error = signal<string | null>(null);
  readonly info = signal<string | null>(null);

  readonly currentStep = signal(1);
  readonly totalSteps = 3;
  readonly placeId = signal<string | null>(null);

  readonly myPlan = signal<UserPlan | null>(null);
  readonly maxPhotos = signal(3);
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

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.placeId.set(id);
      this.loadPlace(id);
    }

    this.catalogsService.getCities().subscribe((items) => this.cities.set(items));
    this.catalogsService.getPlaceTypes().subscribe((items) => this.placeTypes.set(items));
    this.plansService.getMyPlan().subscribe((p) => {
      this.myPlan.set(p);
      this.maxPhotos.set(p && Number(p.plan.price) > 0 ? 10 : 3);
    });
  }

  loadPlace(id: string) {
    this.placesService.getById(id).subscribe({
      next: (place) => {
        this.form.patchValue({
          cityId: place.cityId,
          placeTypeId: place.placeTypeId,
          name: place.name,
          description: place.description || '',
          addressLine: place.addressLine || '',
          neighborhood: place.neighborhood || '',
          latitude: place.latitude?.toString() || '',
          longitude: place.longitude?.toString() || '',
          priceLevel: place.priceLevel?.toString() || '',
          status: place.status,
          contactValue: place.contacts?.[0]?.value || '',
          contactType: place.contacts?.[0]?.contactType || 'PHONE',
        });
        if (place.photos) {
          this.photos.set(place.photos.map(p => p.url));
        }
      },
      error: () => this.error.set('No se pudo cargar la información del lugar.')
    });
  }

  nextStep(): void {
    if (this.currentStep() < this.totalSteps) {
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
      this.error.set(`Límite de fotos alcanzado.`);
      return;
    }
    this.photos.update(p => [...p, url]);
    this.error.set(null);
  }

  removePhoto(index: number): void {
    this.photos.update(p => p.filter((_, i) => i !== index));
  }

  submit(): void {
    if (this.form.invalid || !this.placeId()) return;

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
      photos: this.photos(),
    };

    this.placesService.update(this.placeId()!, payload).subscribe({
      next: () => {
        this.info.set('Lugar actualizado correctamente.');
        setTimeout(() => this.router.navigate(['/profile']), 2000);
      },
      error: (err) => this.error.set(err?.error?.message ?? 'Error al actualizar.')
    });
  }
}
