import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PromotionsService } from '../../core/services/promotions.service';
import { PlanFavoritesService } from '../../core/services/plan-favorites.service';
import { AuthStoreService } from '../../core/services/auth-store.service';
import { Promotion } from '../../core/models/feature.models';
import { timeout } from 'rxjs/operators';

@Component({
  selector: 'app-promotions',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="promotions-page">
      <div class="page-header">
        <p class="eyebrow">Ofertas Especiales</p>
        <h1>Promociones Activas</h1>
        <p class="subtitle">Descubre las mejores ofertas de los lugares cercanos.</p>
      </div>
      
      <div *ngIf="loading()" class="loading">Cargando promociones...</div>
      
      <div *ngIf="!loading() && promotions().length === 0" class="empty-state">
        <div class="icon">🏷️</div>
        <h3>Sin promociones activas</h3>
        <p>No hay ofertas especiales en este momento. Vuelve más tarde.</p>
      </div>
      
      <div class="promotions-grid" *ngIf="!loading() && promotions().length > 0">
        <article *ngFor="let promo of promotions()" class="promo-card">
          <div class="promo-badge" [class]="'promo-' + promo.discountType.toLowerCase()">
            <span *ngIf="promo.discountType === 'PERCENTAGE'">{{ promo.discountValue }}% OFF</span>
            <span *ngIf="promo.discountType === 'FIXED'">{{ promo.discountValue | currency:'COP' }} OFF</span>
            <span *ngIf="promo.discountType === 'BOGO'">BOGO</span>
          </div>
          
          <button *ngIf="isLoggedIn()" 
                  class="btn-favorite"
                  (click)="toggleFavorite(promo)">
            {{ isFavorite(promo.id) ? '❤️' : '🤍' }}
          </button>
          
          <h3>{{ promo.title }}</h3>
          <p *ngIf="promo.description">{{ promo.description }}</p>
          
          <div class="promo-meta">
            <div class="promo-place" *ngIf="promo.place">
              <span class="icon">📍</span>
              <small>{{ promo.place.name }}</small>
            </div>
            
            <div class="promo-code" *ngIf="promo.code">
              <code>{{ promo.code }}</code>
            </div>
            
            <div class="promo-dates">
            <span>Válido hasta: {{ promo.endDate | date:'dd MMM yyyy' }}</span>
          </div>
        </div>
      </article>
      </div>
    </section>
  `,
  styles: [`
    .promotions-page {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem 1.5rem;
    }

    .page-header {
      text-align: center;
      margin-bottom: 2.5rem;

      .eyebrow {
        font-size: 0.75rem;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--identity-glow);
        margin-bottom: 0.5rem;
        font-weight: 600;
      }

      h1 {
        font-family: var(--font-display);
        font-size: 2.5rem;
        color: var(--ink-primary);
        margin: 0 0 0.75rem;
      }

      .subtitle {
        color: var(--ink-secondary);
        font-size: 1rem;
      }
    }

    .promotions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
    }

    .promo-card {
      background: #ffffff;
      border: 1px solid rgba(139, 92, 246, 0.2);
      border-radius: var(--radius-md);
      padding: 1.5rem;
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);

      &:hover {
        box-shadow: 0 8px 30px rgba(139, 92, 246, 0.15);
        transform: translateY(-4px);
        border-color: var(--neon-purple, #bf00ff);
      }

      .btn-favorite {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: none;
        border: none;
        font-size: 1.25rem;
        cursor: pointer;
        padding: 0.25rem;
        opacity: 0.6;
        transition: opacity 0.2s;

        &:hover { opacity: 1; }
      }

      h3 {
        font-family: var(--font-display);
        color: var(--ink-primary);
        margin: 0.5rem 0 0.25rem;
      }

      p {
        color: var(--ink-secondary);
        font-size: 0.9rem;
        line-height: 1.5;
        margin: 0;
      }
    }

    .promo-badge {
      position: absolute;
      top: -10px;
      right: 20px;
      padding: 0.35rem 0.75rem;
      border-radius: var(--radius-sm);
      font-weight: 800;
      font-size: 0.8rem;
      color: #fff;
      box-shadow: var(--shadow-sm);
    }

    .promo-percentage { background: #ef4444; }
    .promo-fixed { background: #22c55e; }
    .promo-bogo { background: #3b82f6; }

    .promo-meta {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }

    .promo-place {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--ink-secondary);
      font-size: 0.85rem;

      .icon { font-size: 1rem; }
    }

    .promo-code {
      background: var(--surface-soft);
      padding: 0.5rem;
      border-radius: var(--radius-sm);
      text-align: center;

      code {
        font-weight: 700;
        letter-spacing: 0.1em;
        color: var(--identity-glow);
      }
    }

    .promo-dates {
      color: var(--ink-muted);
      font-size: 0.75rem;
    }

    .btn-primary {
      display: block;
      text-align: center;
      background: linear-gradient(135deg, var(--neon-purple, #bf00ff) 0%, var(--neon-pink, #ff00ff) 100%);
      color: #fff;
      padding: 0.75rem;
      border-radius: var(--radius-sm);
      text-decoration: none;
      font-weight: 700;
      margin-top: auto;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 4px 15px rgba(191, 0, 255, 0.3);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(191, 0, 255, 0.6);
      }
    }

    .loading, .empty-state {
      text-align: center;
      padding: 4rem 2rem;
    }

    .empty-state {
      background: var(--surface-soft);
      border-radius: var(--radius-md);

      .icon {
        font-size: 3rem;
        margin-bottom: 1rem;
      }

      h3 {
        font-family: var(--font-display);
        color: var(--ink-primary);
        margin: 0 0 0.5rem;
      }

      p {
        color: var(--ink-secondary);
      }
    }
  `]
})
export class PromotionsComponent implements OnInit {
  private readonly promotionsService = inject(PromotionsService);
  private readonly planFavoritesService = inject(PlanFavoritesService);
  private readonly authStore = inject(AuthStoreService);

  readonly loading = signal(true);
  readonly promotions = signal<Promotion[]>([]);
  readonly favoriteIds = signal<Set<string>>(new Set());

  isLoggedIn(): boolean {
    return !!this.authStore.user();
  }

  isFavorite(id: string): boolean {
    return this.favoriteIds().has(id);
  }

  ngOnInit(): void {
    this.loadPromotions();
  }

  loadPromotions(): void {
    this.promotionsService.getActive()
    .pipe(timeout(2000))
    .subscribe({
      next: (data) => {
        this.promotions.set(data.items);
        this.loading.set(false);
      },
      error: () => {
        // Fallback: Mock de promociones neon premium para modo offline
        const mockPromotions: Promotion[] = [
          {
            id: 'promo-1', title: '2x1 en Cócteles Neón', description: 'Disfruta de nuestra exclusiva barra con 2x1 toda la noche. Imperdible.', discountType: 'BOGO', discountValue: 0, startDate: new Date().toISOString(), endDate: new Date(Date.now() + 864000000).toISOString(), code: 'NEONNIGHT',
            place: { id: 'mock-real-3', name: 'Dar Papaya' } as any, placeId: 'mock-real-3', currentUses: 5, status: 'ACTIVE'
          },
          {
            id: 'promo-2', title: 'Cena para Dos Especial', description: 'Menú degustación con maridaje incluido para dos personas con un 20% OFF.', discountType: 'PERCENTAGE', discountValue: 20, startDate: new Date().toISOString(), endDate: new Date(Date.now() + 432000000).toISOString(), code: 'FOGATA20',
            place: { id: 'mock-real-1', name: 'Restaurante La Fogata' } as any, placeId: 'mock-real-1', currentUses: 12, status: 'ACTIVE'
          },
          {
            id: 'promo-3', title: 'Descuento de Bienvenida', description: 'Tragos seleccionados con descuento directo. Perfecto para el after office.', discountType: 'FIXED', discountValue: 15000, startDate: new Date().toISOString(), endDate: new Date(Date.now() + 172800000).toISOString(), code: 'SOLARPOP',
            place: { id: 'mock-real-2', name: 'El Solar Gastrobar' } as any, placeId: 'mock-real-2', currentUses: 8, status: 'ACTIVE'
          }
        ];
        this.promotions.set(mockPromotions);
        this.loading.set(false);
      },
    });
  }

  toggleFavorite(promo: Promotion): void {
    if (this.isFavorite(promo.id)) {
      this.planFavoritesService.remove(promo.id).subscribe(() => {
        const newSet = new Set(this.favoriteIds());
        newSet.delete(promo.id);
        this.favoriteIds.set(newSet);
      });
    } else {
      this.planFavoritesService.add(promo.id).subscribe(() => {
        const newSet = new Set(this.favoriteIds());
        newSet.add(promo.id);
        this.favoriteIds.set(newSet);
      });
    }
  }
}
