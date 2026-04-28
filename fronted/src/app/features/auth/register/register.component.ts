import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthApiService } from '../../../core/services/auth-api.service';
import { AppStateService } from '../../../core/services/app-state.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);
  private readonly appState = inject(AppStateService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly isDarkMode = this.appState.authDarkMode;

  toggleTheme(): void {
    this.appState.setAuthDarkMode(!this.isDarkMode());
  }

  readonly form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    birthDate: [''],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Por favor completa todos los campos requeridos.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const formValue = this.form.getRawValue();
    const payload = {
      fullName: formValue.fullName,
      username: formValue.username,
      email: formValue.email,
      password: formValue.password,
      phone: formValue.phone?.trim() || undefined,
      birthDate: formValue.birthDate || undefined,
    };

    this.authApi.register(payload).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/login'], { queryParams: { registered: 'true' } });
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err?.error?.message || err?.message || 'No fue posible crear la cuenta. Verifica tu conexión e intenta de nuevo.';
        this.error.set(msg);
      },
    });
  }
}
