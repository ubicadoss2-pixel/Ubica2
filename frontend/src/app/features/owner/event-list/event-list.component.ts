import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EventsService } from '../../../core/services/events.service';
import { AuthStoreService } from '../../../core/services/auth-store.service';
import { AppStateService } from '../../../core/services/app-state.service';
import { NotificationService } from '../../../core/services/notification.service';
import { EventItem } from '../../../core/models/api.models';
import { environment } from '../../../../environments/environment';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [CommonModule, RouterLink, SkeletonComponent],
  template: `
    <div class="events-page">
      <div class="page-header">
        <div class="header-left">
          <h1>Mis Eventos</h1>
          <p class="header-subtitle">Eventos creados por ti en tus lugares</p>
        </div>
        <a routerLink="/owner/event/new" class="btn-primary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Crear Nuevo Evento
        </a>
      </div>

      <div class="events-grid" *ngIf="loading()">
        <app-skeleton *ngFor="let item of [1,2,3,4,5,6]" type="card" height="300px"></app-skeleton>
      </div>

      <div class="empty-state" *ngIf="!loading() && events().length === 0">
        <div class="empty-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        </div>
        <h2>No tienes eventos aún</h2>
        <p>Crea tu primer evento para comenzar a mostrarlo en la agenda de Ubica2</p>
        <a routerLink="/owner/event/new" class="btn-primary">Crear Mi Primer Evento</a>
      </div>

      <div class="events-grid" *ngIf="!loading() && events().length > 0">
        <div class="event-card" *ngFor="let event of events()">
          <div class="event-image">
            <img *ngIf="event.photos && event.photos.length > 0" [src]="event.photos[0].url" [alt]="event.title" />
            <div class="no-image" *ngIf="!event.photos || event.photos.length === 0">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <span class="status-badge" [class]="event.status.toLowerCase()">
              {{ event.status === 'ACTIVE' ? 'Activo' : event.status === 'PENDING' ? 'Pendiente' : event.status === 'CANCELLED' ? 'Cancelado' : event.status === 'REJECTED' ? 'Rechazado' : event.status === 'SUSPENDED' ? 'Suspendido' : event.status }}
            </span>
          </div>
          <div class="event-info">
            <h3>{{ event.title }}</h3>
            <p class="event-category">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
              </svg>
              {{ event.category?.name || 'Sin categoría' }}
            </p>
            <p class="event-place">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              {{ event.place?.name || 'Lugar no asignado' }}
            </p>
            <p class="event-date">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              {{ formatEventDateTime(event) }}
            </p>
          </div>
          <div class="event-actions">
            <a [routerLink]="['/owner/event/edit', event.id]" class="btn-edit">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Editar
            </a>
            <a [routerLink]="['/places', event.placeId]" class="btn-view">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
              Ver
            </a>
            <button class="btn-delete" (click)="deleteEvent(event.id, event.title)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
              </svg>
              Eliminar
            </button>
          </div>
          <div class="event-promote">
            <button *ngIf="!event.isSponsored" class="btn-promote" (click)="promoteEvent(event.id)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px; vertical-align: text-bottom;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              Destacar ($10.000)
            </button>
            <span *ngIf="event.isSponsored" class="sponsored-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px; vertical-align: text-bottom;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              Destacado
            </span>
          </div>
  `,
  styles: [`
    .events-page {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
      background: var(--surface-main);
      min-height: 100vh;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
      gap: 1rem;

      .header-left {
        h1 { margin: 0 0 0.25rem; font-size: 1.75rem; color: var(--ink-primary); }
        .header-subtitle { margin: 0; font-size: 0.875rem; color: var(--text-secondary); }
      }
    }

    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: linear-gradient(135deg, var(--identity-glow) 0%, #7c3aed 100%);
      color: white;
      text-decoration: none;
      border-radius: 10px;
      font-weight: 600;
      transition: transform 0.2s, box-shadow 0.2s;
      white-space: nowrap;
      border: none;
      cursor: pointer;
      &:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(124,58,237,0.4); }
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 4rem;
      color: var(--text-secondary);

      .spinner {
        width: 40px; height: 40px;
        border: 3px solid var(--border-quiet);
        border-top-color: var(--identity-glow);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      @keyframes spin { to { transform: rotate(360deg); } }
    }

    .error-banner {
      padding: 1rem 1.5rem;
      background: #fee2e2;
      color: #dc2626;
      border-radius: 10px;
      margin-bottom: 1.5rem;
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      background: var(--surface-card);
      border-radius: 16px;
      box-shadow: var(--shadow-md);
      border: 1px solid var(--border-quiet);

      .empty-icon { font-size: 4rem; margin-bottom: 1rem; }
      h2 { margin: 0 0 0.5rem; color: var(--ink-primary); }
      p { color: var(--text-secondary); margin-bottom: 1.5rem; }
    }

    .events-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .event-card {
      background: var(--surface-card);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: var(--shadow-md);
      border: 1px solid var(--border-quiet);
      transition: transform 0.2s, box-shadow 0.2s;
      &:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.15); }
    }

    .event-image {
      position: relative;
      height: 160px;
      background: var(--surface-soft);

      img { width: 100%; height: 100%; object-fit: cover; }

      .no-image {
        width: 100%; height: 100%;
        display: flex; align-items: center; justify-content: center;
        font-size: 3rem;
      }

      .status-badge {
        position: absolute; top: 12px; right: 12px;
        padding: 0.25rem 0.75rem;
        border-radius: 20px; font-size: 0.75rem; font-weight: 600;
        &.active { background: #d1fae5; color: #065f46; }
        &.pending { background: #fef3c7; color: #92400e; }
        &.cancelled { background: #fee2e2; color: #991b1b; }
        &.rejected { background: #fee2e2; color: #991b1b; }
        &.suspended { background: #f3f4f6; color: #6b7280; }
      }
    }

    .event-info {
      padding: 1rem;

      h3 { margin: 0 0 0.5rem; font-size: 1.05rem; color: var(--ink-primary); }
      p { margin: 0.25rem 0; font-size: 0.8rem; color: var(--text-secondary); display: flex; align-items: center; gap: 0.4rem; }
      .event-category { color: var(--identity-glow); }
      .event-date { color: #16a34a; }
    }

    .event-actions {
      display: flex;
      gap: 0.4rem;
      padding: 0 1rem 0.75rem;

      a, button {
        flex: 1;
        padding: 0.45rem 0.25rem;
        text-align: center;
        border-radius: 8px;
        font-size: 0.78rem;
        font-weight: 500;
        text-decoration: none;
        border: none;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.3rem;
        transition: background 0.2s, transform 0.1s;
        &:active { transform: scale(0.97); }
      }

      .btn-edit {
        background: var(--surface-soft);
        color: var(--text-secondary);
        &:hover { background: var(--border-quiet); }
      }

      .btn-view {
        background: var(--identity-glow);
        color: white;
        &:hover { opacity: 0.9; }
      }

      .btn-delete {
        background: #fee2e2;
        color: #dc2626;
        &:hover { background: #fca5a5; }
      }
    }

    .event-promote {
      padding: 0 1rem 1rem;
      display: flex; justify-content: center;

      .btn-promote {
        width: 100%; padding: 0.5rem;
        border-radius: 8px; border: none;
        background: linear-gradient(135deg, var(--identity-glow) 0%, #7c3aed 100%);
        color: white; font-weight: 600; cursor: pointer;
        transition: transform 0.2s;
        &:hover { transform: scale(1.02); }
      }

      .sponsored-badge { color: #7c3aed; font-weight: bold; font-size: 0.9rem; }
    }

    @media (max-width: 768px) {
      .events-page {
        padding: 1rem;
      }
      .page-header {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
        text-align: center;
      }
      .btn-primary {
        width: 100%;
        justify-content: center;
        text-align: center;
      }
      .events-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }
    }
  `]
})
export class EventListComponent implements OnInit {
  private readonly eventsService = inject(EventsService);
  private readonly authStore = inject(AuthStoreService);
  private readonly appState = inject(AppStateService);

