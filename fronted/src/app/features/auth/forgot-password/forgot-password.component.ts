import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="auth-card">
      <h1>Recuperar contraseña</h1>
      <p>Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.</p>

      <form [formGroup]="form" (ngSubmit)="submit()">
        <label>
          Email
          <input type="email" formControlName="email" placeholder="correo@dominio.com" />
        </label>

        <button type="submit" [disabled]="loading() || form.invalid">
          {{ loading() ? 'Enviando...' : 'Enviar enlace' }}
        </button>
      </form>

      <p class="success" *ngIf="success()">{{ success() }}</p>
      <p class="error" *ngIf="error()">{{ error() }}</p>

      <p class="hint">
        <a routerLink="/login">Volver al login</a>
      </p>
    </section>
  `,
  styles: [`
    .auth-card {
      max-width: 400px;
      margin: 2rem auto;
      padding: 2rem;
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    h1 { margin: 0 0 0.5rem; }
    p { color: #666; margin: 0 0 1rem; }
    label { display: block; margin-bottom: 1rem; }
    label span { display: block; margin-bottom: 0.25rem; font-weight: 500; }
    input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
      box-sizing: border-box;
    }
    button {
      width: 100%;
      padding: 0.75rem;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      cursor: pointer;
    }
    button:disabled { background: #ccc; }
    .error { color: #dc3545; }
    .success { color: #28a745; }
    .hint { text-align: center; margin-top: 1rem; }
    .hint a { color: #007bff; }
  `]
})
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    this.http.post(`${this.baseUrl}/auth/forgot-password`, this.form.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set('Si el email existe, recibirás un enlace de recuperación.');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'Error al enviar el email.');
      },
    });
  }
}
