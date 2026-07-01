import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PromotionsService } from '../../core/services/promotions.service';
import { PlanFavoritesService } from '../../core/services/plan-favorites.service';
import { AuthStoreService } from '../../core/services/auth-store.service';
import { CommentsService } from '../../core/services/comments.service';
import { Promotion } from '../../core/models/feature.models';
import { Comment } from '../../core/models/api.models';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { timeout } from 'rxjs/operators';

@Component({
  selector: 'app-promotions',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe, ReactiveFormsModule],
  template: `
    <div class="promo-page">
      <!-- HERO BANNER -->
      <section class="promo-hero">
        <div class="hero-overlay"></div>
        <div class="hero-content">
          <div class="hero-text-box">
            <h1>{{ 'Ofertas y Promociones en Armenia' | translate }}</h1>
            <p class="hero-desc">{{ 'Encuentra descuentos y promociones especiales en diferentes lugares de la ciudad.' | translate }}</p>
          </div>
        </div>
      </section>

      <!-- FILTER TABS -->
      <section class="filter-bar" *ngIf="!loading() && promotions().length > 0">
        <button class="filter-chip" [class.active]="activeFilter() === 'all'" (click)="setFilter('all')">
          {{ 'Todas' | translate }}
        </button>
        <button class="filter-chip" [class.active]="activeFilter() === 'PERCENTAGE'" (click)="setFilter('PERCENTAGE')">
          {{ 'Descuentos' | translate }}
        </button>
        <button class="filter-chip" [class.active]="activeFilter() === 'BOGO'" (click)="setFilter('BOGO')">
          2x1
        </button>
        <button class="filter-chip" [class.active]="activeFilter() === 'FIXED'" (click)="setFilter('FIXED')">
          {{ 'Precio Fijo' | translate }}
        </button>
      </section>

      <!-- LOADING STATE -->
      <section *ngIf="loading()" class="state-container">
        <div class="loader-ring">
          <div></div><div></div><div></div><div></div>
        </div>
        <p>{{ 'Cargando las mejores ofertas...' | translate }}</p>
      </section>

      <!-- EMPTY STATE -->
      <section *ngIf="!loading() && promotions().length === 0" class="state-container empty">
        <div class="empty-illustration">🎟️</div>
        <h3>{{ 'Sin ofertas por el momento' | translate }}</h3>
        <p>{{ 'Vuelve más tarde para descubrir nuevas sorpresas.' | translate }}</p>
      </section>

      <!-- OFFERS GRID -->
      <section *ngIf="!loading() && filteredPromotions().length > 0" class="offers-section">
        <div class="offers-grid">
          <article *ngFor="let promo of filteredPromotions(); let i = index" class="offer-card">
            <div class="card-visual">
              <div class="card-img" [style.backgroundImage]="'url(' + getPromoImage(promo) + ')'"></div>
              <div class="card-img-overlay"></div>
              <div class="card-top-row">
                <span class="discount-pill" [class]="'type-' + promo.discountType.toLowerCase()">
                  <span *ngIf="promo.discountType === 'PERCENTAGE'">{{ promo.discountValue }}% OFF</span>
                  <span *ngIf="promo.discountType === 'FIXED'">{{ promo.discountValue | currency:'COP':'symbol':'1.0-0' }} OFF</span>
                  <span *ngIf="promo.discountType === 'BOGO'">2×1</span>
                </span>
              </div>
            </div>

            <div class="card-content">
              <span class="place-tag">{{ promo.place?.name || 'Lugar' }}</span>
              <h3>{{ promo.title }}</h3>
              <p class="card-desc">{{ promo.description }}</p>
              
              <div class="card-meta-row">
                <div class="promo-code-small" *ngIf="promo.code">
                  <span class="code-lbl">CÓDIGO</span>
                  <code>{{ promo.code }}</code>
                </div>
                <span class="validity-tag">
                  Vence: {{ promo.endDate | date:'dd MMM yyyy' }}
                </span>
              </div>
            </div>

            <div class="card-action">
              <a class="btn-go" [routerLink]="['/places', promo.placeId]">
                {{ 'Ver Detalles del Lugar' | translate }}
              </a>
            </div>
          </article>
        </div>
      </section>

    </div>
  `,
  styles: [`
    .promo-page {
      background: var(--surface-main);
      color: var(--ink-primary);
      min-height: 100vh;
      padding-bottom: 6rem;
    }

    .promo-hero {
      position: relative;
      padding: 4rem 2rem;
      text-align: center;
      background-image: url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1600&q=80');
      background-size: cover;
      background-position: center;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .hero-overlay {
      position: absolute;
      inset: 0;
      background: rgba(15, 23, 42, 0.4);
    }

    .hero-content {
      position: relative;
      z-index: 2;
      width: 100%;
      display: flex;
      justify-content: center;
    }

    .hero-text-box {
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(8px);
      padding: 3.5rem 2rem;
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      max-width: 500px;
      width: 100%;
    }

    .promo-hero h1 {
      font-family: var(--font-display);
      font-size: clamp(2rem, 4vw, 3rem);
      font-weight: 800;
      color: #ffffff;
      margin: 0 0 1rem;
      line-height: 1.2;
      text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }

    .hero-desc {
      color: rgba(255, 255, 255, 0.9);
      font-size: 1.1rem;
      font-weight: 500;
      line-height: 1.5;
      margin: 0;
    }

    .state-container {
      text-align: center;
      padding: 5rem 2rem;
      color: var(--ink-muted);
    }

    .loader-ring {
      display: inline-block;
      position: relative;
      width: 60px; height: 60px;
      div {
        box-sizing: border-box;
        display: block;
        position: absolute;
        width: 48px; height: 48px;
        margin: 6px;
        border: 4px solid var(--identity-glow);
        border-radius: 50%;
        animation: loaderSpin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
        border-color: var(--identity-glow) transparent transparent transparent;
      }
      div:nth-child(1) { animation-delay: -0.45s; }
      div:nth-child(2) { animation-delay: -0.3s; }
      div:nth-child(3) { animation-delay: -0.15s; }
    }

    @keyframes loaderSpin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .offers-section {
      max-width: 1200px;
      margin: 1rem auto 4rem;
      padding: 0 1.5rem;
      position: relative;
      z-index: 3;
    }

    /* FILTER BAR */
    .filter-bar {
      display: flex;
      justify-content: center;
      gap: 0.75rem;
      padding: 2rem 1.5rem 0;
      flex-wrap: wrap;
    }

    .filter-chip {
      background: var(--surface-card);
      border: 1px solid var(--border-quiet);
      color: var(--ink-secondary);
      padding: 0.65rem 1.4rem;
      border-radius: 999px;
      font-size: 0.85rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        border-color: var(--identity-glow);
        color: var(--identity-glow);
        transform: translateY(-2px);
      }

      &.active {
        background: var(--identity-glow);
        color: #fff;
        border-color: transparent;
        box-shadow: 0 4px 15px var(--border-glow);
        transform: translateY(-2px);
      }
    }

    .offers-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 2rem;
    }

    .offer-card {
      background: var(--surface-card);
      border: 1px solid var(--border-quiet);
      border-radius: 24px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: all 0.4s ease;
      box-shadow: var(--shadow-sm);
      isolation: isolate; /* Fix for border-radius clip on Safari/Chrome */

      &:hover {
        transform: translateY(-6px);
        border-color: var(--identity-glow);
        box-shadow: var(--shadow-md);
      }
    }

    .card-visual {
      position: relative;
      height: 200px;
      overflow: hidden;
      border-top-left-radius: 24px;
      border-top-right-radius: 24px;
    }

    .card-img {
      width: 100%;
      height: 100%;
      background-size: cover;
      background-position: center;
      transition: transform 0.5s ease;
    }

    .offer-card:hover .card-img {
      transform: scale(1.08);
    }

    .card-img-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, var(--surface-card) 0%, transparent 60%);
    }

    .card-top-row {
      position: absolute;
      top: 1rem;
      left: 1rem;
      right: 1rem;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      z-index: 2;
    }

    .discount-pill {
      padding: 0.45rem 1rem;
      border-radius: 12px;
      font-weight: 900;
      font-size: 0.85rem;
      color: #fff;
      background: var(--identity-glow);
      box-shadow: 0 4px 15px var(--border-glow);
    }

    .btn-fav {
      background: rgba(255,255,255,0.2);
      backdrop-filter: blur(10px);
      border: none;
      font-size: 1.4rem;
      cursor: pointer;
      width: 40px; height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s;
      &:hover { background: rgba(255,255,255,0.4); transform: scale(1.15); }
    }

    .card-content {
      padding: 1.25rem 1.5rem;
      flex: 1;
      .place-tag {
        display: inline-block;
        color: var(--identity-glow);
        font-weight: 800;
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        margin-bottom: 0.4rem;
      }
      h3 {
        font-family: var(--font-display);
        font-size: 1.35rem;
        margin: 0 0 0.6rem;
        color: var(--ink-primary);
        line-height: 1.25;
      }
      .card-desc {
        color: var(--ink-muted);
        font-size: 0.9rem;
        line-height: 1.6;
        margin: 0 0 1rem;
      }
    }

    .card-meta-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .promo-code-small {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      background: var(--surface-soft);
      padding: 0.4rem 0.8rem;
      border-radius: 8px;
      .code-lbl { font-size: 0.6rem; font-weight: 800; color: var(--ink-muted); }
      code { color: var(--identity-glow); font-weight: 900; letter-spacing: 0.1em; font-size: 0.85rem; }
    }

    .validity-tag {
      font-size: 0.75rem;
      color: var(--ink-muted);
      font-weight: 600;
    }

    .card-action {
      padding: 0 1.5rem 1.5rem;
      display: flex;
      justify-content: center;
    }

    .btn-go {
      display: inline-block;
      background: transparent;
      border: 1.5px solid var(--identity-glow);
      color: var(--identity-glow);
      padding: 0.7rem 2rem;
      border-radius: 12px;
      font-weight: 800;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.3s;
      text-align: center;
      text-decoration: none;
      &:hover {
        background: var(--identity-glow);
        color: #fff;
        box-shadow: 0 8px 25px var(--border-glow);
        transform: translateY(-2px);
      }
    }

    /* REVIEWS SECTION */
    .reviews-section {
      max-width: 800px;
      margin: 4rem auto 0;
      padding: 0 1.5rem;
    }

    .section-title {
      text-align: center;
      margin-bottom: 2rem;
      h2 {
        font-family: var(--font-display);
        font-size: 2rem;
        color: var(--ink-primary);
        margin: 0 0 0.5rem;
      }
      p { color: var(--ink-muted); font-size: 1rem; margin: 0; }
    }

    .comment-form {
      background: var(--surface-card);
      border: 1px solid var(--border-quiet);
      border-radius: 20px;
      padding: 2rem;
      margin-bottom: 2.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.2rem;
      box-shadow: var(--shadow-sm);

      .rating-input {
        display: flex; align-items: center; gap: 1rem;
        label { font-weight: 800; font-size: 0.85rem; color: var(--ink-secondary); }
        select { background: var(--surface-soft); color: var(--ink-primary); border: 1px solid var(--border-quiet); padding: 0.5rem 1rem; border-radius: 10px; font-weight: 700; }
      }

      textarea { background: var(--surface-soft); border: 1px solid var(--border-quiet); color: var(--ink-primary); padding: 1.2rem; border-radius: 12px; min-height: 100px; font-size: 1rem; &:focus { border-color: var(--identity-glow); } }
      
      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
      }
      
      .btn-primary {
        background: var(--identity-glow); color: #fff; border: none; padding: 0.8rem 1.5rem; border-radius: 10px; font-weight: 800; cursor: pointer; transition: 0.3s;
        &:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(1.1); box-shadow: 0 6px 20px var(--border-glow); }
        &:disabled { opacity: 0.5; cursor: not-allowed; }
      }
    }

    .login-prompt {
      background: var(--surface-card);
      padding: 2.5rem 2rem;
      border-radius: 16px;
      text-align: center;
      margin-bottom: 3rem;
      border: 1px dashed var(--border-quiet);
      p { margin-bottom: 1.5rem; color: var(--ink-muted); font-size: 1.1rem; }
      .btn-primary {
        background: var(--identity-glow); color: #fff; border: none; padding: 0.8rem 2rem; border-radius: 10px; font-weight: 800; cursor: pointer; text-decoration: none; display: inline-block;
      }
    }

    .reviews-list { display: flex; flex-direction: column; gap: 1.5rem; }
    .review-item {
      background: var(--surface-card); padding: 1.5rem; border-radius: 16px; border: 1px solid var(--border-quiet);
      .review-header {
        display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;
        .user-info { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
        .user-name { font-weight: 800; font-size: 1rem; color: var(--ink-primary); }
        .review-date { font-size: 0.8rem; color: var(--ink-muted); }
        .review-rating { color: #ffcc00; font-weight: 900; }
        .review-actions {
          display: flex; gap: 0.5rem;
          button { background: transparent; border: none; cursor: pointer; font-size: 1rem; transition: transform 0.2s; padding: 0.2rem; &:hover { transform: scale(1.2); } }
        }
      }
      .review-content { color: var(--ink-secondary); line-height: 1.5; font-size: 1rem; margin: 0; }
    }

    .alert-message {
      padding: 1rem 1.5rem;
      border-radius: 12px;
      margin-bottom: 2rem;
      font-weight: 700;
      text-align: center;
      border: 1px solid transparent;
    }
    
    .alert-message.success {
      background: rgba(34, 197, 94, 0.1);
      color: #16a34a;
      border-color: #22c55e;
    }
    
    .alert-message.error {
      background: rgba(239, 68, 68, 0.1);
      color: #dc2626;
      border-color: #ef4444;
    }

    .empty-reviews-state {
      background: var(--surface-soft); padding: 3rem 2rem; border-radius: 16px; text-align: center; color: var(--ink-muted); font-size: 1.1rem; border: 1px dashed var(--border-quiet);
    }
  `]
})
export class PromotionsComponent implements OnInit {
  private readonly promotionsService = inject(PromotionsService);
  private readonly planFavoritesService = inject(PlanFavoritesService);
  private readonly authStore = inject(AuthStoreService);
  private readonly commentsService = inject(CommentsService);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(true);
  readonly promotions = signal<Promotion[]>([]);
  readonly filteredPromotions = signal<Promotion[]>([]);
  readonly activeFilter = signal<string>('all');
  readonly favoriteIds = signal<Set<string>>(new Set());

