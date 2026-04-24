import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Comment, EventItem, Place } from '../../core/models/api.models';
import { AnalyticsService } from '../../core/services/analytics.service';
import { AuthStoreService } from '../../core/services/auth-store.service';
import { CommentsService } from '../../core/services/comments.service';
import { EventsService } from '../../core/services/events.service';
import { FavoritesService } from '../../core/services/favorites.service';
import { PlacesService } from '../../core/services/places.service';
import { ReportsService } from '../../core/services/reports.service';
import { HistoryService } from '../../core/services/preferences-history.service';

@Component({
  selector: 'app-place-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './place-detail.component.html',
  styleUrl: './place-detail.component.scss',
})
export class PlaceDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly placesService = inject(PlacesService);
  private readonly eventsService = inject(EventsService);
  private readonly favoritesService = inject(FavoritesService);
  private readonly reportsService = inject(ReportsService);
  private readonly analyticsService = inject(AnalyticsService);
  private readonly fb = inject(FormBuilder);
  private readonly commentsService = inject(CommentsService);
  private readonly router = inject(Router);
  private readonly historyService = inject(HistoryService);
  readonly auth = inject(AuthStoreService);

  readonly place = signal<Place | null>(null);
  readonly events = signal<EventItem[]>([]);
  readonly comments = signal<Comment[]>([]);
  readonly avgRating = signal<number | null>(null);
  readonly totalComments = signal(0);
  readonly error = signal<string | null>(null);
  readonly info = signal<string | null>(null);
  readonly commentLoading = signal(false);

  readonly reportForm = this.fb.nonNullable.group({
    reason: ['WRONG_INFO', Validators.required],
    details: [''],
  });

  readonly commentForm = this.fb.nonNullable.group({
    rating: [undefined as number | undefined, Validators.required],
    content: ['', [Validators.required, Validators.minLength(3)]],
  });

  constructor() {
    const placeId = this.route.snapshot.paramMap.get('id');
    if (!placeId) {
      this.error.set('Lugar inválido');
      return;
    }

    this.loadData(placeId);
  }

  addFavorite(): void {
    const current = this.place();
    if (!current) return;

    this.favoritesService.add(current.id).subscribe({
      next: () => {
        this.analyticsService.create({ eventType: 'FAVORITE_ADD', placeId: current.id }).subscribe();
        this.info.set('Lugar agregado a favoritos.');
      },
      error: (err) => this.error.set(err?.error?.message ?? 'No se pudo guardar favorito.'),
    });
  }

  reportPlace(): void {
    const current = this.place();
    if (!current) return;

    this.reportsService
      .create({
        targetType: 'PLACE',
        placeId: current.id,
        reason: this.reportForm.value.reason as any,
        details: this.reportForm.value.details ?? undefined,
      })
      .subscribe({
        next: () => {
          this.info.set('Reporte enviado correctamente.');
          this.reportForm.patchValue({ details: '' });
        },
        error: (err) => this.error.set(err?.error?.message ?? 'No fue posible enviar el reporte.'),
      });
  }

  reportEvent(eventId: string): void {
    this.reportsService
      .create({
        targetType: 'EVENT',
        eventId,
        reason: 'WRONG_INFO',
      })
      .subscribe({
        next: () => this.info.set('Reporte de evento enviado.'),
        error: (err) => this.error.set(err?.error?.message ?? 'No fue posible reportar el evento.'),
      });
  }

  trackContactClick(): void {
    const current = this.place();
    if (!current) return;

    this.analyticsService.create({ eventType: 'CONTACT_CLICK', placeId: current.id }).subscribe();
  }

  viewOnMap(): void {
    const current = this.place();
    if (!current || current.latitude === null || current.longitude === null) return;
    this.router.navigate(['/'], { 
      queryParams: { 
        lat: current.latitude, 
        lng: current.longitude,
        placeId: current.id
      } 
    });
  }

  submitComment(): void {
    const current = this.place();
    if (!current) return;

    const { rating, content } = this.commentForm.getRawValue();
    this.commentLoading.set(true);

    this.commentsService.create({
      placeId: current.id,
      rating,
      content,
    }).subscribe({
      next: () => {
        this.commentLoading.set(false);
        this.commentForm.reset({ rating: undefined, content: '' });
        this.info.set('Reseña publicada correctamente.');
        this.loadData(current.id);
      },
      error: (err) => {
        this.commentLoading.set(false);
        this.error.set(err?.error?.message ?? 'No se pudo publicar la reseña.');
      },
    });
  }

  private loadData(placeId: string): void {
    this.placesService.getById(placeId).subscribe({
      next: (place) => {
        this.place.set(place);
        this.analyticsService.create({ eventType: 'PLACE_VIEW', placeId }).subscribe();
        this.historyService.addToHistory(placeId, 'place').subscribe();
      },
      error: (err) => this.error.set(err?.error?.message ?? 'No se pudo cargar el lugar.'),
    });

    this.eventsService.listByPlace(placeId).subscribe({
      next: (response) => {
        this.events.set(response.items);
        response.items.forEach((event) => {
          this.analyticsService.create({ eventType: 'EVENT_VIEW', eventId: event.id }).subscribe();
          this.historyService.addToHistory(event.id, 'event').subscribe();
        });
      },
      error: () => this.events.set([]),
    });

    this.commentsService.list({ placeId, pageSize: 20 }).subscribe({
      next: (res) => {
        this.comments.set(res.items);
        this.avgRating.set(res.averageRating);
        this.totalComments.set(res.total);
      },
      error: () => this.comments.set([]),
    });
  }
}
