import { CommonModule } from '@angular/common';
import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthStoreService } from '../../core/services/auth-store.service';
import { PlansService } from '../../core/services/plans.service';

@Component({
  selector: 'app-plans-success',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="success-page">
      <div class="success-card">
        <div class="success-icon" *ngIf="status() === 'done'">🎉</div>
        <div class="success-icon loading" *ngIf="status() === 'loading'">⏳</div>
        <div class="success-icon error" *ngIf="status() === 'error'">❌</div>

        <h1 *ngIf="status() === 'done'">¡Bienvenido como Owner!</h1>
        <h1 *ngIf="status() === 'loading'">Activando tu plan...</h1>
        <h1 *ngIf="status() === 'error'">Algo salió mal</h1>

        <p *ngIf="status() === 'done'">
          Tu suscripción fue activada exitosamente. Ya tienes acceso completo para agregar lugares y eventos en Ubica2.
        </p>
        <p *ngIf="status() === 'loading'">
          Estamos configurando tu cuenta. Por favor espera un momento...
        </p>
        <p *ngIf="status() === 'error'" class="error-text">
          {{ errorMsg() }}
        </p>

        <div class="actions" *ngIf="status() === 'done'">
          <a routerLink="/owner/place/new" class="btn-main">Agregar mi primer lugar</a>
          <a routerLink="/" class="btn-light">Ir al inicio</a>
        </div>
        <div class="actions" *ngIf="status() === 'error'">
          <a routerLink="/plans" class="btn-light">Volver a los planes</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .success-page {
      min-height: 80vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }

    .success-card {
      background: #fff;
      border: 1px solid #e2e8e7;
      border-radius: 20px;
      padding: 3rem 2.5rem;
      max-width: 480px;
      width: 100%;
      text-align: center;
      box-shadow: 0 8px 32px rgba(0,0,0,0.08);

      h1 {
        font-family: var(--font-display);
        font-size: 1.8rem;
        margin: 0.75rem 0;
      }

      p {
        color: var(--text-soft);
        line-height: 1.6;
      }

      .error-text { color: #c0392b; }
    }

    .success-icon {
      font-size: 3.5rem;
      margin-bottom: 0.5rem;
      animation: pop 0.4s ease;

      &.loading { opacity: 0.7; }
    }

    @keyframes pop {
      from { transform: scale(0.6); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }

    .actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      margin-top: 2rem;
      flex-wrap: wrap;
    }

    .btn-main {
      background: #1f2b2a;
      color: #fff;
      padding: 0.75rem 1.5rem;
      border-radius: 10px;
      text-decoration: none;
      font-weight: 700;
      font-family: var(--font-sans);
      transition: opacity 0.2s;
      font-size: 0.9rem;

      &:hover { opacity: 0.8; }
    }

    .btn-light {
      background: transparent;
      color: var(--text-main);
      border: 1.5px solid #e2e8e7;
      padding: 0.75rem 1.5rem;
      border-radius: 10px;
      text-decoration: none;
      font-weight: 600;
      font-family: var(--font-sans);
      transition: background 0.2s;
      font-size: 0.9rem;

      &:hover { background: #f5f5f5; }
    }
  `],
})
export class PlansSuccessComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly plansService = inject(PlansService);
  readonly auth = inject(AuthStoreService);

  readonly status = signal<'loading' | 'done' | 'error'>('loading');
  readonly errorMsg = signal<string>('');

  ngOnInit(): void {
    const planId = this.route.snapshot.queryParamMap.get('planId');

    if (!planId) {
      this.status.set('error');
      this.errorMsg.set('No se encontró el plan. Por favor intenta de nuevo.');
      return;
    }

    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    this.plansService.subscribe(planId).subscribe({
      next: (response: any) => {
        const newRole = response?.role;
        if (newRole) {
          const currentUser = this.auth.user();
          if (currentUser) {
            this.auth.setUser({ ...currentUser, role: newRole });
          }
        }
        
        // Refresh session to get NEW role from DB
        this.auth.refreshSession().subscribe({
          next: () => {
            this.status.set('done');
            setTimeout(() => this.router.navigate(['/owner/place/new']), 1500);
          },
          error: () => this.status.set('done')
        });
      },
      error: (err) => {
        const msg = err?.error?.message ?? err?.error?.error ?? '';
        // If already subscribed, refresh session anyway
        if (msg.includes('activo')) {
          this.auth.refreshSession().subscribe({
            next: () => this.status.set('done'),
            error: () => this.status.set('done')
          });
        } else {
          this.status.set('error');
          this.errorMsg.set(msg || 'Error al activar el plan. Contacta soporte.');
        }
      },
    });

  }
}
