import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PromotionsService } from '../../core/services/promotions.service';
import { PlanFavoritesService } from '../../core/services/plan-favorites.service';
import { AuthStoreService } from '../../core/services/auth-store.service';
import { Promotion } from '../../core/models/feature.models';

@Component({
  selector: 'app-promotions',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container">
      <h1>Promociones</h1>
      
      <div *ngIf="loading()" class="loading">Cargando...</div>
      
      <div *ngIf="!loading() && promotions().length === 0" class="empty">
        No hay promociones activas en este momento.
      </div>
      
      <div class="promotions-grid">
        <div *ngFor="let promo of promotions()" class="promo-card">
          <div class="promo-badge" [class]="'promo-' + promo.discountType.toLowerCase()">
            <span *ngIf="promo.discountType === 'PERCENTAGE'">{{ promo.discountValue }}% OFF</span>
            <span *ngIf="promo.discountType === 'FIXED'">\$\{{ promo.discountValue }} OFF</span>
            <span *ngIf="promo.discountType === 'BOGO'">BOGO</span>
          </div>
          
          <h3>{{ promo.title }}</h3>
          <p *ngIf="promo.description">{{ promo.description }}</p>
          
          <div class="promo-place" *ngIf="promo.place">
            <small>{{ promo.place.name }}</small>
          </div>
          
          <div class="promo-code" *ngIf="promo.code">
            <code>{{ promo.code }}</code>
          </div>
          
          <div class="promo-dates">
            <small>Válido hasta: {{ promo.endDate | date:'shortDate' }}</small>
          </div>
          
          <button *ngIf="isLoggedIn()" 
                  class="btn-favorite"
                  (click)="toggleFavorite(promo)">
            {{ isFavorite(promo.id) ? '❤️' : '🤍' }}
          </button>
          
          <a *ngIf="promo.place" [routerLink]="['/places', promo.place.id]" class="btn-place">
            Ver lugar
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container { max-width: 1200px; margin: 0 auto; padding: 1rem; }
    h1 { margin-bottom: 1.5rem; }
    .loading, .empty { text-align: center; padding: 2rem; color: #666; }
    .promotions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;
    }
    .promo-card {
      background: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 1rem;
      position: relative;
    }
    .promo-badge {
      position: absolute;
      top: -10px;
      right: 10px;
      background: #e74c3c;
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-weight: bold;
      font-size: 0.875rem;
    }
    .promo-percentage { background: #e74c3c; }
    .promo-fixed { background: #27ae60; }
    .promo-bogo { background: #3498db; }
    .promo-card h3 { margin: 0.5rem 0; }
    .promo-card p { color: #666; font-size: 0.9rem; margin: 0.5rem 0; }
    .promo-place { color: #888; margin-top: 0.5rem; }
    .promo-code {
      background: #f8f9fa;
      padding: 0.5rem;
      border-radius: 4px;
      text-align: center;
      margin: 0.5rem 0;
    }
    .promo-code code { font-weight: bold; letter-spacing: 2px; }
    .promo-dates { color: #888; font-size: 0.8rem; }
    .btn-favorite {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      padding: 0.25rem;
    }
    .btn-place {
      display: block;
      text-align: center;
      background: #007bff;
      color: white;
      padding: 0.5rem;
      border-radius: 4px;
      text-decoration: none;
      margin-top: 0.5rem;
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
    this.promotionsService.getActive().subscribe({
      next: (data) => {
        this.promotions.set(data.items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
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
