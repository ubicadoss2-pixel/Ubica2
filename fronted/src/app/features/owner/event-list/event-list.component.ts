import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EventsService } from '../../../core/services/events.service';
import { AuthStoreService } from '../../../core/services/auth-store.service';
import { EventItem } from '../../../core/models/api.models';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="events-page">
      <div class="page-header">
        <h1>Mis Eventos</h1>
        <a routerLink="/owner/event/new" class="btn-primary">
          + Crear Nuevo Evento
        </a>
      </div>

      <div class="loading" *ngIf="loading()">Cargando...</div>
      
      <div class="empty-state" *ngIf="!loading() && events().length === 0">
        <div class="empty-icon">📅</div>
        <h2>No tienes eventos aún</h2>
        <p>Crea tu primer evento para comenzar a mostrarlo en la agenda</p>
        <a routerLink="/owner/event/new" class="btn-primary">Crear Mi Primer Evento</a>
      </div>

      <div class="events-grid" *ngIf="!loading() && events().length > 0">
        <div class="event-card" *ngFor="let event of events()">
          <div class="event-image">
            <div class="no-image">📅</div>
            <span class="status-badge" [class]="event.status.toLowerCase()">{{ event.status }}</span>
          </div>
          <div class="event-info">
            <h3>{{ event.title }}</h3>
            <p class="event-category">{{ event.category?.name }}</p>
            <p class="event-place">{{ event.place?.name }}</p>
            <p class="event-date">{{ event.startTime | date:'mediumDate' }}</p>
          </div>
          <div class="event-actions">
            <a [routerLink]="['/owner/event/edit', event.id]" class="btn-edit">Editar</a>
            <a [routerLink]="['/events', event.id]" class="btn-view">Ver</a>
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

    .events-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
    }

    .event-card {
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

    .event-image {
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

        &.cancelled {
          background: var(--error-bg);
          color: var(--error-text);
        }
      }
    }

    .event-info {
      padding: 1rem;

      h3 {
        margin: 0 0 0.25rem;
        font-size: 1.1rem;
        color: var(--ink-primary);
      }

      .event-category {
        margin: 0;
        font-size: 0.875rem;
        color: var(--identity-glow);
      }

      .event-place {
        margin: 0.25rem 0;
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      .event-date {
        margin: 0.25rem 0 0;
        font-size: 0.875rem;
        color: var(--success-text);
      }
    }

    .event-actions {
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
export class EventListComponent implements OnInit {
  private readonly eventsService = inject(EventsService);
  private readonly authStore = inject(AuthStoreService);

  readonly events = signal<EventItem[]>([]);
  readonly loading = signal(true);

  ngOnInit() {
    this.loadEvents();
  }

  private loadEvents() {
    this.loading.set(true);
    const currentUser = this.authStore.user();
    const params: any = { pageSize: 100 };
    if (currentUser) {
      params.ownerId = currentUser.id;
    }
    this.eventsService.listAgenda(params).subscribe({
      next: (response) => {
        this.events.set(response.items);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
}
