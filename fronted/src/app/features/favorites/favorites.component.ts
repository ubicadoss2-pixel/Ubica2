import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Favorite } from '../../core/models/api.models';
import { FavoritesService } from '../../core/services/favorites.service';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './favorites.component.html',
  styleUrl: './favorites.component.scss',
})
export class FavoritesComponent {
  private readonly favoritesService = inject(FavoritesService);

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

  private load(): void {
    this.favoritesService.list().subscribe({
      next: (items) => this.items.set(items),
      error: (err) => this.error.set(err?.error?.message ?? 'No se pudieron cargar favoritos.'),
    });
  }
}
