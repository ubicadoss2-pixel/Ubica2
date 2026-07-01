import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../core/services/notification.service';
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
  private readonly notificationService = inject(NotificationService);
  private readonly eventsService = inject(EventsService);
  private readonly placesService = inject(PlacesService);
  private readonly catalogsService = inject(CatalogsService);
  private readonly plansService = inject(PlansService);
  private readonly router = inject(Router);
  private readonly appState = inject(AppStateService);
  private readonly authStore = inject(AuthStoreService);
  

  readonly places = signal<Array<{ id: string; name: string }>>([]);
  readonly categories = signal<Array<{ id: string; name: string }>>([]);
  
  
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

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
    eventDate: ['', Validators.required],
    startTime: ['', Validators.required],
    endTime: [''],
    status: ['DRAFT'],
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
      this.error.set(`Máximo ${this.maxPhotos()} fotos.`);
      return;
    }
    this.photos.update(p => [...p, url]);
    
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
      this.error.set('Solo se permiten imágenes');
      return;
    }

    if (this.photos().length >= this.maxPhotos()) {
      this.error.set(`Máximo ${this.maxPhotos()} fotos.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Url = e.target?.result as string;
      this.addPhoto(base64Url);
    };
    reader.onerror = () => {
      this.error.set('No se pudo leer la imagen');
    };
    reader.readAsDataURL(file);
  }

  submit(targetStatus: 'DRAFT' | 'ACTIVE' = 'ACTIVE'): void {
    if (targetStatus === 'ACTIVE' && this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Por favor, revisa los campos en rojo');
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
      eventDate: values.eventDate,
      startTime: values.startTime,
      endTime: values.endTime || undefined,
      status: targetStatus,
    };

    if (this.photos().length > 0) {
      payload.photos = this.photos();
    }

    this.eventsService.create(payload).subscribe({
      next: (event) => {
        this.loading.set(false);
        if (targetStatus === 'ACTIVE') {
          this.notificationService.show({ type: 'success', title: 'Éxito', message: 'Evento publicado correctamente' });
        } else {
          this.notificationService.show({ type: 'info', title: 'Info', message: 'Evento guardado como borrador' });
        }
        
        this.appState.triggerPlacesRefresh();
        this.appState.triggerEventsRefresh();

        setTimeout(() => {
          this.router.navigate(['/owner/events']);
        }, 1500);
      },
      error: (err) => {
        this.loading.set(false);
        const errMsg = err.error?.message || err.message || 'Error desconocido';
        this.notificationService.show({ type: 'error', title: 'Error', message: 'No se pudo publicar el evento: ' + errMsg });
      },
    });
  }
}
