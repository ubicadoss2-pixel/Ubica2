import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OffersService } from '../../../core/services/offers.service';
import { AuthStoreService } from '../../../core/services/auth-store.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Offer } from '../../../core/models/feature.models';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';

@Component({
  selector: 'app-offer-list',
  standalone: true,
  imports: [CommonModule, RouterLink, SkeletonComponent],
  template: `
    <div class="events-page">
      <div class="page-header">
        <div class="header-left">
          <h1>Mis Ofertas</h1>
          <p class="header-subtitle">Ofertas creadas por ti en tus lugares</p>
        </div>
        <a routerLink="/owner/offer/new" class="btn-primary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Crear Nueva Oferta
        </a>
      </div>

      <div class="events-grid" *ngIf="loading()">
        <app-skeleton *ngFor="let item of [1,2,3,4,5,6]" type="card" height="300px"></app-skeleton>
      </div>

      <div class="empty-state" *ngIf="!loading() && offers().length === 0">
        <div class="empty-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        </div>
        <h2>No tienes ofertas aún</h2>
        <p>Crea tu primera oferta para comenzar a promocionar tu negocio.</p>
        <a routerLink="/owner/offer/new" class="btn-primary">Crear Mi Primera Oferta</a>
      </div>

      <div class="events-grid" *ngIf="!loading() && offers().length > 0">
        <div class="event-card" *ngFor="let offer of offers()">
          <div class="event-image">
            <img *ngIf="offer.imageUrl" [src]="offer.imageUrl" [alt]="offer.title" />
            <div class="no-image" *ngIf="!offer.imageUrl">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <span class="status-badge" [class]="offer.status.toLowerCase()">
              {{ offer.status === 'ACTIVE' ? 'Activa' : 'Inactiva' }}
            </span>
          </div>
          <div class="event-info">
            <h3>{{ offer.title }}</h3>
            <p class="event-place">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              {{ offer.place?.name || 'Lugar no asignado' }}
            </p>
            <p class="event-date">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Hasta {{ offer.endDate | date:'dd/MM/yyyy' }}
            </p>
          </div>
          <div class="event-actions">
            <a [routerLink]="['/owner/offer/edit', offer.id]" class="btn-edit">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Editar
            </a>
            <button class="btn-delete" (click)="deleteOffer(offer.id, offer.title)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
              </svg>
              Eliminar
            </button>
          </div>
        </div>
      </div>
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
        &.inactive { background: #fee2e2; color: #991b1b; }
      }
    }

    .event-info {
      padding: 1rem;

      h3 { margin: 0 0 0.5rem; font-size: 1.05rem; color: var(--ink-primary); }
      p { margin: 0.25rem 0; font-size: 0.8rem; color: var(--text-secondary); display: flex; align-items: center; gap: 0.4rem; }
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

      .btn-delete {
        background: #fee2e2;
        color: #dc2626;
        &:hover { background: #fca5a5; }
      }
    }

    @media (max-width: 640px) {
      .page-header { flex-direction: column; align-items: stretch; gap: 1rem; }
      .btn-primary { justify-content: center; width: 100%; }
    }
  `]
})
export class OfferListComponent implements OnInit {
  private readonly offersService = inject(OffersService);
  private readonly authStore = inject(AuthStoreService);
  private readonly notificationService = inject(NotificationService);

  readonly offers = signal<Offer[]>([]);
  readonly loading = signal(true);

  ngOnInit() {
    this.loadOffers();
  }

  private loadOffers() {
    this.loading.set(true);

    const currentUser = this.authStore.user();

    if (!currentUser) {
      this.loading.set(false);
      this.notificationService.error('Ofertas', 'No se pudo identificar al usuario. Por favor, inicia sesión de nuevo.');
      return;
    }

    this.offersService.getByOwner().subscribe({
      next: (data) => {
        this.offers.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.offers.set([]);
        this.loading.set(false);
        this.notificationService.error('Ofertas', 'No se pudieron cargar tus ofertas. Verifica tu conexión.');
      }
    });
  }

  deleteOffer(id: string, title: string) {
    if (!confirm(`¿Estás seguro de que deseas eliminar la oferta "${title}"?\nEsta acción no se puede deshacer.`)) return;

    this.offersService.delete(id).subscribe({
      next: () => {
        this.offers.update(list => list.filter(e => e.id !== id));
        this.notificationService.success('Éxito', 'Oferta eliminada');
      },
      error: () => {
        this.notificationService.error('Error', 'No se pudo eliminar la oferta');
      }
    });
  }
}
