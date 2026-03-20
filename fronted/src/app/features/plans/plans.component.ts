import { CommonModule } from '@angular/common';
import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthStoreService } from '../../core/services/auth-store.service';
import { Plan, PlansService, UserPlan } from '../../core/services/plans.service';

@Component({
  selector: 'app-plans',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './plans.component.html',
  styleUrl: './plans.component.scss',
})
export class PlansComponent implements OnInit {
  private readonly plansService = inject(PlansService);
  readonly auth = inject(AuthStoreService);
  private readonly router = inject(Router);

  readonly plans = signal<Plan[]>([]);
  readonly myPlan = signal<UserPlan | null>(null);
  readonly loading = signal(false);
  readonly checkoutLoading = signal<string | null>(null);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.plansService.getPlans().subscribe({
      next: (plans) => this.plans.set(plans),
      error: () => this.error.set('No se pudo cargar los planes.'),
    });

    if (this.auth.isAuthenticated()) {
      this.plansService.getMyPlan().subscribe({
        next: (plan) => this.myPlan.set(plan),
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
      next: ({ url }) => {
        window.location.href = url;
      },
      error: (err) => {
        // If Stripe is not configured, fall back to direct subscribe (demo mode)
        console.warn('Stripe no configurado, subscribiendo en modo demo:', err);
        this.plansService.subscribe(plan.id).subscribe({
          next: () => {
            this.checkoutLoading.set(null);
            this.router.navigate(['/plans/success'], { queryParams: { planId: plan.id } });
          },
          error: (e) => {
            this.checkoutLoading.set(null);
            this.error.set(e?.error?.error ?? 'Error al suscribirse al plan.');
          },
        });
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
