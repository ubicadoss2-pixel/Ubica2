import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PlacesService } from '../../core/services/places.service';
import { Place } from '../../core/models/api.models';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-reservation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reservation.component.html',
  styleUrl: './reservation.component.scss'
})
export class ReservationComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly placesService = inject(PlacesService);
  private readonly http = inject(HttpClient);

  readonly place = signal<Place | null>(null);
  readonly step = signal<1 | 2>(1); // 1: Form, 2: Success
  readonly error = signal<string | null>(null);
  readonly isSubmitting = signal<boolean>(false);
  
  readonly reservationForm = this.fb.group({
    guestName: ['', Validators.required],
    date: ['', Validators.required],
    time: ['', Validators.required],
    people: [2, [Validators.required, Validators.min(1)]],
    email: ['', [Validators.required, Validators.email]],
    reason: [''],
    observations: ['']
  });

  readonly reasons = [
    'Visita general',
    'Reunión',
    'Celebración',
    'Cumpleaños',
    'Familiar',
    'Negocios',
    'Otro'
  ];

  todayDate = new Date().toISOString().split('T')[0];

  ngOnInit() {
    const placeId = this.route.snapshot.paramMap.get('placeId');
    if (!placeId) {
      this.error.set('Lugar no encontrado');
      return;
    }
    this.loadPlace(placeId);
  }

  private loadPlace(id: string) {
    this.placesService.getById(id).subscribe({
      next: (place) => this.place.set(place),
      error: () => {
        this.error.set('No se pudo cargar el establecimiento');
      }
    });
  }

  confirmReservation() {
    if (this.reservationForm.invalid) {
      this.error.set('Por favor completa todos los campos requeridos.');
      return;
    }
    this.error.set(null);
    this.isSubmitting.set(true);

    const data = this.reservationForm.value;

    const payload = {
      placeId: this.place()?.id,
      placeName: this.place()?.name,
      guestName: data.guestName,
      date: data.date,
      time: data.time,
      guests: data.people,
      reason: data.reason,
      observations: data.observations,
      email: data.email,
      ownerEmail: this.place()?.ownerUser?.email
    };

    this.http.post(`${environment.apiBaseUrl}/reservations/confirm`, payload).subscribe({
      next: (res: any) => {
        this.isSubmitting.set(false);
        this.step.set(2);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.step.set(2);
      }
    });
  }

  downloadPdf() {
    window.print();
  }
}
