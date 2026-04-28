import { Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AppStateService {
  private refreshTrigger = new Subject<void>();
  readonly refreshPlaces$ = this.refreshTrigger.asObservable();
  
  readonly authDarkMode = signal(true);
  
  triggerPlacesRefresh(): void {
    this.refreshTrigger.next();
  }

  setAuthDarkMode(isDark: boolean): void {
    this.authDarkMode.set(isDark);
  }
}
