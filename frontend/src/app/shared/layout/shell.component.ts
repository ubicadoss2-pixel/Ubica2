import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthStoreService } from '../../core/services/auth-store.service';
import { AuthApiService } from '../../core/services/auth-api.service';
import { AppStateService } from '../../core/services/app-state.service';
import { ChatbotWidgetComponent } from '../components/chatbot-widget/chatbot-widget.component';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, TranslatePipe],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  private readonly router = inject(Router);
  readonly authStore = inject(AuthStoreService);
  private readonly authApi = inject(AuthApiService);
  readonly appState = inject(AppStateService);
  isAuthPage(): boolean {
    return this.router.url === '/login' || this.router.url === '/register';
  }

  isReservationPage(): boolean {
    return this.router.url.startsWith('/reservation') || this.router.url.startsWith('/reserve');
  }

  isMenuOpen = signal(false);

  toggleMenu(): void {
    const nextState = !this.isMenuOpen();
    this.isMenuOpen.set(nextState);
    this.appState.menuOpen.set(nextState);
    if (nextState) {
      document.body.classList.add('menu-open-no-scroll');
    } else {
      document.body.classList.remove('menu-open-no-scroll');
    }
  }

  closeMenu(): void {
    this.isMenuOpen.set(false);
    this.appState.menuOpen.set(false);
    document.body.classList.remove('menu-open-no-scroll');
  }


  logout(): void {
    console.log('[SHELL] Absolute logout triggered');
    console.trace('Logout trace:');
    
    try {
      // 1. Limpieza total de almacenamiento local, preservando tema/preferencias visuales
      const theme = localStorage.getItem('theme');
      const fontSize = localStorage.getItem('font_size');
      const language = localStorage.getItem('language');

      this.authStore.logout();
      localStorage.clear();
      sessionStorage.clear();

      if (theme) localStorage.setItem('theme', theme);
      if (fontSize) localStorage.setItem('font_size', fontSize);
      if (language) localStorage.setItem('language', language);

      // 2. Notificar al servidor (intento rápido e ignorar fallos)
      this.authApi.logout().subscribe({
        complete: () => {
          // 3. Refresco total de la página para purgar memoria
          window.location.href = '/login';
        }
      });

      // 4. Fallback si el servidor tarda más de 300ms
      setTimeout(() => {
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }, 400);

    } catch (e) {
      console.error('[SHELL] Critical error in logout:', e);
      localStorage.clear();
      window.location.href = '/login';
    }
  }
}
