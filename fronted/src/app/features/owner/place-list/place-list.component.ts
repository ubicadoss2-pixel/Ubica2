import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PlacesService } from '../../../core/services/places.service';
import { AppStateService } from '../../../core/services/app-state.service';
import { AuthStoreService } from '../../../core/services/auth-store.service';

interface PlaceListItem {
  id: string;
  name: string;
  status: string;
  city?: { name: string };
  placeType?: { name: string };
  photos?: Array<{ url: string }>;
}

@Component({
  selector: 'app-place-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="places-page">
      <div class="page-header">
        <h1>Mis Lugares</h1>
        <a routerLink="/owner/place/new" class="btn-primary">
          + Crear Nuevo Lugar
        </a>
      </div>

      <div class="loading" *ngIf="loading()">Cargando...</div>
      
      <div class="empty-state" *ngIf="!loading() && places().length === 0">
        <div class="empty-icon">📍</div>
        <h2>No tienes lugares aún</h2>
        <p>Crea tu primer lugar para comenzar a mostrarlo en el mapa</p>
        <a routerLink="/owner/place/new" class="btn-primary">Crear Mi Primer Lugar</a>
      </div>

      <div class="places-grid" *ngIf="!loading() && places().length > 0">
        <div class="place-card" *ngFor="let place of places()">
          <div class="place-image">
            <img *ngIf="place.photos && place.photos.length > 0" [src]="place.photos[0].url" [alt]="place.name">
            <div *ngIf="!place.photos || place.photos.length === 0" class="no-image">📍</div>
            <span class="status-badge" [class]="place.status.toLowerCase()">{{ place.status }}</span>
          </div>
          <div class="place-info">
            <h3>{{ place.name }}</h3>
            <p class="place-type">{{ place.placeType?.name }}</p>
            <p class="place-city">{{ place.city?.name }}</p>
          </div>
          <div class="place-actions">
            <a [routerLink]="['/owner/place/edit', place.id]" class="btn-edit">Editar</a>
            <a [routerLink]="['/places', place.id]" class="btn-view">Ver</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .places-page {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
      background: var(--surface-main);
      min-height: 100vh;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;

      h1 {
        margin: 0;
        font-size: 1.75rem;
        color: var(--ink-primary);
      }
    }

    .btn-primary {
      padding: 0.75rem 1.5rem;
      background: linear-gradient(135deg, var(--identity-glow) 0%, #7c3aed 100%);
      color: white;
      text-decoration: none;
      border-radius: 10px;
      font-weight: 600;
      transition: transform 0.2s;
    }

    .loading {
      text-align: center;
      padding: 3rem;
      color: var(--text-secondary);
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      background: var(--surface-card);
      border-radius: 16px;
      box-shadow: var(--shadow-md);
      border: 1px solid var(--border-quiet);

      .empty-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
      }

      h2 {
        margin: 0 0 0.5rem;
        color: var(--ink-primary);
      }

      p {
        color: var(--text-secondary);
        margin-bottom: 1.5rem;
      }
    }

    .places-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
    }

    .place-card {
      background: var(--surface-card);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: var(--shadow-md);
      border: 1px solid var(--border-quiet);
      transition: transform 0.2s, box-shadow 0.2s;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(0,0,0,0.15);
      }
    }

    .place-image {
      position: relative;
      height: 160px;
      background: var(--surface-soft);

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .no-image {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 3rem;
      }

      .status-badge {
        position: absolute;
        top: 12px;
        right: 12px;
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 600;

        &.published {
          background: var(--success-bg);
          color: var(--success-text);
        }

        &.draft {
          background: var(--warning-bg);
          color: var(--warning-text);
        }

        &.suspended {
          background: var(--error-bg);
          color: var(--error-text);
        }
      }
    }

    .place-info {
      padding: 1rem;

      h3 {
        margin: 0 0 0.25rem;
        font-size: 1.1rem;
        color: var(--ink-primary);
      }

      .place-type {
        margin: 0;
        font-size: 0.875rem;
        color: var(--identity-glow);
      }

      .place-city {
        margin: 0.25rem 0 0;
        font-size: 0.875rem;
        color: var(--text-secondary);
      }
    }

    .place-actions {
      display: flex;
      gap: 0.5rem;
      padding: 0 1rem 1rem;

      .btn-edit, .btn-view {
        flex: 1;
        padding: 0.5rem;
        text-align: center;
        border-radius: 8px;
        text-decoration: none;
        font-size: 0.875rem;
        font-weight: 500;
        transition: background 0.2s;
      }

      .btn-edit {
        background: var(--surface-soft);
        color: var(--text-secondary);

        &:hover {
          background: var(--border-quiet);
        }
      }

      .btn-view {
        background: var(--identity-glow);
        color: white;

        &:hover {
          background: var(--identity-glow-hover);
        }
      }
    }
  `]
})
export class PlaceListComponent implements OnInit {
  private readonly placesService = inject(PlacesService);
  private readonly appState = inject(AppStateService);
  private readonly authStore = inject(AuthStoreService);

  readonly places = signal<PlaceListItem[]>([]);
  readonly loading = signal(true);

  ngOnInit() {
    this.loadPlaces();
  }

  private loadPlaces() {
    this.loading.set(true);
    const currentUser = this.authStore.user();
    if (currentUser) {
      this.placesService.list({ ownerId: currentUser.id, pageSize: 100 }).subscribe({
        next: (response) => {
          this.places.set(response.items as PlaceListItem[]);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        }
      });
    } else {
      this.loading.set(false);
    }
  }
}