  // Comments state
  readonly comments = signal<Comment[]>([]);
  readonly commentLoading = signal(false);
  readonly editingCommentId = signal<string | null>(null);
  readonly actionMessage = signal<{type: 'success' | 'error', text: string} | null>(null);

  readonly commentForm = this.fb.nonNullable.group({
    rating: [undefined as number | undefined],
    content: ['', [Validators.required, Validators.minLength(2)]],
  });

  private readonly promoImages: Record<string, string> = {
    'La Terraza': 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80',
    'El Solar Gastrobar': 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    'Dar Papaya': 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80',
    'El Bunker': 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80',
    'La Fogata': 'https://images.unsplash.com/photo-1550966842-2849a221082b?auto=format&fit=crop&w=800&q=80',
    'Café Quindío': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80',
    'Mirador del Quindío': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80',
  };

  private readonly fallbackImages = [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1525610553991-2bede1a236e2?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1563298723-dcfebaa392e3?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=800&q=80',
  ];

  isLoggedIn(): boolean {
    return this.authStore.isAuthenticated();
  }

  userId(): string | undefined {
    return this.authStore.user()?.id;
  }

  isFavorite(id: string): boolean {
    return this.favoriteIds().has(id);
  }

  getPromoImage(promo: Promotion): string {
    const placeName = (promo as any).place?.name || '';
    if (this.promoImages[placeName]) {
      return this.promoImages[placeName];
    }
    const hash = promo.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return this.fallbackImages[hash % this.fallbackImages.length];
  }