  readonly events = signal<EventItem[]>([]);
  readonly loading = signal(true);
  private readonly notificationService = inject(NotificationService);

  constructor() {
    this.appState.refreshEvents$.subscribe(() => {
      this.loadEvents();
    });
  }

  ngOnInit() {
    this.loadEvents();
  }

  private loadEvents() {
    this.loading.set(true);

    const currentUser = this.authStore.user();

    if (!currentUser) {
      this.loading.set(false);
      this.notificationService.error('Eventos', 'No se pudo identificar al usuario. Por favor, inicia sesión de nuevo.');
      return;
    }

    const params: any = { pageSize: 100, ownerId: currentUser.id };

    this.eventsService.listAgenda(params).subscribe({
      next: (response) => {
        const filtered = (response.items ?? []).filter((e: any) => e.place?.ownerUserId === currentUser.id);
        this.events.set(filtered);
        this.loading.set(false);
      },
      error: () => {
        this.events.set([]);
        this.loading.set(false);
        this.notificationService.error('Eventos', 'No se pudieron cargar tus eventos. Verifica tu conexión.');
      }
    });
  }

  formatEventDateTime(event: any): string {
    let dateStr = event.eventDate || event.startTime;
    let timeStr = event.startTime;
    
    let formattedDate = '';
    if (dateStr && (dateStr.includes('T') || dateStr.includes('-'))) {
      const d = new Date(dateStr);
      formattedDate = d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } else {
      formattedDate = dateStr;
    }

    let formattedTime = '';
    if (timeStr && timeStr.includes('T')) {
      formattedTime = new Date(timeStr).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    } else if (timeStr && timeStr.includes(':')) {
      const parts = timeStr.split(':');
      const d = new Date();
      d.setHours(Number(parts[0]));
      d.setMinutes(Number(parts[1]));
      formattedTime = d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    } else {
      formattedTime = timeStr;
    }

    return `${formattedDate}, ${formattedTime}`;
  }

