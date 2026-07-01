import { Injectable, signal, effect } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AppStateService {
  private refreshTrigger = new Subject<void>();
  readonly refreshPlaces$ = this.refreshTrigger.asObservable();
  
  private refreshEventsTrigger = new Subject<void>();
  readonly refreshEvents$ = this.refreshEventsTrigger.asObservable();
  
  private routeTrigger = new Subject<{lat: number, lng: number, name: string}>();
  readonly routeRequest$ = this.routeTrigger.asObservable();
  
  readonly authDarkMode = signal(true);
  readonly menuOpen = signal(false);
  readonly theme = signal<'dark' | 'light'>(
    (localStorage.getItem('theme') as 'dark' | 'light') || 'dark'
  );

  constructor() {
    // Aplicar el tema inmediatamente al arrancar (evita flash de color incorrecto)
    const savedTheme = this.theme();
    document.documentElement.setAttribute('data-theme', savedTheme);

    // Sincronizar el atributo data-theme con el signal theme cuando cambie
    effect(() => {
      const currentTheme = this.theme();
      console.log('[THEME] Global Switch to:', currentTheme);
      
      // Aplicar a html (root)
      document.documentElement.setAttribute('data-theme', currentTheme);
      
      // Aplicar a body (clases y atributo)
      document.body.setAttribute('data-theme', currentTheme);
      document.body.classList.remove('light-theme', 'dark-theme');
      document.body.classList.add(`${currentTheme}-theme`);
      
      localStorage.setItem('theme', currentTheme);
    });
  }
  
  triggerPlacesRefresh(): void {
    this.refreshTrigger.next();
  }

  triggerEventsRefresh(): void {
    this.refreshEventsTrigger.next();
  }

  triggerRouteToPlace(lat: number, lng: number, name: string): void {
    this.routeTrigger.next({ lat, lng, name });
  }

  setAuthDarkMode(isDark: boolean): void {
    this.authDarkMode.set(isDark);
  }

  toggleTheme(): void {
    this.theme.update(t => t === 'dark' ? 'light' : 'dark');
  }
}