  ngOnInit(): void {
    this.loadPromotions();
    this.loadComments();
  }

  setFilter(filter: string): void {
    this.activeFilter.set(filter);
    this.applyFilter();
  }

  private applyFilter(): void {
    const filter = this.activeFilter();
    const all = this.promotions();
    if (filter === 'all') {
      this.filteredPromotions.set(all);
    } else {
      this.filteredPromotions.set(all.filter(p => p.discountType === filter));
    }
  }

  loadPromotions(): void {
    this.promotionsService.getActive()
    .pipe(timeout(2000))
    .subscribe({
      next: (data) => {
        this.promotions.set(data.items);
        this.filteredPromotions.set(data.items);
        this.loading.set(false);
      },
      error: () => {
        const mockPromotions: Promotion[] = [
          {
            id: 'offer-1',
            title: 'Happy Hour Espectacular',
            description: '2x1 en toda la coctelería de autor y tapas gourmet. La mejor forma de empezar tu noche en Armenia.',
            discountType: 'BOGO',
            discountValue: 0,
            startDate: new Date().toISOString(),
            endDate: new Date('2026-06-22').toISOString(),
            code: 'HAPPY2X1',
            place: { id: 'bunker-1', name: 'El Bunker' } as any,
            placeId: 'bunker-1',
            currentUses: 0,
            status: 'ACTIVE',
          },
          {
            id: 'offer-2',
            title: 'Combo After Office',
            description: 'Cerveza artesanal + tabla de quesos por solo $15.000. Ideal para desconectar después del trabajo.',
            discountType: 'FIXED',
            discountValue: 15000,
            startDate: new Date().toISOString(),
            endDate: new Date('2026-06-18').toISOString(),
            code: 'TERRAZA1',
            place: { id: 'terraza-1', name: 'La Terraza' } as any,
            placeId: 'terraza-1',
            currentUses: 0,
            status: 'ACTIVE',
          },
          {
            id: 'offer-3',
            title: '30% en Almuerzos Ejecutivos',
            description: 'Disfruta del mejor almuerzo de Armenia con 30% de descuento. Incluye entrada, plato fuerte y postre.',
            discountType: 'PERCENTAGE',
            discountValue: 30,
            startDate: new Date().toISOString(),
            endDate: new Date('2026-06-30').toISOString(),
            code: 'FOGATA30',
            place: { id: 'fogata-1', name: 'La Fogata' } as any,
            placeId: 'fogata-1',
            currentUses: 0,
            status: 'ACTIVE',
          }
        ];
        this.promotions.set(mockPromotions);
        this.filteredPromotions.set(mockPromotions);
        this.loading.set(false);
      },
    });
  }

