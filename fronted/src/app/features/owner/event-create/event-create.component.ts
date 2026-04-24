import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CatalogsService } from '../../../core/services/catalogs.service';
import { EventsService } from '../../../core/services/events.service';
import { PlacesService } from '../../../core/services/places.service';
import { PlansService, UserPlan } from '../../../core/services/plans.service';
import { AppStateService } from '../../../core/services/app-state.service';
import { AuthStoreService } from '../../../core/services/auth-store.service';

@Component({
  selector: 'app-event-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './event-create.component.html',
  styleUrl: '../place-create/place-create.component.scss',
})
export class EventCreateComponent {
  private readonly fb = inject(FormBuilder);
  private readonly eventsService = inject(EventsService);
  private readonly placesService = inject(PlacesService);
  private readonly catalogsService = inject(CatalogsService);
  private readonly plansService = inject(PlansService);
  private readonly router = inject(Router);
  private readonly appState = inject(AppStateService);
  private readonly authStore = inject(AuthStoreService);

  readonly places = signal<Array<{ id: string; name: string }>>([]);
  readonly categories = signal<Array<{ id: string; name: string }>>([]);
  readonly error = signal<string | null>(null);
  readonly info = signal<string | null>(null);
  readonly loading = signal(false);

  readonly myPlan = signal<UserPlan | null>(null);
  readonly maxPhotos = signal(3);
  readonly photos = signal<string[]>([]);
  readonly isDragOver = signal(false);

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
  });

  constructor() {
    const currentUser = this.authStore.user();
    if (currentUser) {
      this.placesService.list({ pageSize: 100, ownerId: currentUser.id }).subscribe((response) => this.places.set(response.items));
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

    if (this.photos().length > 0) {
      payload.photos = this.photos();
    }

    this.eventsService.create(payload).subscribe({
      next: (event) => {
        this.loading.set(false);
        this.info.set(`¡Perfecto! "${event.title}" ha sido creado exitosamente.`);
        
        this.appState.triggerPlacesRefresh();

        setTimeout(() => {
          this.router.navigate(['/agenda']);
        }, 2000);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'No fue posible crear el evento. Intenta de nuevo.');
      },
    });
  }
}
