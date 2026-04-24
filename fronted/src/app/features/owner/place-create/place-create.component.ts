import { CommonModule } from '@angular/common';
import { Component, inject, signal, OnInit, AfterViewInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CatalogsService } from '../../../core/services/catalogs.service';
import { PlacesService } from '../../../core/services/places.service';
import { PlansService, UserPlan } from '../../../core/services/plans.service';
import { AppStateService } from '../../../core/services/app-state.service';
import * as L from 'leaflet';

@Component({
  selector: 'app-place-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './place-create.component.html',
  styleUrl: './place-create.component.scss',
})
export class PlaceCreateComponent implements OnInit, AfterViewInit {
  private readonly fb = inject(FormBuilder);
  private readonly catalogsService = inject(CatalogsService);
  private readonly placesService = inject(PlacesService);
  private readonly plansService = inject(PlansService);
  private readonly router = inject(Router);
  private readonly appState = inject(AppStateService);

  readonly cities = signal<Array<{ id: string; name: string }>>([]);
  readonly placeTypes = signal<Array<{ id: string; name: string }>>([]);
  readonly error = signal<string | null>(null);
  readonly info = signal<string | null>(null);
  readonly loading = signal(false);

  readonly myPlan = signal<UserPlan | null>(null);
  readonly maxPhotos = signal(3);
  readonly photos = signal<string[]>([]);
  readonly photoUrlInput = signal<string>('');
  readonly isDragOver = signal(false);

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

  constructor() {
    this.catalogsService.getCities().subscribe((items) => this.cities.set(items));
    this.catalogsService.getPlaceTypes().subscribe((items) => this.placeTypes.set(items));
    this.loadMyPlan();
  }

  ngOnInit(): void {
    this.form.valueChanges.subscribe(() => this.updateMapMarker());
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initMiniMap(), 100);
  }

  private initMiniMap(): void {
    const mapEl = document.getElementById('create-map');
    if (!mapEl) return;

    const defaultCenter: L.LatLngExpression = [4.5401, -75.6657];

    this.map = L.map('create-map', {
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
        this.error.set('Necesitas un plan activo para crear lugares. Ve a Planes.');
      },
    });
  }

  addPhoto(url: string): void {
    if (!url.trim()) return;
    if (this.photos().length >= this.maxPhotos()) {
      this.error.set(`Límite alcanzado: Tu plan solo permite hasta ${this.maxPhotos()} fotos.`);
      return;
    }
    this.photos.update((p) => [...p, url]);
    this.error.set(null);
  }

  removePhoto(index: number): void {
    this.photos.update((p) => p.filter((_, i) => i !== index));
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver.set(false);
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  private handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      this.error.set('Por favor, selecciona una imagen válida.');
      return;
    }

    if (this.photos().length >= this.maxPhotos()) {
      this.error.set(`Límite alcanzado: Tu plan solo permite hasta ${this.maxPhotos()} fotos.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Url = e.target?.result as string;
      this.addPhoto(base64Url);
    };
    reader.onerror = () => {
      this.error.set('Error al leer la imagen.');
    };
    reader.readAsDataURL(file);
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
        this.loading.set(false);
        this.info.set(`¡Perfecto! "${place.name}" ha sido creado exitosamente.`);

        this.appState.triggerPlacesRefresh();

        setTimeout(() => {
          this.router.navigate(['/'], {
            queryParams: { lat: place.latitude, lng: place.longitude, placeId: place.id },
          });
        }, 2000);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'No fue posible crear el lugar. Intenta de nuevo.');
      },
    });
  }
}