  loadComments(): void {
    this.commentsService.list({ onlyGeneral: true, pageSize: 20 }).subscribe({
      next: (res) => {
        this.comments.set(res.items);
      },
      error: () => this.comments.set([]),
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

  submitComment(): void {
    const raw = this.commentForm.getRawValue();
    const content = raw.content;
    
    this.commentLoading.set(true);
    this.actionMessage.set(null);

    const payload: any = { content };
    
    // Parse rating strictly
    const parsedRating = parseInt(raw.rating as any, 10);
    if (!isNaN(parsedRating) && parsedRating >= 1 && parsedRating <= 5) {
      payload.rating = parsedRating;
    }

    const currentEditId = this.editingCommentId();

    if (currentEditId) {
      this.commentsService.update(currentEditId, payload).subscribe({
        next: () => {
          this.commentLoading.set(false);
          this.cancelEdit();
          this.loadComments();
          this.actionMessage.set({ type: 'success', text: 'Reseña actualizada exitosamente.' });
          setTimeout(() => this.actionMessage.set(null), 5000);
        },
        error: (err) => {
          this.commentLoading.set(false);
          this.actionMessage.set({ type: 'error', text: err?.error?.error || 'No se pudo actualizar la reseña.' });
        }
      });
    } else {
      this.commentsService.create(payload).subscribe({
        next: () => {
          this.commentLoading.set(false);
          this.commentForm.reset({ rating: undefined, content: '' });
          this.loadComments();
          this.actionMessage.set({ type: 'success', text: '¡Reseña publicada exitosamente!' });
          setTimeout(() => this.actionMessage.set(null), 5000);
        },
        error: (err) => {
          this.commentLoading.set(false);
          this.actionMessage.set({ type: 'error', text: err?.error?.error || 'No se pudo publicar la reseña.' });
        }
      });
    }
  }

  editComment(comment: Comment): void {
    this.editingCommentId.set(comment.id);
    this.commentForm.patchValue({
      content: comment.content,
      rating: comment.rating || undefined
    });
    // Scroll smoothly to form
    window.scrollTo({ top: document.querySelector('.comment-hub')?.getBoundingClientRect().top || 0, behavior: 'smooth' });
  }

  cancelEdit(): void {
    this.editingCommentId.set(null);
    this.commentForm.reset({ rating: undefined, content: '' });
  }

  deleteComment(id: string): void {
    if (confirm('¿Estás seguro de que quieres eliminar esta reseña?')) {
      this.commentsService.delete(id).subscribe({
        next: () => {
          this.loadComments();
          this.actionMessage.set({ type: 'success', text: 'Reseña eliminada correctamente.' });
          setTimeout(() => this.actionMessage.set(null), 5000);
        },
        error: (err) => {
          this.actionMessage.set({ type: 'error', text: 'Hubo un error al eliminar la reseña.' });
        }
      });
    }
  }
}
