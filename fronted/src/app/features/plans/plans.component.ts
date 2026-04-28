import { CommonModule } from '@angular/common';
import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthStoreService } from '../../core/services/auth-store.service';
import { Plan, PlansService, UserPlan } from '../../core/services/plans.service';
import { PlanFavoritesService } from '../../core/services/plan-favorites.service';
import { timeout } from 'rxjs/operators';

@Component({
  selector: 'app-plans',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './plans.component.html',
  styleUrl: './plans.component.scss',
})
export class PlansComponent implements OnInit {
  private readonly plansService = inject(PlansService);
  private readonly planFavoritesService = inject(PlanFavoritesService);
  readonly auth = inject(AuthStoreService);
  private readonly router = inject(Router);

  readonly plans = signal<Plan[]>([]);
  readonly myPlan = signal<UserPlan | null>(null);
  readonly loading = signal(false);
  readonly checkoutLoading = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly favoriteIds = signal<Set<string>>(new Set());

  ngOnInit(): void {
    this.plansService.getPlans()
    .pipe(timeout(2000))
    .subscribe({
      next: (plans) => this.plans.set(plans),
      error: () => {
        // Fallback offline neon premium
        const mockPlans: Plan[] = [
          { id: 'plan-base', name: 'Start', price: 0, durationDays: 30, limitPlaces: 1, limitEvents: 2, isActive: true },
          { id: 'plan-pro', name: 'Pro Neon', price: 50000, durationDays: 30, limitPlaces: 5, limitEvents: 10, isActive: true },
          { id: 'plan-ultra', name: 'Ultra Glow', price: 120000, durationDays: 30, limitPlaces: 20, limitEvents: 50, isActive: true }
        ];
        this.plans.set(mockPlans);
      },
    });

    if (this.auth.isAuthenticated()) {
      this.plansService.getMyPlan().subscribe({
        next: (plan) => this.myPlan.set(plan),
      });
      this.loadFavorites();
    }
  }

  loadFavorites(): void {
    this.planFavoritesService.getAll().subscribe({
      next: (favorites) => {
        const ids = new Set(favorites.map(f => f.planId));
        this.favoriteIds.set(ids);
      }
    });
  }

  isFavorite(planId: string): boolean {
    return this.favoriteIds().has(planId);
  }

  toggleFavorite(plan: Plan, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    
    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.isFavorite(plan.id)) {
      this.planFavoritesService.remove(plan.id).subscribe(() => {
        const newSet = new Set(this.favoriteIds());
        newSet.delete(plan.id);
        this.favoriteIds.set(newSet);
      });
    } else {
      this.planFavoritesService.add(plan.id).subscribe(() => {
        const newSet = new Set(this.favoriteIds());
        newSet.add(plan.id);
        this.favoriteIds.set(newSet);
      });
    }
  }

  buyPlan(plan: Plan): void {
    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    this.checkoutLoading.set(plan.id);
    this.error.set(null);

    this.plansService.createCheckout(plan.id).subscribe({
      next: (result: any) => {
        this.checkoutLoading.set(null);
        if (result.demoMode) {
          // Modo demo - suscripción directa activada
          this.router.navigate(['/plans/success'], { queryParams: { planId: plan.id } });
        } else if (result.url) {
          // Stripe - redirigir al checkout
          window.location.href = result.url;
        }
      },
      error: (err) => {
        this.checkoutLoading.set(null);
        this.error.set(err?.error?.error ?? err?.error?.message ?? 'Error al procesar el pago.');
      },
    });
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(price);
  }

  isCurrentPlan(planId: string): boolean {
    return this.myPlan()?.planId === planId && (this.myPlan()?.isActive ?? false);
  }
}
