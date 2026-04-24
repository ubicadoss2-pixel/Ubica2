import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, AfterViewInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CatalogsService } from '../../../core/services/catalogs.service';
import { PlacesService } from '../../../core/services/places.service';
import { PlansService, UserPlan } from '../../../core/services/plans.service';
import { AppStateService } from '../../../core/services/app-state.service';
import * as L from 'leaflet';

@Component({
  selector: 'app-place-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './place-edit.component.html',
  styleUrl: '../place-create/place-create.component.scss',
})
export class PlaceEditComponent implements OnInit, AfterViewInit {
  private readonly fb = inject(FormBuilder);
  private readonly catalogsService = inject(CatalogsService);
  private readonly placesService = inject(PlacesService);
  private readonly plansService = inject(PlansService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly appState = inject(AppStateService);

  readonly cities = signal<Array<{ id: string; name: string }>>([]);
  readonly placeTypes = signal<Array<{ id: string; name: string }>>([]);
  readonly error = signal<string | null>(null);
  readonly info = signal<string | null>(null);
  readonly loading = signal(false);

  readonly placeId = signal<string | null>(null);

  readonly myPlan = signal<UserPlan | null>(null);
  readonly maxPhotos = signal(3);
  readonly photos = signal<string[]>([]);

  private map?: L.Map;
  private marker?: L.Marker;

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
    this.loadMyPlan();

    this.form.valueChanges.subscribe(() => this.updateMapMarker());
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initMiniMap(), 100);
  }

  private loadMyPlan(): void {
    this.plansService.getMyPlan().subscribe({
      next: (p) => {
        this.myPlan.set(p);
        if (p && Number(p.plan.limitPlaces) > 1) {
          this.maxPhotos.set(10);
        } else {
          this.maxPhotos.set(3);
        }
      },
      error: () => {
        this.maxPhotos.set(3);
      },
    });
  }

  private initMiniMap(): void {
    const mapEl = document.getElementById('edit-map');
    if (!mapEl) return;

    const defaultCenter: L.LatLngExpression = [4.5401, -75.6657];

    this.map = L.map('edit-map', {
      center: defaultCenter,
      zoom: 13,
      zoomControl: true,
      dragging: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
    }).addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.form.patchValue({
        latitude: e.latlng.lat.toFixed(6),
        longitude: e.latlng.lng.toFixed(6),
      });
      this.updateMapMarker();
    });

    this.updateMapMarker();
  }

  private updateMapMarker(): void {
    if (!this.map) return;

    const lat = this.form.value.latitude ? Number(this.form.value.latitude) : null;
    const lng = this.form.value.longitude ? Number(this.form.value.longitude) : null;

    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
      if (this.marker) {
        this.marker.setLatLng([lat, lng]);
      } else {
        const icon = L.divIcon({
          className: 'create-marker',
          html: '<div style="background: #4f46e5; width: 24px; height: 24px; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
        this.marker = L.marker([lat, lng], { icon }).addTo(this.map);
      }
      this.map.setView([lat, lng], 15);
    }
  }

  loadPlace(id: string) {
    this.loading.set(true);
    this.placesService.getById(id).subscribe({
      next: (place) => {
        this.loading.set(false);
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
        setTimeout(() => this.updateMapMarker(), 200);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('No se pudo cargar la información del lugar.');
      }
    });
  }

  addPhoto(url: string): void {
    if (!url.trim()) return;
    if (this.photos().length >= this.maxPhotos()) {
      this.error.set(`Límite alcanzado: Tu plan solo permite hasta ${this.maxPhotos()} fotos.`);
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

    if (values.contactValue) {
      payload.contacts = [
        {
          contactType: values.contactType,
          value: values.contactValue,
          isPrimary: true,
        },
      ];
    }

    this.placesService.update(this.placeId()!, payload).subscribe({
      next: (place) => {
        this.loading.set(false);
        this.info.set('¡Perfecto! Los cambios han sido guardados exitosamente.');
        
        this.appState.triggerPlacesRefresh();

        setTimeout(() => {
          this.router.navigate(['/'], {
            queryParams: { lat: place.latitude, lng: place.longitude, placeId: place.id },
          });
        }, 2000);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'No fue posible guardar los cambios. Intenta de nuevo.');
      },
    });
  }
}
