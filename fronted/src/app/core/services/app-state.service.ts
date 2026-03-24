import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AppStateService {
  private refreshPlacesSignal = signal(0);
  
  readonly refreshPlaces = this.refreshPlacesSignal.asReadonly();

  triggerPlacesRefresh(): void {
    this.refreshPlacesSignal.update(v => v + 1);
  }
}
