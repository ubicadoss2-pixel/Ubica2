import { Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AppStateService {
  private refreshTrigger = new Subject<void>();
  readonly refreshPlaces$ = this.refreshTrigger.asObservable();
  
  triggerPlacesRefresh(): void {
    this.refreshTrigger.next();
  }
}
