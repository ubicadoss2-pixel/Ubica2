import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Favorite } from '../../core/models/api.models';
import { FavoritesService } from '../../core/services/favorites.service';
import { AuthStoreService } from '../../core/services/auth-store.service';
import { PlaceCardComponent } from '../../shared/components/place-card/place-card.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, RouterLink, PlaceCardComponent],
  templateUrl: './favorites.component.html',
  styleUrl: './favorites.component.scss',
})
export class FavoritesComponent {
  private readonly favoritesService = inject(FavoritesService);
  readonly authStore = inject(AuthStoreService);
  private readonly router = inject(Router);

  readonly items = signal<Favorite[]>([]);
  readonly error = signal<string | null>(null);

  constructor() {
    this.load();
  }

  remove(placeId: string): void {
    this.favoritesService.remove(placeId).subscribe({
      next: () => this.load(),
      error: (err) => this.error.set(err?.error?.message ?? 'No se pudo quitar favorito.'),
    });
  }

  toggleFavorite(placeId: string): void {
    // En favoritos, hacer toggle es equivalente a quitar.
    this.remove(placeId);
  }

  routeTo(place: any): void {
    if (place.id) {
      this.router.navigate(['/'], {
        queryParams: {
          placeId: place.id,
          lat: place.latitude,
          lng: place.longitude,
          route: 'true'
        }
      });
    }
  }

  private load(): void {
    this.favoritesService.list().subscribe({
      next: (items) => this.items.set(items),
      error: (err) => this.error.set(err?.error?.message ?? 'No se pudieron cargar favoritos.'),
    });
  }

}
