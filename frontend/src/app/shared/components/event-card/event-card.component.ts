import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { EventItem } from '../../../core/models/api.models';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './event-card.component.html',
  styleUrl: './event-card.component.scss'
})
export class EventCardComponent {
  @Input({ required: true }) event!: EventItem;
  @Input() isFavorite: boolean = false;
  @Input() isAuthenticated: boolean = false;

  @Output() toggleFavorite = new EventEmitter<string>();
  @Output() routeTo = new EventEmitter<EventItem>();
  @Output() viewOnMap = new EventEmitter<EventItem>();

  private router = inject(Router);

  onToggleFavorite(e: MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    this.toggleFavorite.emit(this.event.id);
  }

  onRouteTo(e: MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    this.routeTo.emit(this.event);
  }

  onViewOnMap(e: MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    this.viewOnMap.emit(this.event);
  }

  getEventTime(): string {
    if (!this.event.startTime) return '';
    if (this.event.startTime.includes('T')) {
      return new Date(this.event.startTime).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    }
    if (this.event.startTime.includes(':')) {
      const parts = this.event.startTime.split(':');
      const d = new Date();
      d.setHours(Number(parts[0]));
      d.setMinutes(Number(parts[1]));
      return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    }
    return this.event.startTime;
  }

  getEventDate(): string {
    if (!this.event.startTime && !this.event.eventDate) return '';
    const dateStr = this.event.eventDate || this.event.startTime;
    if (dateStr.includes('T') || dateStr.includes('-')) {
      // Ajuste para la zona horaria asegurando que se parsee como local
      const d = new Date(dateStr);
      // Solo tomamos la parte de la fecha por si viene con timezone:
      return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    return dateStr;
  }
}
