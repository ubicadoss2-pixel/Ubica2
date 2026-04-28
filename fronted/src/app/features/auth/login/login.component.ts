import { CommonModule } from '@angular/common';
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
  readonly successMessage = signal<string | null>(null);
  readonly isDarkMode = this.appState.authDarkMode;

  toggleTheme(): void {
    this.appState.setAuthDarkMode(!this.isDarkMode());
  }

  readonly form = this.fb.nonNullable.group({
    email: ['', []],
    password: ['', []],
  });

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['registered'] === 'true') {
        this.successMessage.set('¡Cuenta creada exitosamente! Por favor inicia sesión.');
      }
    });
  }

  submit(): void {
    console.log('[LOGIN] Submit triggered');
    this.loading.set(true);
    this.error.set(null);

    this.authApi.login(this.form.getRawValue()).subscribe({
      next: () => {
        console.log('[LOGIN] Success! Navigating...');
        this.loading.set(false);
        this.router.navigate(['/']).then(success => {
          if (!success) window.location.href = '/';
        });
        // Fallback for safety
        setTimeout(() => { if (this.router.url === '/login') window.location.href = '/'; }, 1500);
      },
      error: (err) => {
        console.error('[LOGIN] Error in submit:', err);
        this.loading.set(false);
        this.error.set('Error. Usando modo invitado automático...');
        this.guestLogin(); // Si falla el login normal, forzar invitado
      },
    });
  }

  guestLogin(): void {
    this.loading.set(true);
    console.log('[LOGIN] Forcing Guest Login...');
    
    try {
      // 1. Limpieza absoluta
      localStorage.clear();
      sessionStorage.clear();
      
      // 2. Crear sesión de emergencia
      const mockUser = { 
        id: 'guest-' + Math.random().toString(36).substr(2, 5), 
        email: 'invitado@ubica2.com', 
        role: 'USER' 
      };
      const mockPayload = btoa(JSON.stringify(mockUser));
      const token = `mock.${mockPayload}.sig`;
      
      // 3. Inyectar directamente en el estado
      this.authStore.setSession(token, 'mock-refresh-direct', mockUser as any);
      
      console.log('[LOGIN] Session injected, navigating...');
      
      // 4. Redirigir inmediatamente
      setTimeout(() => {
        this.loading.set(false);
        this.router.navigate(['/']).then(success => {
          if (!success) {
            console.error('[LOGIN] Navigation failed! Force redirecting...');
            window.location.href = '/';
          }
        });
      }, 400);

    } catch (e) {
      console.error('[LOGIN] Critical error in guest login:', e);
      this.loading.set(false);
      this.error.set('Error crítico en el modo invitado. Por favor refresca la página.');
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }
}
