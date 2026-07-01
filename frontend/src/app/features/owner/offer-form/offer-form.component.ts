import { CommonModule } from '@angular/common';
import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { OffersService } from '../../../core/services/offers.service';
import { PlacesService } from '../../../core/services/places.service';
import { AuthStoreService } from '../../../core/services/auth-store.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Offer } from '../../../core/models/feature.models';

@Component({
  selector: 'app-offer-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="form-page">
      <div class="page-header">
        <h1>{{ isEditing() ? 'Editar Oferta' : 'Crear Oferta' }}</h1>
        <p class="subtitle">{{ isEditing() ? 'Modifica los detalles de tu oferta.' : 'Crea una nueva oferta informativa.' }}</p>
      </div>

      <div class="error-banner" *ngIf="error()">{{ error() }}</div>

      <form [formGroup]="form" (ngSubmit)="submit()" class="card-form">
        <div class="form-section">
          <h2 class="section-title">Información Principal</h2>

          <div class="form-group">
            <label for="placeId">Lugar <span class="required">*</span></label>
            <select id="placeId" formControlName="placeId" class="form-control">
              <option value="">Selecciona un lugar</option>
              <option *ngFor="let place of places()" [value]="place.id">{{ place.name }}</option>
            </select>
          </div>

          <div class="form-group">
            <label for="title">Título de la Oferta <span class="required">*</span></label>
            <input id="title" type="text" formControlName="title" class="form-control" placeholder="Ej: Happy Hour 2x1 en Cócteles">
          </div>

          <div class="form-group">
            <label for="description">Descripción</label>
            <textarea id="description" formControlName="description" class="form-control" rows="3" placeholder="Detalles de la oferta..."></textarea>
          </div>

          <div class="form-group">
            <label for="conditions">Condiciones (Opcional)</label>
            <textarea id="conditions" formControlName="conditions" class="form-control" rows="2" placeholder="Ej: Válido solo de lunes a jueves"></textarea>
          </div>

          <div class="form-group">
            <label>Imagen de la Oferta (Opcional)</label>
            <div class="image-upload-area"
                 [class.drag-over]="isDragOver()"
                 (dragover)="onDragOver($event)"
                 (dragleave)="onDragLeave($event)"
                 (drop)="onDrop($event)">
              
              <div class="upload-placeholder" *ngIf="!imageUrl()">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                <p>Arrastra una imagen o <span>explora</span></p>
                <input type="file" accept="image/*" (change)="onFileSelected($event)">
              </div>

              <div class="image-preview" *ngIf="imageUrl()">
                <img [src]="imageUrl()" alt="Preview">
                <button type="button" class="btn-remove-img" (click)="removeImage()" title="Eliminar imagen">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="form-section">
          <h2 class="section-title">Vigencia y Estado</h2>
          
          <div class="form-row">
            <div class="form-group">
              <label for="startDate">Fecha de Inicio <span class="required">*</span></label>
              <input id="startDate" type="datetime-local" formControlName="startDate" class="form-control">
            </div>
            <div class="form-group">
              <label for="endDate">Fecha de Fin <span class="required">*</span></label>
              <input id="endDate" type="datetime-local" formControlName="endDate" class="form-control">
            </div>
          </div>

          <div class="form-group checkbox-group" style="display:flex; align-items:center; gap:0.5rem; margin-top:1rem;">
            <input type="checkbox" id="isActive" formControlName="isActive" style="width: 1.2rem; height: 1.2rem;">
            <label for="isActive" style="margin:0; font-weight: 600;">Activar Oferta inmediatamente</label>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn-cancel" routerLink="/owner/offers">Cancelar</button>
          <button type="submit" class="btn-primary" [disabled]="loading() || form.invalid">
            <span *ngIf="loading()" class="spinner-small"></span>
            {{ isEditing() ? 'Guardar Cambios' : 'Crear Oferta' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .form-page {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      background: var(--surface-main);
      min-height: 100vh;
    }

    .page-header {
      margin-bottom: 2rem;
      h1 { margin: 0 0 0.5rem; color: var(--ink-primary); font-size: 2rem; }
      .subtitle { margin: 0; color: var(--text-secondary); font-size: 1rem; }
    }

    .card-form {
      background: var(--surface-card);
      border-radius: 16px;
      padding: 2rem;
      box-shadow: var(--shadow-sm);
      border: 1px solid var(--border-quiet);
    }

    .form-section {
      margin-bottom: 2.5rem;
      &:last-of-type { margin-bottom: 2rem; }
    }

    .section-title {
      font-size: 1.2rem;
      color: var(--identity-glow);
      margin: 0 0 1.5rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--border-quiet);
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }

    .form-group {
      margin-bottom: 1.25rem;
      label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 600;
        color: var(--ink-primary);
        font-size: 0.9rem;
      }
      .required { color: #dc2626; }
    }

    .form-control {
      width: 100%;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      border: 1px solid var(--border-quiet);
      background: var(--surface-soft);
      color: var(--ink-primary);
      font-family: inherit;
      font-size: 0.95rem;
      transition: all 0.2s;
      
      &:focus {
        outline: none;
        border-color: var(--identity-glow);
        box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
      }
    }

    textarea.form-control { resize: vertical; }

    .image-upload-area {
      border: 2px dashed var(--border-quiet);
      border-radius: 12px;
      padding: 2rem;
      text-align: center;
      background: var(--surface-soft);
      transition: all 0.2s;
      position: relative;
      
      &.drag-over {
        border-color: var(--identity-glow);
        background: rgba(124, 58, 237, 0.05);
      }
      
      .upload-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        color: var(--text-secondary);
        
        svg { color: var(--border-quiet); }
        span { color: var(--identity-glow); font-weight: 600; cursor: pointer; }
        input[type="file"] {
          position: absolute;
          inset: 0;
          opacity: 0;
          cursor: pointer;
        }
      }

      .image-preview {
        position: relative;
        display: inline-block;
        border-radius: 8px;
        overflow: hidden;
        border: 1px solid var(--border-quiet);
        max-width: 100%;
        max-height: 200px;
        
        img { width: 100%; height: 100%; object-fit: contain; display: block; }
        
        .btn-remove-img {
          position: absolute;
          top: 0.5rem; right: 0.5rem;
          background: rgba(0,0,0,0.5);
          color: white;
          border: none;
          border-radius: 50%;
          width: 24px; height: 24px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: background 0.2s;
          &:hover { background: #dc2626; }
        }
      }
    }

    .error-banner {
      background: #fee2e2;
      color: #dc2626;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      font-weight: 500;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border-quiet);
    }

    .btn-cancel {
      padding: 0.75rem 1.5rem;
      background: transparent;
      border: 1px solid var(--border-quiet);
      border-radius: 8px;
      color: var(--ink-primary);
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      &:hover { background: var(--surface-soft); }
    }

    .btn-primary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: var(--identity-glow);
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      &:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3); }
      &:disabled { opacity: 0.6; cursor: not-allowed; }
    }

    .spinner-small {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 640px) {
      .form-row { grid-template-columns: 1fr; gap: 0; }
      .form-actions { flex-direction: column-reverse; }
      .btn-cancel, .btn-primary { width: 100%; text-align: center; justify-content: center; }
    }
  `]
})
export class OfferFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly offersService = inject(OffersService);
  private readonly placesService = inject(PlacesService);
  private readonly authStore = inject(AuthStoreService);
  private readonly notificationService = inject(NotificationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isEditing = signal(false);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly places = signal<Array<{ id: string; name: string }>>([]);
  readonly imageUrl = signal<string | null>(null);
  readonly isDragOver = signal(false);
  
  private offerId: string | null = null;

  readonly form = this.fb.nonNullable.group({
    placeId: ['', Validators.required],
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    conditions: [''],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    isActive: [true]
  });

  ngOnInit() {
    this.loadPlaces();
    
    this.offerId = this.route.snapshot.paramMap.get('id');
    if (this.offerId) {
      this.isEditing.set(true);
      this.loadOffer(this.offerId);
    } else {
      // Default dates
      const now = new Date();
      const nextMonth = new Date();
      nextMonth.setMonth(now.getMonth() + 1);
      
      this.form.patchValue({
        startDate: now.toISOString().slice(0, 16),
        endDate: nextMonth.toISOString().slice(0, 16)
      });
    }
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
          this.imageUrl.set(canvas.toDataURL('image/jpeg', 0.8));
        } else {
          this.imageUrl.set(base64Url);
        }
      };
      img.onerror = () => {
        this.imageUrl.set(base64Url);
      };
      img.src = base64Url;
    };
    reader.onerror = () => {
      this.error.set('No se pudo leer la imagen');
    };
    reader.readAsDataURL(file);
  }

  removeImage() {
    this.imageUrl.set(null);
  }

  private loadPlaces() {
    const user = this.authStore.user();
    if (user) {
      this.placesService.list({ pageSize: 100, ownerId: user.id }).subscribe({
        next: (res) => this.places.set(res.items)
      });
    }
  }

  private loadOffer(id: string) {
    this.loading.set(true);
    // There is no getById in the service right now. We must fetch all from owner and find it.
    this.offersService.getByOwner().subscribe({
      next: (offers) => {
        const offer = offers.find(o => o.id === id);
        if (offer) {
          this.form.patchValue({
            placeId: offer.placeId,
            title: offer.title,
            description: offer.description || '',
            conditions: offer.conditions || '',
            startDate: new Date(offer.startDate).toISOString().slice(0, 16),
            endDate: new Date(offer.endDate).toISOString().slice(0, 16),
            isActive: offer.status === 'ACTIVE'
          });
          if (offer.imageUrl) {
            this.imageUrl.set(offer.imageUrl);
          }
        } else {
          this.error.set('Oferta no encontrada.');
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error al cargar la oferta.');
        this.loading.set(false);
      }
    });
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Por favor, completa los campos obligatorios correctamente.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const formVal = this.form.getRawValue();
    const payload: Partial<Offer> = {
      placeId: formVal.placeId,
      title: formVal.title,
      description: formVal.description,
      conditions: formVal.conditions,
      imageUrl: this.imageUrl() || '',
      startDate: new Date(formVal.startDate).toISOString(),
      endDate: new Date(formVal.endDate).toISOString(),
      status: formVal.isActive ? 'ACTIVE' : 'INACTIVE'
    };

    if (this.isEditing() && this.offerId) {
      this.offersService.update(this.offerId, payload).subscribe({
        next: () => {
          this.notificationService.success('Oferta Actualizada', 'La oferta se actualizó correctamente.');
          this.router.navigate(['/owner/offers']);
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(err?.error?.error || 'Ocurrió un error al actualizar la oferta.');
        }
      });
    } else {
      this.offersService.create(payload).subscribe({
        next: () => {
          this.notificationService.success('Oferta Creada', 'La nueva oferta se ha creado.');
          this.router.navigate(['/owner/offers']);
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(err?.error?.error || 'Ocurrió un error al crear la oferta.');
        }
      });
    }
  }
}
