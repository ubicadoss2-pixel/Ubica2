import { CommonModule } from '@angular/common';
import { Component, effect, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { finalize } from 'rxjs/operators';
import { City, Place } from '../../core/models/api.models';
import { AnalyticsService } from '../../core/services/analytics.service';
import { AuthStoreService } from '../../core/services/auth-store.service';
import { CatalogsService } from '../../core/services/catalogs.service';
import { FavoritesService } from '../../core/services/favorites.service';
import { PlacesService } from '../../core/services/places.service';
import { AppStateService } from '../../core/services/app-state.service';
import * as L from 'leaflet';
import 'leaflet-routing-machine';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly catalogsService = inject(CatalogsService);
  private readonly placesService = inject(PlacesService);
  private readonly favoritesService = inject(FavoritesService);
  private readonly analyticsService = inject(AnalyticsService);
  private readonly appState = inject(AppStateService);
  readonly authStore = inject(AuthStoreService);

  readonly cities = signal<City[]>([]);
  readonly placeTypes = signal<Array<{ id: string; name: string }>>([]);
  readonly places = signal<Place[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  readonly favoriteIds = signal<Set<string>>(new Set());

  readonly form = this.fb.nonNullable.group({
    search: '',
    cityId: '',
    placeTypeId: '',
    priceLevel: '',
    status: 'PUBLISHED',
    openNow: false,
    pageSize: 50,
  });

  private allPlaces: Place[] = [];

  private map?: L.Map;
  private markersLayer?: L.LayerGroup;
  private userLocationMarker?: L.Marker;
  private routingControl?: any;
  private searchMarker?: L.Marker;
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private refreshTrigger = new Subject<void>();

  ngOnInit(): void {
    this.loadCatalogs();
    this.loadPlaces();
    if (this.authStore.hasRole('USER')) {
      this.loadFavorites();
    }

    // Reactively update markers when places signal changes
    effect(() => {
      const current = this.places();
      console.log(`[EFFECT] Places updated, count: ${current.length}`);
      if (current.length > 0) {
        this.updateMarkers();
        this.checkQueryParams();
      }
    });

    // Listen for app state changes to reload data
    effect(() => {
      this.appState.refreshPlaces();
      console.log('[APP STATE] Refreshing data...');
      this.loadCatalogs();
      this.loadPlaces();
      if (this.authStore.hasRole('USER')) {
        this.loadFavorites();
      }
    });

    // Listen for route changes to reload data
    this.router.events.subscribe(() => {
      this.loadPlaces();
      this.loadFavorites();
    });
  }

  reloadData(): void {
    this.loadCatalogs();
    this.loadPlaces();
    if (this.authStore.hasRole('USER')) {
      this.loadFavorites();
    }
  }

  private checkQueryParams(): void {
    const params = this.route.snapshot.queryParams;
    if (params['lat'] && params['lng'] && this.map) {
      const lat = Number(params['lat']);
      const lng = Number(params['lng']);
      const placeId = params['placeId'];

      if (!isNaN(lat) && !isNaN(lng)) {
        this.map.setView([lat, lng], 15);
        
        if (placeId) {
          // Open popup for this specific place
          setTimeout(() => {
            if (!this.markersLayer) return;
            this.markersLayer.eachLayer((layer: any) => {
              if (layer instanceof L.Marker) {
                const ll = layer.getLatLng();
                if (Math.abs(ll.lat - lat) < 0.0001 && Math.abs(ll.lng - lng) < 0.0001) {
                  layer.openPopup();
                }
              }
            });
          }, 500);
        }
      }
    }
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  private initMap(): void {
    // Default center in Armenia, Colombia
    const defaultCenter: L.LatLngExpression = [4.5401, -75.6657];
    
    this.map = L.map('map', {
      center: defaultCenter,
      zoom: 13,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    setTimeout(() => {
      this.map?.invalidateSize();
    }, 100);

    this.markersLayer = L.layerGroup().addTo(this.map);

    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const userPos: L.LatLngExpression = [latitude, longitude];
          
          this.map?.setView(userPos, 14);
          
          const icon = L.divIcon({
            className: 'user-location-marker',
            html: '<div class="pulse"></div>',
            iconSize: [20, 20],
          });

          this.userLocationMarker = L.marker(userPos, { icon }).addTo(this.map!);
          this.applyDistanceFilter();
        },
        () => {
          console.warn('Geolocation not allowed.');
          this.error.set('No pudimos acceder a tu ubicación. Por favor, habilita el GPS para calcular rutas.');
        }
      );
    } else {
      this.error.set('Tu navegador no soporta geolocalización.');
    }

    // Effect for place markers
    this.updateMarkers();
  }

  private updateMarkers(): void {
    if (!this.map || !this.markersLayer) return;

    this.markersLayer.clearLayers();
    
    const markers: L.Marker[] = [];

    this.places().forEach((place) => {
      const pLat = Number(place.latitude);
      const pLng = Number(place.longitude);
      
      console.log(`[DEBUG_MARKER] Attempting to add: ${place.name} at (${pLat}, ${pLng})`);
      
      if (!isNaN(pLat) && !isNaN(pLng)) {
        // Create both: a circle marker (bulletproof) and the photo marker
        
        // 1. Photo Marker
        const imageUrl = (place.photos && place.photos.length > 0) 
          ? place.photos[0].url 
          : 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=60';
        
        const customIcon = L.divIcon({
          className: 'custom-photo-marker',
          html: `<div class="marker-photo" style="background-image: url('${imageUrl}'); width: 40px; height: 40px; border: 2px solid white; border-radius: 50%; box-shadow: 0 4px 6px rgba(0,0,0,0.3);"></div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        });

        const photoMarker = L.marker([pLat, pLng], { icon: customIcon });

        const popupContent = document.createElement('div');
        popupContent.className = 'custom-popup';
        popupContent.style.textAlign = 'center';
        popupContent.innerHTML = `
          <h3 style="margin:0 0 5px 0; font-size:1.1rem; color:#333;">${place.name}</h3>
          <span style="font-size:0.85rem; color:#777;">${place.city?.name || ''}</span>
          <p style="margin:5px 0; font-size:0.9rem;">${place.description ? place.description.substring(0, 60) + '...' : ''}</p>
        `;
        
        const routeBtn = document.createElement('button');
        routeBtn.innerText = '📍 Cómo llegar';
        routeBtn.style.cssText = 'width: 100%; padding: 8px; margin-top: 10px; background-color: #4f46e5; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-family: inherit;';
        routeBtn.onclick = () => this.routeTo(place);
        popupContent.appendChild(routeBtn);

        const detailsBtn = document.createElement('button');
        detailsBtn.innerText = '👁️ Ver detalles';
        detailsBtn.style.cssText = 'width: 100%; padding: 8px; margin-top: 5px; background-color: #fff; color: #4f46e5; border: 1px solid #4f46e5; border-radius: 6px; cursor: pointer; font-weight: bold; font-family: inherit;';
        detailsBtn.onclick = () => this.router.navigate(['/places', place.id]);
        popupContent.appendChild(detailsBtn);

        photoMarker.bindPopup(popupContent);
        this.markersLayer!.addLayer(photoMarker);
        markers.push(photoMarker);

        // 2. Simple Circle Marker as fallback (always visible)
        const circle = L.circleMarker([pLat, pLng], {
          radius: 8,
          fillColor: "#ff7800",
          color: "#000",
          weight: 1,
          opacity: 1,
          fillOpacity: 0.8
        }).addTo(this.markersLayer!);
        
        console.log(`[DEBUG_MARKER] Added markers for ${place.name}`);
      } else {
        console.error(`[DEBUG_MARKER] Invalid coords for ${place.name}: ${place.latitude}, ${place.longitude}`);
      }
    });

    console.log(`[DEBUG_MARKER] Total markers added: ${markers.length}`);


    if (markers.length > 0) {
      // Only fit bounds if we have actual markers with non-zero coordinates
      const validMarkers = markers.filter(m => {
        const ll = m.getLatLng();
        return ll.lat !== 0 || ll.lng !== 0;
      });
      if (validMarkers.length > 0) {
        const group = L.featureGroup(validMarkers);
        this.map.fitBounds(group.getBounds(), { padding: [50, 50], maxZoom: 15 });
      }
    }

  }

  routeTo(place: Place): void {
    if (!this.map) return;
    
    // Clear previous errors
    this.error.set(null);

    if (!this.userLocationMarker) {
       this.error.set('Necesitamos saber tu ubicación (dar permisos) para calcular la ruta.');
       return;
    }

    if (!place.latitude || !place.longitude) {
       this.error.set('Este lugar no tiene coordenadas configuradas en el sistema para calcular ruta.');
       return;
    }

    if (this.routingControl) {
      this.map.removeControl(this.routingControl);
    }

    const startPos = this.userLocationMarker.getLatLng();
    const endPos = L.latLng(Number(place.latitude), Number(place.longitude));

    this.routingControl = (L as any).Routing.control({
      waypoints: [
        startPos,
        endPos
      ],
      routeWhileDragging: false,
      language: 'es',
      showAlternatives: true,
      createMarker: () => null
    }).addTo(this.map);
    
    document.getElementById('map')?.scrollIntoView({ behavior: 'smooth' });
  }

  searchAddress(address: string) {
    if (!address.trim()) return;
    this.error.set(null);
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`)
      .then(res => res.json())
      .then(data => {
         if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            this.map?.setView([lat, lon], 14);

            if (this.searchMarker) {
              this.searchMarker.remove();
            }

            if (this.map) {
              const icon = L.divIcon({
                className: 'search-location-marker',
                html: '<div style="background: #e74c3c; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5); animation: pulse 2s infinite;"></div>',
                iconSize: [26, 26],
                iconAnchor: [13, 13]
              });
              this.searchMarker = L.marker([lat, lon], { icon }).addTo(this.map);
              this.searchMarker.bindPopup(`<b>Resultado Buscado:</b><br>${address}`).openPopup();
            }

            // Aplicar el filtro dinámico de 30 km
            this.applyDistanceFilter();
            
            if (this.places().length > 0) {
               this.success.set('Lugares localizados a menos de 30km de la búsqueda.');
               setTimeout(() => this.success.set(null), 3000);
            }

         } else {
            this.error.set('No se encontraron resultados para la dirección.');
         }
      })
      .catch(() => this.error.set('Error al buscar la dirección.'));
  }

  private getCenterPoint(): L.LatLng | null {
    if (this.searchMarker) return this.searchMarker.getLatLng();
    if (this.userLocationMarker) return this.userLocationMarker.getLatLng();
    return null;
  }

  private applyDistanceFilter(): void {
    const center = this.getCenterPoint();
    
    // Default: Show all if no explicit search/radius interaction
    if (!this.searchMarker || !this.map) {
      console.log('[FILTER] Showing all places (No search active)');
      this.places.set(this.allPlaces);
      this.error.set(null);
      return;
    }

    const RADIUS_KM = 30;
    const filtered = this.allPlaces.filter((p: any) => {
      if (p.latitude === null || p.longitude === null) return false;
      const distance = center!.distanceTo([p.latitude, p.longitude]) / 1000;
      return distance <= RADIUS_KM;
    });

    console.log(`[FILTER] Radius filter active. Found ${filtered.length} of ${this.allPlaces.length}`);

    if (filtered.length === 0 && this.allPlaces.length > 0) {
      this.error.set(`No hay resultados a menos de 30km de tu búsqueda. Mostrando todo.`);
      this.places.set(this.allPlaces);
    } else {
      this.places.set(filtered);
      this.error.set(null);
    }
  }

  onFilter(): void {
    if (this.searchMarker) {
      this.searchMarker.remove();
      this.searchMarker = undefined;
    }
    this.loadPlaces();
  }

  goToMyLocation(): void {
    this.error.set(null);
    if (!this.userLocationMarker || !this.map) {
      this.error.set('No pudimos acceder a tu ubicación. Asegúrate de tener el GPS activado.');
      return;
    }

    // Remover el marcador de búsqueda
    if (this.searchMarker) {
      this.searchMarker.remove();
      this.searchMarker = undefined;
    }

    // Centrar mapa en la ubicación del usuario
    const userLatlng = this.userLocationMarker.getLatLng();
    this.map.setView(userLatlng, 14);

    // Restaurar el array y limpiar el campo de texto (opcional, pero con restaurar los lugares basta)
    this.applyDistanceFilter();
    this.success.set('Has vuelto a tu ubicación. Mostrando lugares a 30km.');
    setTimeout(() => this.success.set(null), 3000);
  }

  toggleFavorite(placeId: string): void {
    if (!this.authStore.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    this.success.set(null);
    this.error.set(null);

    const favorites = new Set(this.favoriteIds());
    const isFavorite = favorites.has(placeId);

    const request$ = isFavorite
      ? this.favoritesService.remove(placeId)
      : this.favoritesService.add(placeId);

    request$.subscribe({
      next: () => {
        if (isFavorite) {
          favorites.delete(placeId);
          this.analyticsService.create({ eventType: 'FAVORITE_REMOVE', placeId }).subscribe();
          this.success.set('Quitado de favoritos correctamente.');
        } else {
          favorites.add(placeId);
          this.analyticsService.create({ eventType: 'FAVORITE_ADD', placeId }).subscribe();
          this.success.set('Guardado en favoritos con éxito.');
        }

        this.favoriteIds.set(favorites);
        setTimeout(() => this.success.set(null), 3000);
      },
      error: (err) => this.error.set(err?.error?.message ?? 'No fue posible actualizar favoritos.'),
    });
  }

  private loadCatalogs(): void {
    this.catalogsService.getCities().subscribe((cities) => this.cities.set(cities));
    this.catalogsService.getPlaceTypes().subscribe((types) => this.placeTypes.set(types));
  }

  private loadPlaces(): void {
    console.log('[DEBUG] Loading places...');
    this.loading.set(true);
    this.error.set(null);

    this.placesService
      .list(this.form.getRawValue())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          console.log('[API] Received places:', response.items.length);
          this.allPlaces = response.items;
          this.applyDistanceFilter();
          this.updateMarkers();
        },
        error: (err) => this.error.set(err?.error?.message ?? 'No se pudo cargar lugares.'),
      });
  }

  private loadFavorites(): void {
    this.favoritesService.list().subscribe({
      next: (favorites) => this.favoriteIds.set(new Set(favorites.map((item) => item.placeId))),
    });
  }
}
