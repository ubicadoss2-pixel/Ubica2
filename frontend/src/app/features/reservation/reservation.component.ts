import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PlacesService } from '../../core/services/places.service';
import { Place } from '../../core/models/api.models';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
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
  private readonly router = inject(Router);
  private readonly placesService = inject(PlacesService);

  readonly place = signal<Place | null>(null);
  readonly step = signal<1 | 2>(1); // 1: Form, 2: Invoice
  readonly total = signal<number>(0);
  readonly emailPreviewUrl = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly isSubmitting = signal<boolean>(false);
  private readonly http = inject(HttpClient);

  readonly reservationForm = this.fb.group({
    name: ['', Validators.required],
    type: ['mesa', Validators.required],
    date: ['', Validators.required],
    time: ['', Validators.required],
    people: [2, [Validators.required, Validators.min(1)]],
    email: ['', [Validators.required, Validators.email]],
    extras: this.fb.group({
      decoracion: [false],
      vino: [false],
      servicios: [false]
    }),
    notes: ['']
  });

  readonly prices = {
    mesa: 0,
    evento: 50000,
    vip: 100000,
    decoracion_ocasion: 30000,
    decoracion_tematica: 45000,
    vino: 80000,
    servicios: 20000
  };

  todayDate = new Date();

  ngOnInit() {
    const placeId = this.route.snapshot.paramMap.get('placeId');
    if (!placeId) {
      this.error.set('Lugar no encontrado');
      return;
    }
    this.loadPlace(placeId);

    // Calculate total on value changes
    this.reservationForm.valueChanges.subscribe(() => {
      this.calculateTotal();
    });
  }

  private loadPlace(id: string) {
    this.placesService.getById(id).subscribe({
      next: (place) => this.place.set(place),
      error: () => {
        const mocks: Record<string, any> = {
          'm-1': { name: 'El Solar', img: '/assets/elsolar.jpg', type: 'Gastrobar' },
          'm-2': { name: 'El Bunker', img: '/assets/elbunker.jpg', type: 'Bar' },
          'm-3': { name: 'Museo de Oro', img: '/assets/museodeoro.jpg', type: 'Museo' },
          'm-4': { name: 'Parque de La Vida', img: '/assets/ParquedeLaVidaArmenia.jpeg', type: 'Parque' },
          'm-5': { name: 'Antro Urbano', img: '/assets/AntroUrbano.jpg', type: 'Discoteca' },
          'm-6': { name: 'London Bar', img: '/assets/londonbar.jpg', type: 'Bar' },
          'm-7': { name: 'Centro de convenciones', img: '/assets/Centrodeconvenciones.jpg', type: 'Centro' },
          'm-8': { name: 'Coffee Garden', img: '/assets/CoffeeGarden.jpg', type: 'Café' },
          'm-9': { name: 'Coliseo del Cafe', img: '/assets/ColiseodelCafe.jpg', type: 'Coliseo' },
          'm-10': { name: 'Rancho Eden', img: '/assets/RanchoEden.jpg', type: 'Restaurante' },
          'm-11': { name: 'The Grill Station', img: '/assets/TheGrillStation.jpg', type: 'Restaurante' },
          'm-12': { name: 'El Roble', img: '/assets/elRoble.jpg', type: 'Restaurante' },
          'm-13': { name: 'Festival de Faroles', img: '/assets/festival de Faroles.jpg', type: 'Festival' },
          'm-14': { name: 'Festival Musica', img: '/assets/festivalMusica.jpeg', type: 'Festival' },
          'm-15': { name: 'La Estacion', img: '/assets/laestacion.jpg', type: 'Lugar' },
          'm-16': { name: 'Plaza Bolivar', img: '/assets/plazabolivar.jpg', type: 'Lugar' },
          'm-17': { name: 'Portal Quindio', img: '/assets/portalquindio.jpg', type: 'Lugar' },
          'm-18': { name: 'Route 66', img: '/assets/route66.jpg', type: 'Bar' },
          'm-19': { name: 'Zoco Bar', img: '/assets/zocobar.jpg', type: 'Bar' }
        };
        const mock = mocks[id] || { name: 'Lugar Recomendado', img: '/assets/route66.jpg', type: 'Lugar' };
        
        this.place.set({
          id,
          name: mock.name,
          description: 'Lugar espectacular en Armenia.',
          placeType: { name: mock.type },
          photos: [{ url: mock.img }]
        } as any);
      }
    });
  }

  calculateTotal() {
    const values = this.reservationForm.value;
    let sum = 0;

    if (values.type === 'evento') sum += this.prices.evento;
    else if (values.type === 'vip') sum += this.prices.vip;
    else if (values.type === 'decoracion_ocasion') sum += this.prices.decoracion_ocasion;

    if (values.extras?.decoracion) sum += this.prices.decoracion_tematica;
    if (values.extras?.vino) sum += this.prices.vino;
    if (values.extras?.servicios) sum += this.prices.servicios;

    this.total.set(sum);
  }

  confirmReservation() {
    if (this.reservationForm.invalid) {
      this.error.set('Por favor completa todos los campos requeridos.');
      return;
    }
    this.error.set(null);
    this.isSubmitting.set(true);

    const data = this.invoiceData;
    const extrasObj = [];
    if (data.extras?.decoracion) extrasObj.push({ name: 'Decoración Temática', price: this.prices.decoracion_tematica });
    if (data.extras?.vino) extrasObj.push({ name: 'Botella de Vino', price: this.prices.vino });
    if (data.extras?.servicios) extrasObj.push({ name: 'Servicios Adicionales', price: this.prices.servicios });

    const payload = {
      placeName: data.placeName,
      date: data.date,
      time: data.time,
      guests: data.people,
      type: this.getTypeLabel(data.type as string),
      email: data.email,
      ownerEmail: this.place()?.ownerUser?.email,
      extras: extrasObj,
      total: data.total
    };

    this.http.post(`${environment.apiBaseUrl}/reservations/confirm`, payload).subscribe({
      next: (res: any) => {
        this.isSubmitting.set(false);
        this.step.set(2);
        if (res?.previewUrl) {
          this.emailPreviewUrl.set(res.previewUrl);
        }
      },
      error: (err) => {
        console.warn('Fallback: Mostrando factura aunque falló el email', err);
        this.isSubmitting.set(false);
        this.step.set(2);
      }
    });
  }

  get invoiceData() {
    return {
      placeName: this.place()?.name,
      ...this.reservationForm.value,
      total: this.total()
    };
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      mesa: 'Reserva de Mesa (Gratis)',
      evento: 'Evento Especial ($50.000)',
      vip: 'Zona VIP ($100.000)',
      decoracion_ocasion: 'Decoración por Ocasión ($30.000)'
    };
    return labels[type] || type;
  }

  downloadPdf() {
    window.print();
  }
}
