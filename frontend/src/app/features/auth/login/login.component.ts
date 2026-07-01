import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../core/services/notification.service';
import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthApiService } from '../../../core/services/auth-api.service';
import { AppStateService } from '../../../core/services/app-state.service';
import { AuthStoreService } from '../../../core/services/auth-store.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly appState = inject(AppStateService);
  private readonly authStore = inject(AuthStoreService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  private readonly notificationService = inject(NotificationService);
  
  readonly theme = this.appState.theme;

  toggleTheme(): void {
    this.appState.toggleTheme();
  }

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['registered'] === 'true') {
        this.notificationService.success('Éxito', '¡Cuenta creada exitosamente! Por favor inicia sesión.');
      }
    });
  }

  submit(): void {
    if (this.form.invalid) return;

    this.loading.set(true);
    this.error.set(null);
    

    this.authApi.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/']).then(success => {
          if (!success) window.location.href = '/';
        });
        setTimeout(() => { if (this.router.url === '/login') window.location.href = '/'; }, 1000);
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err.error?.message || 'Error al conectar con el servidor. Verifica tu conexión.';
        this.error.set(msg);
      },
    });
  }



  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }
}
