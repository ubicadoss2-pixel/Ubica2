import { CommonModule } from '@angular/common';
import { Component, effect, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, timeout } from 'rxjs/operators';
import { City, Place } from '../../core/models/api.models';
import { AnalyticsService } from '../../core/services/analytics.service';
import { AuthStoreService } from '../../core/services/auth-store.service';
import { CatalogsService } from '../../core/services/catalogs.service';
import { FavoritesService } from '../../core/services/favorites.service';
import { PlacesService } from '../../core/services/places.service';
import { AppStateService } from '../../core/services/app-state.service';
import { NotificationService } from '../../core/services/notification.service';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import * as L from 'leaflet';
import 'leaflet-routing-machine';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslatePipe],
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
  private readonly notificationService = inject(NotificationService);

  readonly cities = signal<City[]>([]);
  readonly placeTypes = signal<Array<{ id: string; name: string }>>([]);
  readonly places = signal<Place[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  readonly favoriteIds = signal<Set<string>>(new Set());
  readonly recommendations = signal<Place[]>([]);
  readonly showHeatmap = signal(false);

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
  private heatmapLayer?: L.LayerGroup;
  private promoShown = false;
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly placesEffect = effect(() => {
    const current = this.places();
    console.log(`[EFFECT] Places updated, count: ${current.length}`);
    if (current.length > 0 && this.map && this.markersLayer) {
      this.updateMarkers();
    }
  });

  private readonly refreshEffect = effect(() => {
    const _ = this.appState.refreshPlaces$;
    console.log('[DEBUG] Places refresh triggered via AppState');
    this.loadPlaces();
  });

  ngOnInit(): void {
    this.loadCatalogs();
    this.loadPlaces();
    if (this.authStore.hasRole('USER')) {
      this.loadFavorites();
    }

    this.route.queryParamMap.subscribe(params => {
      this.handleNavigationParams(params);
    });

    this.demoFlashPromo();

    this.router.events.subscribe(() => {
      this.loadPlaces();
      if (this.authStore.hasRole('USER')) {
        this.loadFavorites();
      }
    });
  }

  private handleNavigationParams(params: any): void {
    const lat = params.get('lat');
    const lng = params.get('lng');
    const placeId = params.get('placeId');

    if (lat && lng && this.map) {
      this.map.setView([Number(lat), Number(lng)], 16);
      
      if (placeId) {
        // Wait for markers and places to be ready
        setTimeout(() => {
          const targetPlace = this.allPlaces.find(p => p.id === placeId);
          if (targetPlace) {
             this.routeTo(targetPlace);
             this.map?.setView([Number(lat), Number(lng)], 17);
          }
          
          if (!this.markersLayer) return;
          this.markersLayer.eachLayer((layer: any) => {
            if (layer instanceof L.Marker) {
              const ll = layer.getLatLng();
              if (Math.abs(ll.lat - Number(lat)) < 0.001 && Math.abs(ll.lng - Number(lng)) < 0.001) {
                layer.openPopup();
              }
            }
          });
        }, 1000);
      }
    }
  }

  reloadData(): void {
    this.loadCatalogs();
    this.loadPlaces();
    if (this.authStore.hasRole('USER')) {
      this.loadFavorites();
    }
  }


  private checkQueryParams(): void {
    // This is now handled reactively by handleNavigationParams
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  private initMap(): void {
    // Default center in Armenia, Colombia
    const defaultCenter: L.LatLngExpression = [4.5401, -75.6657];
    
    // Light tiles (Google Maps style)
    const lightMap = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    });
    
    const standardOSM = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    });

    const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    });

    this.map = L.map('map', {
      center: defaultCenter,
      zoom: 13,
      layers: [lightMap],
      zoomControl: false 
    });

    // Add zoom control at bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    const baseMaps = {
      "Mapa Claro": lightMap,
      "Clásico (OSM)": standardOSM,
      "Satélite (Tierra)": satellite,
    };

    L.control.layers(baseMaps, undefined, { position: 'topright' }).addTo(this.map);

    this.heatmapLayer = L.layerGroup();
    // No lo añadimos al mapa por defecto, solo si el usuario lo activa


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
          html: `
            <div class="marker-container">
              <div class="marker-glow"></div>
              <div class="marker-photo" style="background-image: url('${imageUrl}');"></div>
              <div class="marker-pin"></div>
            </div>
          `,
          iconSize: [46, 46],
          iconAnchor: [23, 46],
          popupAnchor: [0, -40]
        });

        const photoMarker = L.marker([pLat, pLng], { icon: customIcon });

        const popupContent = document.createElement('div');
        popupContent.className = 'modern-popup';
        popupContent.innerHTML = `
          <div class="popup-image" style="background-image: url('${imageUrl}');"></div>
          <div class="popup-body">
            <span class="popup-badge">${place.placeType?.name || 'LUGAR'}</span>
            <h3>${place.name}</h3>
            <p>${place.description ? place.description.substring(0, 80) + '...' : 'Sin descripción'}</p>
            <div class="popup-actions">
              <button class="btn-route-action">📍 Ir ahora</button>
              <button class="btn-detail-action">✨ Ver más</button>
            </div>
          </div>
        `;
        
        const routeBtn = popupContent.querySelector('.btn-route-action') as HTMLButtonElement;
        routeBtn.onclick = () => this.routeTo(place);

        const detailsBtn = popupContent.querySelector('.btn-detail-action') as HTMLButtonElement;
        detailsBtn.onclick = () => this.router.navigate(['/places', place.id]);

        photoMarker.bindPopup(popupContent, {
          closeButton: false,
          className: 'modern-leaflet-popup'
        });
        this.markersLayer!.addLayer(photoMarker);
        markers.push(photoMarker);
        
        console.log(`[DEBUG_MARKER] Added markers for ${place.name}`);
      } else {
        console.error(`[DEBUG_MARKER] Invalid coords for ${place.name}: ${place.latitude}, ${place.longitude}`);
      }
    });

    console.log(`[DEBUG_MARKER] Total markers added: ${markers.length}`);


    if (markers.length > 0 && !this.route.snapshot.queryParams['placeId']) {
      // Only fit bounds if we are NOT focusing on a specific place via query params
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

  toggleHeatmap(): void {
    if (!this.map || !this.heatmapLayer) return;
    this.showHeatmap.update(v => !v);
    
    if (this.showHeatmap()) {
      this.updateHeatmap();
      this.heatmapLayer.addTo(this.map);
    } else {
      this.heatmapLayer.remove();
    }
  }

  private updateHeatmap(): void {
    if (!this.heatmapLayer) return;
    this.heatmapLayer.clearLayers();

    const currentPlaces = this.places();
    // Simulate heat by adding large translucent circles with blur effect
    currentPlaces.forEach(p => {
      if (p.latitude && p.longitude) {
        const circle = L.circle([Number(p.latitude), Number(p.longitude)], {
          radius: 500,
          fillColor: '#bf00ff',
          fillOpacity: 0.15,
          color: '#ff00ff',
          weight: 1,
          className: 'heatmap-circle'
        });
        this.heatmapLayer?.addLayer(circle);
      }
    });
  }

  private demoFlashPromo(): void {
    if (this.promoShown) return;
    this.promoShown = true;
    
    setTimeout(() => {
      this.notificationService.show({
        type: 'promo',
        title: '¡Promoción Relámpago! 🔥',
        message: 'Happy Hour clandestino en "El Bunker". 2x1 en toda la coctelería de autor. ¡Toca aquí para ver!',
        duration: 15000,
        link: '/place-detail/mock-real-bunker'
      });
    }, 5000);
  }

  private updateRecommendations(): void {
    const now = new Date();
    const hour = now.getHours();
    let recommended: Place[] = [];

    if (hour >= 6 && hour < 12) {
      // Morning: Coffee/Breakfast
      recommended = this.allPlaces.filter(p => p.placeType?.name?.toLowerCase().includes('café') || p.name.toLowerCase().includes('solar'));
    } else if (hour >= 12 && hour < 18) {
      // Afternoon: Restaurants/Gastrobar
      recommended = this.allPlaces.filter(p => p.placeType?.name?.toLowerCase().includes('restaurante') || p.placeType?.name?.toLowerCase().includes('gastrobar'));
    } else {
      // Evening/Night: Bars/Discos
      recommended = this.allPlaces.filter(p => p.placeType?.name?.toLowerCase().includes('disco') || p.placeType?.name?.toLowerCase().includes('bar'));
    }

    this.recommendations.set(recommended.slice(0, 4));
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
      .pipe(
        timeout(2000),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (response) => {
          // Filter out Bogota as requested by user
          const filteredResponseItems = response.items.filter(p => 
            p.city?.name?.toLowerCase() !== 'bogota'
          );
          
          // Inject photos and mock places for Armenia
          const processedItems = filteredResponseItems.map(place => {
            const lowerName = (place.name || '').toLowerCase().trim();
            if (!place.photos || place.photos.length === 0) {
              if (lowerName.includes('museo del oro')) {
                return { ...place, photos: [{ url: 'https://arquitecturapanamericana.com/wp-content/uploads/2016/10/Salmona-1.jpg' }] as any };
              }
              if (lowerName.includes('parque de la vida')) {
                return { ...place, photos: [{ url: 'https://images.unsplash.com/photo-1542332213-9b5a5a3fab35?auto=format&fit=crop&w=800&q=60' }] as any };
              }
            }
            return place;
          });

          // Add 3 REAL iconic places for Armenia
          const armeniaMocks: any[] = [
            {
              id: 'mock-real-1',
              name: 'Restaurante La Fogata',
              description: 'El restaurante más icónico de Armenia. Excelencia en parrillada, cocina internacional y una cava de vinos y cocteles inigualable.',
              city: { name: 'Armenia' },
              placeType: { name: 'Restaurante' },
              priceLevel: 5,
              photos: [{ url: 'https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&w=800&q=60' }],
              latitude: 4.5512,
              longitude: -75.6598
            },
            {
              id: 'mock-real-2',
              name: 'El Solar Gastrobar',
              description: 'Ambiente rústico y moderno en el norte de Armenia. Famoso por sus platos para compartir y coctelería experimental.',
              city: { name: 'Armenia' },
              placeType: { name: 'Gastrobar' },
              priceLevel: 3,
              photos: [{ url: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=800&q=60' }],
              latitude: 4.5495,
              longitude: -75.6631
            },
            {
              id: 'mock-real-3',
              name: 'Dar Papaya',
              description: 'El epicentro de la rumba y los mejores cocteles en la Avenida Bolívar. Un clásico imperdible de la noche quindiana.',
              city: { name: 'Armenia' },
              placeType: { name: 'Discoteca/Bar' },
              priceLevel: 3,
              photos: [{ url: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?auto=format&fit=crop&w=800&q=60' }],
              latitude: 4.5540,
              longitude: -75.6580
            },
            {
              id: 'mock-real-bunker',
              name: 'El Bunker',
              description: 'Experiencia clandestina en el corazón de Armenia. Coctelería de autor y ambiente industrial con toques de neón.',
              city: { name: 'Armenia' },
              placeType: { name: 'Bar/Gastrobar' },
              priceLevel: 4,
              photos: [{ url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=60' }],
              latitude: 4.5450,
              longitude: -75.6680
            }
          ];

          this.allPlaces = [...processedItems, ...armeniaMocks];
          this.applyDistanceFilter();
          this.updateMarkers();
          this.updateRecommendations();
          if (this.showHeatmap()) this.updateHeatmap();
        },
        error: (err) => {
          this.error.set(err?.error?.message ?? 'Modo offline: Mostrando lugares destacados.');
          
          const armeniaMocks: any[] = [
            { id: 'mock-real-1', name: 'Restaurante La Fogata', description: 'El restaurante más icónico de Armenia... (Offline)', city: { name: 'Armenia' }, placeType: { name: 'Restaurante' }, priceLevel: 5, photos: [{ url: 'https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&w=800&q=60' }], latitude: 4.5512, longitude: -75.6598 },
            { id: 'mock-real-2', name: 'El Solar Gastrobar', description: 'Ambiente rústico y moderno... (Offline)', city: { name: 'Armenia' }, placeType: { name: 'Gastrobar' }, priceLevel: 3, photos: [{ url: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=800&q=60' }], latitude: 4.5495, longitude: -75.6631 },
            { id: 'mock-real-3', name: 'Dar Papaya', description: 'El epicentro de la rumba... (Offline)', city: { name: 'Armenia' }, placeType: { name: 'Discoteca/Bar' }, priceLevel: 3, photos: [{ url: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?auto=format&fit=crop&w=800&q=60' }], latitude: 4.5540, longitude: -75.6580 },
            { id: 'mock-real-bunker', name: 'El Bunker', description: 'Experiencia clandestina... (Offline)', city: { name: 'Armenia' }, placeType: { name: 'Bar/Gastrobar' }, priceLevel: 4, photos: [{ url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=60' }], latitude: 4.5450, longitude: -75.6680 },
            { id: 'mock-real-4', name: 'Museo del Oro Quimbaya', description: 'Un museo espectacular diseñado por Rogelio Salmona. (Offline)', city: { name: 'Armenia' }, placeType: { name: 'Museo' }, priceLevel: 2, photos: [{ url: 'https://arquitecturapanamericana.com/wp-content/uploads/2016/10/Salmona-1.jpg' }], latitude: 4.5501, longitude: -75.6606 }
          ];

          this.allPlaces = armeniaMocks;
          this.applyDistanceFilter();
          this.updateMarkers();
        }
      });
  }

  private loadFavorites(): void {
    this.favoritesService.list().subscribe({
      next: (favorites) => this.favoriteIds.set(new Set(favorites.map((item) => item.placeId))),
    });
  }
}
