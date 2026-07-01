import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../core/services/notification.service';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CatalogsService } from '../../../core/services/catalogs.service';
import { EventsService } from '../../../core/services/events.service';
import { PlacesService } from '../../../core/services/places.service';
import { PlansService, UserPlan } from '../../../core/services/plans.service';
import { AppStateService } from '../../../core/services/app-state.service';
import { AuthStoreService } from '../../../core/services/auth-store.service';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-event-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './event-edit.component.html',
  styleUrl: '../place-create/place-create.component.scss',
})
export class EventEditComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly notificationService = inject(NotificationService);
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
  
  
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly eventId = signal<string | null>(null);

  readonly myPlan = signal<UserPlan | null>(null);
  readonly maxPhotos = signal(3);
  readonly photos = signal<string[]>([]);
  readonly isDragOver = signal(false);

  readonly form = this.fb.nonNullable.group({
    placeId: ['', Validators.required],
    categoryId: [''],
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    dressCode: [''],
    minAge: [''],
    eventDate: ['', Validators.required],
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
    this.error.set(null);
    this.eventsService.getById(id).subscribe({
      next: (event) => {
        this.loading.set(false);
        const extractUTCString = (dateObjOrStr: any, type: 'date' | 'time') => {
          if (!dateObjOrStr) return '';
          const d = new Date(dateObjOrStr);
          if (isNaN(d.getTime())) return '';
          if (type === 'date') return d.toISOString().substring(0, 10);
          return d.getUTCHours().toString().padStart(2, '0') + ':' + d.getUTCMinutes().toString().padStart(2, '0');
        };

        this.form.patchValue({
          placeId: event.placeId,
          categoryId: event.categoryId || '',
          title: event.title,
          description: event.description || '',
          dressCode: (event as any).dressCode || '',
          minAge: (event as any).minAge || '',
          eventDate: event.eventDate || (event.specialDates?.[0] ? extractUTCString(event.specialDates[0].eventDate, 'date') : ''),
          startTime: event.startTime ? extractUTCString(event.startTime, 'time') : '',
          endTime: event.endTime ? extractUTCString(event.endTime, 'time') : '',
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
        this.error.set('No se pudo cargar el evento');
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
      
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const resizedBase64 = canvas.toDataURL('image/jpeg', 0.8);
          this.addPhoto(resizedBase64);
        } else {
          this.addPhoto(base64Url);
        }
      };
      img.onerror = () => {
        this.addPhoto(base64Url);
      };
      img.src = base64Url;
    };
    reader.onerror = () => {
      this.error.set('No se pudo leer la imagen');
    };
    reader.readAsDataURL(file);
  }

  submit(targetStatus: 'DRAFT' | 'ACTIVE' = 'ACTIVE'): void {
    if (targetStatus === 'ACTIVE' && this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Por favor, completa todos los campos requeridos correctamente.');
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
      dressCode: values.dressCode || undefined,
      minAge: values.minAge ? Number(values.minAge) : undefined,
      eventDate: values.eventDate,
      startTime: values.startTime,
      endTime: values.endTime || undefined,
      priceFrom: values.priceFrom ? Number(values.priceFrom) : undefined,
      priceTo: values.priceTo ? Number(values.priceTo) : undefined,
      currency: values.currency,
      status: targetStatus,
      photos: this.photos(),
    };

    this.eventsService.update(this.eventId()!, payload).subscribe({
      next: (event) => {
        this.loading.set(false);
        if (targetStatus === 'ACTIVE') {
          this.notificationService.show({ type: 'success', title: 'Éxito', message: 'Evento actualizado y publicado correctamente' });
        } else {
          this.notificationService.show({ type: 'info', title: 'Info', message: 'Evento guardado como borrador' });
        }
        
        this.appState.triggerPlacesRefresh();

        setTimeout(() => {
          this.router.navigate(['/owner/events']);
        }, 1500);
      },
      error: (err) => {
        this.loading.set(false);
        this.notificationService.show({ type: 'error', title: 'Error', message: err?.error?.message ?? 'No se pudo publicar el evento' });
      },
    });
  }
}
