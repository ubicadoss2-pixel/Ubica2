import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { Place } from '../../../core/models/api.models';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-place-card',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './place-card.component.html',
  styleUrl: './place-card.component.scss'
})
export class PlaceCardComponent {
  @Input({ required: true }) place!: Place;
  @Input() isFavorite: boolean = false;
  @Input() showReservationButton: boolean = true;
  @Input() layout: 'full' | 'compact' = 'full';
  @Input() isAuthenticated: boolean = false;

  @Output() toggleFavorite = new EventEmitter<string>();
  @Output() routeTo = new EventEmitter<Place>();

  private router = inject(Router);

  onToggleFavorite(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    this.toggleFavorite.emit(this.place.id);
  }

  onRouteTo(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    this.routeTo.emit(this.place);
  }
}