  deleteEvent(id: string, title: string) {
    if (!confirm(`¿Estás seguro de que deseas eliminar el evento "${title}"?\nEsta acción no se puede deshacer.`)) return;

    this.eventsService.update(id, { status: 'CANCELLED' }).subscribe({
      next: () => {
        this.events.update(list => list.filter(e => e.id !== id));
      },
      error: () => {
        this.notificationService.error('Error', 'No se pudo eliminar el evento');
      }
    });
  }

  async promoteEvent(id: string) {
    if (confirm('¿Simular pago de $10.000 para destacar este evento por 30 días?')) {
      try {
        const token = localStorage.getItem('ubica2_access_token') || localStorage.getItem('access_token');
        const apiUrl = this.eventsService['baseUrl'] || 'http://localhost:3000/api';
        const res = await fetch(`${apiUrl}/payments/promote`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({ targetType: 'EVENT', targetId: id })
        });
        if (res.ok) {
          this.notificationService.success('Promoción', '¡Evento destacado con éxito!');
          this.events.update(events => events.map(e => e.id === id ? { ...e, isSponsored: true } : e));
        } else {
          const err = await res.json();
          if (err.error === 'Evento no encontrado' && id.includes('mock')) {
            this.notificationService.success('Simulación', '¡Evento destacado con éxito!');
            this.events.update(events => events.map(e => e.id === id ? { ...e, isSponsored: true } : e));
          } else {
            this.notificationService.error('Error', 'Error al solicitar la promoción. ' + (err.error?.message || ''));
          }
        }
      } catch (e) {
        this.notificationService.error('Error', 'Error de conexión');
      }
    }
  }
}
