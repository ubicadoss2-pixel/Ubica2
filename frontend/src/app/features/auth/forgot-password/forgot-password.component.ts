import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthApiService } from '../../../core/services/auth-api.service';
import { AppStateService } from '../../../core/services/app-state.service';
import { catchError, of, timeout } from 'rxjs';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: '../login/login.component.scss'
})
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authApi = inject(AuthApiService);
  private readonly appState = inject(AppStateService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);

  readonly theme = this.appState.theme;

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

    const email = this.form.getRawValue().email;

    this.authApi.forgotPassword(email).pipe(
      timeout(10000),
      catchError((err) => {
        return of({ error: err.error?.message || 'Error al conectar con el servidor o tiempo de espera agotado. Verifica tu conexión.' });
      })
    ).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        if (res?.error) {
           this.error.set(res.error);
        } else {
           this.success.set('Si el correo existe en nuestra base de datos, te hemos enviado un enlace para restablecer tu contraseña.');
           this.form.reset();
        }
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Error inesperado. Intenta nuevamente.');
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }
}
