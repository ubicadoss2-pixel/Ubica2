import { CommonModule } from '@angular/common';
import { Component, effect, inject, signal, OnInit, AfterViewInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, timeout } from 'rxjs/operators';
import { City, Place, EventItem } from '../../core/models/api.models';
import { AnalyticsService } from '../../core/services/analytics.service';
import { AuthStoreService } from '../../core/services/auth-store.service';
import { CatalogsService } from '../../core/services/catalogs.service';
import { FavoritesService } from '../../core/services/favorites.service';
import { PlacesService } from '../../core/services/places.service';
import { EventsService } from '../../core/services/events.service';
import { AppStateService } from '../../core/services/app-state.service';
import { CommentsService } from '../../core/services/comments.service';
import { Comment } from '../../core/models/api.models';
import { NotificationService } from '../../core/services/notification.service';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { PlaceCardComponent } from '../../shared/components/place-card/place-card.component';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';
import * as L from 'leaflet';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe, PlaceCardComponent, SkeletonComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, AfterViewInit {
  private readonly fb = inject(FormBuilder);
  private readonly catalogsService = inject(CatalogsService);
  private readonly placesService = inject(PlacesService);
  private readonly eventsService = inject(EventsService);
  private readonly favoritesService = inject(FavoritesService);
  private readonly analyticsService = inject(AnalyticsService);
  private readonly appState = inject(AppStateService);
  readonly authStore = inject(AuthStoreService);
  private readonly notificationService = inject(NotificationService);
  private readonly commentsService = inject(CommentsService);

  readonly cities = signal<City[]>([]);
  readonly placeTypes = signal<Array<{ id: string; name: string }>>([]);
  readonly places = signal<Place[]>([]);
  readonly events = signal<EventItem[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  readonly favoriteIds = signal<Set<string>>(new Set());
  readonly recommendations = signal<Place[]>([]);
  readonly recentComments = signal<Comment[]>([]);
  readonly showHeatmap = signal(false);
  readonly isRoutingActive = signal(false);
  readonly routeInstructions = signal<any[]>([]);
  readonly routeSummary = signal<any>(null);
  readonly currentInstructionIndex = signal(0);
  readonly isRoutingPanelExpanded = signal(false);

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
  private routePlaceIdForRouting: string | null = null;
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly placesEffect = effect(() => {
    const current = this.places();
    console.log(`[EFFECT] Places updated, count: ${current.length}`);
    // Siempre refrescamos markers (también cuando el filtro deja 0 resultados)
    // para que el mapa no se quede mostrando markers viejos.
    if (this.map && this.markersLayer) {
      this.updateMarkers();
    }
  });

  private readonly themeEffect = effect(() => {
    const theme = this.appState.theme();
    console.log('[MAP EFFECT] Theme changed to:', theme);
    if (!this.map) return;

    // Remove all layers first to avoid overlap
    this.map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        this.map?.removeLayer(layer);
      }
    });

    const tilesUrl = theme === 'dark' 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    
    L.tileLayer(tilesUrl).addTo(this.map);
  });

  ngOnInit(): void {
    this.loadCatalogs();
    this.loadPlaces();
    this.loadEvents();
    this.loadRecentComments();
    if (this.authStore.isAuthenticated()) {
      this.loadFavorites();
    }

    // Listen for route requests from chatbot
    this.appState.routeRequest$.subscribe(req => {
      console.log('[DEBUG] Route requested from Chatbot:', req);
      // Try to find the exact place in allPlaces
      const matchedPlace = this.allPlaces.find(p => p.name === req.name || (Number(p.latitude) === req.lat && Number(p.longitude) === req.lng));
      
      if (matchedPlace) {
        this.routeTo(matchedPlace);
      } else {
        // Create a synthetic place for routing if not loaded
        this.routeTo({ 
          id: 'synthetic-' + Date.now(), 
          name: req.name, 
          latitude: String(req.lat), 
          longitude: String(req.lng) 
        } as any);
      }
    });

    this.appState.refreshPlaces$.subscribe(() => {
      console.log('[DEBUG] Places refresh triggered via AppState');
      this.loadPlaces();
    });

    this.appState.refreshEvents$.subscribe(() => {
      console.log('[DEBUG] Events refresh triggered via AppState');
      this.loadEvents();
    });

    this.route.queryParamMap.subscribe(params => {
      this.handleNavigationParams(params);
    });

    this.demoFlashPromo();

    // Navigation logic handled by queryParamMap
  }

  private handleNavigationParams(params: any): void {
    const lat = params.get('lat');
    const lng = params.get('lng');
    const placeId = params.get('placeId');
    const eventId = params.get('eventId');
    const isRoute = params.get('route') === 'true';

    if (!lat && !lng && !placeId && !eventId) {
      if (this.userLocationMarker && this.map) {
        this.userLocationMarker.addTo(this.map);
      }
      return;
    }

    let targetLat = lat ? Number(lat) : null;
    let targetLng = lng ? Number(lng) : null;

    const attemptNavigation = (retries = 0) => {
      // Wait until map and layers are ready
      if (!this.map || !this.markersLayer) {
        if (retries < 40) {
          setTimeout(() => attemptNavigation(retries + 1), 100);
        }
        return;
      }

      let matchedPlace: any = null;
      let matchedEvent: any = null;

      if (placeId) {
        matchedPlace = this.allPlaces.find(p => p.id === placeId);
      }
      if (eventId) {
        matchedEvent = this.events().find(e => e.id === eventId);
        if (!matchedPlace && matchedEvent?.placeId) {
            matchedPlace = this.allPlaces.find(p => p.id === matchedEvent.placeId);
        }
      }

      if (!targetLat || !targetLng) {
         if (matchedPlace && matchedPlace.latitude && matchedPlace.longitude) {
            targetLat = Number(matchedPlace.latitude);
            targetLng = Number(matchedPlace.longitude);
         }
      }

      if (!targetLat || !targetLng || isNaN(targetLat) || isNaN(targetLng)) return;

      // Inmediatamente centramos el mapa
      this.map.setView([targetLat, targetLng], 17);

      let foundMarker: any = null;

      // Ocultar temporalmente otros marcadores si solo queremos "Ver en mapa" y no estamos ruteando
      // o incluso si estamos ruteando, podemos limpiar los bounds.
      // Pero "Ver en mapa" oculta los demas para enfocarse:
      if (!isRoute) {
        if (this.userLocationMarker) {
          this.map!.removeLayer(this.userLocationMarker);
        }
        this.markersLayer.eachLayer((layer: any) => {
          if (layer instanceof L.Marker) {
             const ll = layer.getLatLng();
             const isTarget = (placeId && (layer as any).placeId === placeId) || 
                              (Math.abs(ll.lat - targetLat!) < 0.0001 && Math.abs(ll.lng - targetLng!) < 0.0001);
             if (!isTarget) {
                 this.map!.removeLayer(layer); // remove temporally
             } else {
                 foundMarker = layer;
             }
          }
        });
      } else {
        if (this.userLocationMarker) {
          this.userLocationMarker.addTo(this.map!); // Asegurarnos de que esté visible en ruta
        }
        this.markersLayer.eachLayer((layer: any) => {
          if (layer instanceof L.Marker) {
            const ll = layer.getLatLng();
            if ((layer as any).placeId === placeId || (Math.abs(ll.lat - targetLat!) < 0.0001 && Math.abs(ll.lng - targetLng!) < 0.0001)) {
              foundMarker = layer;
            }
          }
        });
      }

      if (foundMarker) {
        foundMarker.openPopup();
        document.getElementById('map')?.scrollIntoView({ behavior: 'smooth' });
        if (isRoute) {
          if (matchedPlace) {
            this.routeTo(matchedPlace);
          } else {
            this.routeTo({ id: placeId, latitude: targetLat, longitude: targetLng, name: matchedEvent?.title || 'Destino del Evento' } as any);
          }
        }
        return;
      }

      // Si no se encontró el marcador y aún estamos cargando lugares, esperar
      if (this.loading() && retries < 40) {
        setTimeout(() => attemptNavigation(retries + 1), 100);
        return;
      }

      // Marcador temporal mejorado
      const title = matchedEvent ? matchedEvent.title : (matchedPlace ? matchedPlace.name : 'Ubicación');
      const icon = L.divIcon({
        className: 'temp-event-marker',
        html: `<div style="background: var(--neon-purple, #bf00ff); width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5); animation: pulse 2s infinite;"></div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });
      const tempMarker = L.marker([targetLat, targetLng], { icon }).addTo(this.map!);
      (tempMarker as any).placeId = placeId;
      
      const img = matchedEvent?.photos?.[0]?.url || matchedPlace?.photos?.[0]?.url;
      const imgHtml = img ? `<img src="${img}" style="width:100%;height:80px;object-fit:cover;border-radius:8px;margin-bottom:8px;">` : '';
      
      tempMarker.bindPopup(`<div style="text-align:center; min-width: 150px;">${imgHtml}<b>${title}</b><br><small>${matchedEvent ? 'Evento' : 'Destino'}</small></div>`).openPopup();
      document.getElementById('map')?.scrollIntoView({ behavior: 'smooth' });

      if (isRoute) {
        this.routeTo({ id: placeId, latitude: targetLat, longitude: targetLng, name: title } as any);
      }
    };

    attemptNavigation();
  }

  reloadData(): void {
    this.loadCatalogs();
    this.loadPlaces();
    this.loadEvents();
    if (this.authStore.isAuthenticated()) {
      this.loadFavorites();
    }
  }


  private checkQueryParams(): void {
    // This is now handled reactively by handleNavigationParams
  }

  ngAfterViewInit(): void {
    // Small delay to ensure the DOM is ready and container has dimensions
    setTimeout(() => {
      this.initMap();
    }, 100);
  }

  private initMap(): void {
    // Default center in Armenia, Colombia
    const defaultCenter: L.LatLngExpression = [4.5401, -75.6657];
    
    // Neon Dark Tiles (CartoDB Dark Matter)
    const darkNeonMap = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    });

    const lightMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    });
    
    const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    });

    if (this.map) return;

    const currentTheme = this.appState.theme();
    const initialLayer = currentTheme === 'dark' ? darkNeonMap : lightMap;

    this.map = L.map('map', {
      center: defaultCenter,
      zoom: 13,
      layers: [initialLayer],
      zoomControl: false 
    });

    // Force refresh size to avoid gray boxes
    setTimeout(() => {
      this.map?.invalidateSize();
    }, 500);

    // Add zoom control at bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(this.map);



    this.heatmapLayer = L.layerGroup();
    // No lo añadimos al mapa por defecto, solo si el usuario lo activa


    this.markersLayer = L.layerGroup().addTo(this.map);

    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const userPos: L.LatLngExpression = [latitude, longitude];
          
          // No forcing view reset here to allow external params to override
          
          const icon = L.divIcon({
            className: 'user-location-marker',
            html: '<div class="pulse"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          });

          this.userLocationMarker = L.marker(userPos, { icon }).addTo(this.map!);
          this.userLocationMarker.bindPopup('Mi ubicación', { closeButton: false });
          this.userLocationMarker.on('click', () => {
            const currentPos = this.userLocationMarker?.getLatLng();
            if (currentPos) {
              this.map?.setView(currentPos, 14);
              this.userLocationMarker?.openPopup();
            }
          });
          this.applyDistanceFilter();
        },
        () => {
          console.warn('Geolocation not allowed or timed out.');
          this.notificationService.error('Explorar', 'Modo offline: Mostrando ubicación simulada porque no hay GPS.');
          const fallbackPos: L.LatLngExpression = [4.5401, -75.6657];
          const icon = L.divIcon({
            className: 'user-location-marker',
            html: '<div class="pulse"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          });
          this.userLocationMarker = L.marker(fallbackPos, { icon }).addTo(this.map!);
          this.userLocationMarker.bindPopup('Mi ubicación (Simulada)', { closeButton: false });
          this.userLocationMarker.on('click', () => {
            const currentPos = this.userLocationMarker?.getLatLng();
            if (currentPos) {
              this.map?.setView(currentPos, 14);
              this.userLocationMarker?.openPopup();
            }
          });
          this.applyDistanceFilter();
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      this.notificationService.error('Explorar', 'Tu navegador no soporta geolocalización.');
    }

    // Effect for place markers
    this.updateMarkers();
  }

  private updateMarkers(): void {
    if (!this.map || !this.markersLayer) return;

    this.markersLayer.clearLayers();
    
    const markers: L.Marker[] = [];
    const routePlaceId = this.isRoutingActive() ? (this.routePlaceIdForRouting || this.route.snapshot.queryParamMap.get('placeId')) : null;
    const routeEventId = this.route.snapshot.queryParamMap.get('eventId');

    this.places().forEach((place) => {
      // Si hay ruta activa, solo mostramos el marcador del destino
      if (this.isRoutingActive() && routePlaceId && String(place.id) !== String(routePlaceId)) {
        return;
      }

      const pLat = Number(place.latitude);
      const pLng = Number(place.longitude);
      
      if (!isNaN(pLat) && !isNaN(pLng)) {
        let imageUrl = (place.photos && place.photos.length > 0 && place.photos[0].url && place.photos[0].url.trim() !== '') 
          ? place.photos[0].url 
          : 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=60';
        
        let titleName = place.name;
        let badgeName = place.placeType?.name || 'LUGAR';
        let customInfoHtml = '';
        
        // Si hay un eventId en la ruta, extraemos la info de ese evento para el popup
        if (routeEventId) {
          const targetEvent = this.events().find(e => String(e.id) === String(routeEventId));
          if (targetEvent) {
            titleName = targetEvent.title;
            badgeName = 'EVENTO';
            if (targetEvent.photos && targetEvent.photos.length > 0) {
              imageUrl = targetEvent.photos[0].url;
            }
            const eventDateStr = targetEvent.eventDate || new Date().toISOString();
            const startTimeStr = targetEvent.startTime || new Date().toISOString();
            const eventDate = new Date(eventDateStr).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
            
            let eventTime = startTimeStr;
            if (startTimeStr.includes('T')) {
                eventTime = new Date(startTimeStr).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
            } else if (startTimeStr.includes(':')) {
                const [h, m] = startTimeStr.split(':');
                const d = new Date();
                d.setHours(Number(h));
                d.setMinutes(Number(m));
                eventTime = d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
            }
            
            const showPlaceInfo = this.isRoutingActive() ? `
                <div style="display: flex; align-items: center; gap: 6px;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--neon-purple)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                  <span>${place.name}</span>
                </div>
            ` : '';
            
            customInfoHtml = `
              <div style="margin-top: 8px; display: flex; flex-direction: column; gap: 6px; font-size: 0.8rem; color: var(--ink-normal);">
                ${showPlaceInfo}
                <div style="display: flex; align-items: center; gap: 6px;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--neon-purple)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                  <span>${eventDate}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--neon-purple)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16.5 12"/></svg>
                  <span>${eventTime}</span>
                </div>
              </div>
            `;
          }
        }
        
        const customIcon = L.divIcon({
          className: 'custom-photo-marker',
          html: `
            <div class="marker-container">
              <div class="marker-photo" style="background-image: url('${imageUrl}');"></div>
              <div class="marker-pin"></div>
            </div>
          `,
          iconSize: [32, 42],
          iconAnchor: [16, 42],
          popupAnchor: [0, -35]
        });

        const photoMarker = L.marker([pLat, pLng], { icon: customIcon });
        (photoMarker as any).placeId = place.id;

        const popupContent = document.createElement('div');
        popupContent.className = 'modern-popup';

        const descriptions: Record<string, string> = {
          'La Fogata': 'Restaurante icónico fundado en 1963. Famoso por su exquisito baby beef a la parrilla.',
          'El Solar': 'Sofisticado gastrobar. Ofrece música en vivo, coctelería y pizzas artesanales.',
          'El Bunker': 'Exclusivo club de temática industrial. El lugar de moda para la rumba joven.',
          'Coffee Garden': 'Acogedor café de especialidad. Ideal para tardear rodeado de naturaleza.',
          'Museo de Oro': 'Joya arquitectónica con una invaluable colección de orfebrería de la cultura Quimbaya.',
          'Parque de La Vida': 'El pulmón verde de la ciudad con senderos ecológicos, cascadas y un lago central.',
          'The Grill Station': 'Paraíso de las hamburguesas artesanales y carnes maduradas estilo tex-mex.',
          'Antro Urbano': 'Vibrante discoteca de música urbana. Punto de encuentro nocturno los fines de semana.',
          'London Bar': 'Pub de estilo británico con rock clásico en vivo y cervezas de barril.',
          'Centro de convenciones': 'El recinto más moderno del Quindío para grandes eventos corporativos y ferias.',
          'Coliseo del Cafe': 'Escenario deportivo tradicional, sede de torneos y epicentro de conciertos.',
          'Rancho Eden': 'Restaurante campestre famoso por sus parrilladas y comida típica quindiana.',
          'El Roble': 'Legendario parador, parada obligada para disfrutar de arepas de choclo y sancocho.',
          'La Estacion': 'Emblemática estación de tren convertida en polo cultural y arquitectónico.',
          'Plaza Bolivar': 'El corazón cívico de Armenia, hogar de la Catedral de la Inmaculada Concepción.',
          'Portal Quindio': 'El centro comercial más exclusivo, con amplia gastronomía, cine y tiendas.',
          'Route 66': 'Restaurante-bar retro americano. Famoso por sus hamburguesas y música en vivo.',
          'Zoco Bar': 'Elegante lounge bar de luces tenues con selecta carta de licores y tapas gourmet.'
        };
        const defaultDesc = place.description ? place.description.substring(0, 100) + '...' : 'Un lugar increíble que debes conocer.';
        const matchKey = Object.keys(descriptions).find(k => place.name.includes(k));
        let richDesc = matchKey ? descriptions[matchKey] : defaultDesc;

        if (routeEventId) {
          const targetEvent = this.events().find(e => String(e.id) === String(routeEventId));
          if (targetEvent && targetEvent.description) {
            richDesc = targetEvent.description.substring(0, 150) + (targetEvent.description.length > 150 ? '...' : '');
          }
        }

        let eventsHtml = '';
        if (!routeEventId) {
          const placeEvents = this.events().filter(e => e.placeId === place.id && e.status === 'ACTIVE');
          if (placeEvents.length > 0) {
            eventsHtml = `
              <div class="popup-events-section" style="margin-top: 8px; border-top: 1px solid var(--border-quiet); padding-top: 8px;">
                <h4 style="margin: 0 0 6px 0; font-size: 0.85rem; color: var(--neon-purple); font-weight: bold; display: flex; align-items: center; gap: 4px;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg>
                  Eventos Activos:
                </h4>
                <div style="max-height: 110px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px;">
            `;
            placeEvents.forEach(e => {
              const eImg = (e.photos && e.photos.length > 0) ? e.photos[0].url : 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=80&q=65';
              let evTime = e.startTime || '';
              if (evTime.includes('T')) {
                evTime = new Date(evTime).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
              } else if (evTime.includes(':')) {
                const [h, m] = evTime.split(':');
                const d = new Date();
                d.setHours(Number(h), Number(m));
                evTime = d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
              }
              
              eventsHtml += `
                <div class="popup-event-item" style="display: flex; align-items: center; gap: 8px;">
                  <img src="${eImg}" style="width: 28px; height: 28px; border-radius: 4px; object-fit: cover;" />
                  <div style="flex-grow: 1; min-width: 0;">
                    <p style="margin: 0; font-size: 0.8rem; font-weight: 700; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; color: var(--ink-primary);">${e.title}</p>
                    <p style="margin: 0; font-size: 0.7rem; color: var(--ink-muted); display: flex; align-items: center; gap: 3px;">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16.5 12"/></svg>
                      ${evTime}
                    </p>
                  </div>
                </div>
              `;
            });
            eventsHtml += `
                </div>
              </div>
            `;
          } else {
            eventsHtml = `
              <div class="popup-events-section" style="margin-top: 8px; border-top: 1px solid var(--border-quiet); padding-top: 8px;">
                <p style="margin: 0; font-size: 0.75rem; color: var(--ink-muted); font-style: italic;">Este lugar actualmente no tiene eventos programados.</p>
              </div>
            `;
          }
        }

        const detailsHtml = `
          <div class="popup-details-panel" style="display:none; padding-top: 5px;">
            <p class="popup-desc-text" style="font-size: 0.9rem; line-height: 1.4; color: var(--ink-normal);">${richDesc}</p>
          </div>
        `;

        popupContent.innerHTML = `
          <div class="popup-image" style="background-image: url('${imageUrl}');"></div>
          <div class="popup-body">
            <span class="popup-badge">${badgeName}</span>
            <h3>${titleName}</h3>
            ${customInfoHtml}
            ${detailsHtml}
            ${eventsHtml}
            <div class="popup-actions" style="margin-top: 10px;">
              <button class="btn-route-action" id="route-btn-${place.id}" style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                Ir ahora
              </button>
              <button class="btn-detail-action" id="detail-btn-${place.id}">Ver más</button>
            </div>
          </div>
        `;
        
        // Route button
        const routeBtn = popupContent.querySelector(`#route-btn-${place.id}`) as HTMLButtonElement;
        if (routeBtn) routeBtn.onclick = (e) => { e.stopPropagation(); this.routeTo(place); };

        // Ver más button - toggle the description + featured panel
        const detailsBtn = popupContent.querySelector(`#detail-btn-${place.id}`) as HTMLButtonElement;
        const detailsPanel = popupContent.querySelector('.popup-details-panel') as HTMLElement;
        let detailsOpen = false;
        if (detailsBtn && detailsPanel) {
          detailsBtn.onclick = (e) => {
            e.stopPropagation();
            detailsOpen = !detailsOpen;
            detailsPanel.style.display = detailsOpen ? 'block' : 'none';
            detailsBtn.innerHTML = detailsOpen ? `
              <span style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                Cerrar
              </span>
            ` : 'Ver más';
          };
        }

        photoMarker.bindPopup(popupContent, {
          closeButton: true,
          className: 'modern-leaflet-popup',
          maxWidth: 260
        });
        this.markersLayer!.addLayer(photoMarker);
        markers.push(photoMarker);
      }
    });

    if (markers.length > 0 && !this.route.snapshot.queryParams['placeId']) {
      // Focus on Armenia [4.5401, -75.6657] if we are not looking for a specific place
      const armeniaCenter = L.latLng(4.5401, -75.6657);
      const armeniaMarkers = markers.filter(m => m.getLatLng().distanceTo(armeniaCenter) < 50000); // 50km around Armenia

      if (armeniaMarkers.length > 0) {
        const group = L.featureGroup(armeniaMarkers);
        this.map.fitBounds(group.getBounds(), { padding: [70, 70], maxZoom: 15 });
      } else {
        const group = L.featureGroup(markers);
        this.map.fitBounds(group.getBounds(), { padding: [50, 50], maxZoom: 15 });
      }
    }
  }

  async routeTo(place: Place): Promise<void> {
    if (!this.map) return;
    
    // Clear previous errors
    this.error.set(null);

    if (!place || !place.latitude || !place.longitude) {
       this.notificationService.error('Explorar', 'Este lugar no tiene coordenadas configuradas en el sistema o son inválidas para calcular ruta.');
       return;
    }

    if (!this.userLocationMarker) {
       this.notificationService.error('Explorar', 'Necesitamos saber tu ubicación (dar permisos) para calcular la ruta.');
       return;
    }

    // Set routing active and hide non-destination markers
    this.isRoutingActive.set(true);
    this.routePlaceIdForRouting = place.id;
    let destinationFound = false;

    if (this.markersLayer) {
      this.markersLayer.eachLayer((layer: any) => {
        if (layer instanceof L.Marker && layer !== this.userLocationMarker) {
          if ((layer as any).placeId === place.id) {
            destinationFound = true;
          } else {
            layer.remove();
          }
        }
      });

      // If destination marker wasn't found (e.g., from chatbot), create a temporary one
      if (!destinationFound) {
        const icon = L.divIcon({
          className: 'destination-marker',
          html: '<div style="background: var(--neon-purple); width: 22px; height: 22px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>',
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });
        const destMarker = L.marker([Number(place.latitude), Number(place.longitude)], { icon });
        (destMarker as any).placeId = place.id;
        destMarker.bindPopup(`<b>${place.name}</b><br>Destino`);
        destMarker.addTo(this.markersLayer);
      }
    }

    if (this.routingControl) {
      this.map.removeControl(this.routingControl);
    }

    const startPos = this.userLocationMarker.getLatLng();
    const endPos = L.latLng(Number(place.latitude), Number(place.longitude));
    
    try {
      // Ensure Leaflet is on window for leaflet-routing-machine to hook into
      (window as any).L = L;
      await import('leaflet-routing-machine');

      this.routingControl = (L as any).Routing.control({
        waypoints: [
          startPos,
          endPos
        ],
        routeWhileDragging: false,
        language: 'es',
        showAlternatives: false,
        show: false,
        createMarker: () => null,
        lineOptions: {
          styles: [{ color: '#bf00ff', opacity: 0.8, weight: 6 }],
          extendToWaypoints: true,
          missingRouteTolerance: 1
        },
        fitSelectedRoutes: true
      }).addTo(this.map!);
      
      this.routingControl.on('routesfound', (e: any) => {
        const routes = e.routes;
        if (routes && routes.length > 0) {
          const mainRoute = routes[0];
          this.routeInstructions.set(mainRoute.instructions);
          this.routeSummary.set({
            totalDistance: mainRoute.summary.totalDistance,
            totalTime: mainRoute.summary.totalTime
          });
          this.currentInstructionIndex.set(0);
          this.isRoutingPanelExpanded.set(false);
        }
      });
      
      this.routingControl.on('routingerror', (err: any) => {
        console.error('Routing error:', err);
        this.notificationService.error('Explorar', 'No se pudo calcular la ruta. Verifica si el destino es accesible por vías regulares.');
        this.cancelRoute();
      });
      
    } catch (err) {
      console.error('Error loading leaflet-routing-machine', err);
      this.notificationService.error('Explorar', 'No se pudo cargar el motor de rutas. Intenta nuevamente.');
    }
    
    document.getElementById('map')?.scrollIntoView({ behavior: 'smooth' });
  }

  nextInstruction(): void {
    if (this.currentInstructionIndex() < this.routeInstructions().length - 1) {
      this.currentInstructionIndex.update(i => i + 1);
    }
  }

  prevInstruction(): void {
    if (this.currentInstructionIndex() > 0) {
      this.currentInstructionIndex.update(i => i - 1);
    }
  }

  toggleRoutingPanel(): void {
    this.isRoutingPanelExpanded.update(v => !v);
  }

  cancelRoute(): void {
    if (this.routingControl && this.map) {
      this.map.removeControl(this.routingControl);
      this.routingControl = undefined;
    }
    this.isRoutingActive.set(false);
    this.routePlaceIdForRouting = null;
    this.routeInstructions.set([]);
    this.routeSummary.set(null);
    this.currentInstructionIndex.set(0);
    this.isRoutingPanelExpanded.set(false);
    
    // Si veníamos de una URL de ruta, la limpiamos
    if (this.route.snapshot.queryParamMap.has('route')) {
      const queryParams = { ...this.route.snapshot.queryParams };
      delete queryParams['route'];
      this.router.navigate([], { queryParams, replaceUrl: true });
    }
    this.updateMarkers();
  }

  getInstructionIcon(type: string): string {
    switch (type) {
      case 'Straight': return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V2"/><path d="m5 9 7-7 7 7"/></svg>';
      case 'Left':
      case 'SlightLeft':
      case 'SharpLeft': return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3 2 10l7 7"/><path d="M2 10h14a6 6 0 0 1 6 6v5"/></svg>';
      case 'Right':
      case 'SlightRight':
      case 'SharpRight': return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 3 7 7-7 7"/><path d="M22 10H8a6 6 0 0 0-6 6v5"/></svg>';
      case 'TurnAround': return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 4V9a2 2 0 0 1-2 2H4a2 2 0 0 0-2 2v5"/><path d="m7 11-5 5 5 5"/></svg>';
      case 'WaypointReached':
      case 'DestinationReached': return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>';
      case 'Roundabout': return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 14 4-4-4-4"/><path d="M16 10H8a4 4 0 0 0-4 4v7"/></svg>';
      default: return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>';
    }
  }

  formatDistance(meters: number): string {
    if (!meters) return '0 m';
    if (meters > 1000) return (meters / 1000).toFixed(1) + ' km';
    return Math.round(meters) + ' m';
  }

  formatTime(seconds: number): string {
    if (!seconds) return '0 min';
    if (seconds > 3600) return Math.floor(seconds / 3600) + ' h ' + Math.round((seconds % 3600) / 60) + ' min';
    return Math.round(seconds / 60) + ' min';
  }

  searchAddress(address: string) {
    if (!address.trim()) return;
    this.error.set(null);
    const queryStr = address.toLowerCase().includes('armenia') ? address : `${address}, Armenia, Quindio, Colombia`;
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryStr)}`)
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
               // this.notificationService.success('Explorar', 'Lugares localizados a menos de 30km de la búsqueda.');
               
            }

         } else {
            this.notificationService.error('Explorar', 'No se encontraron resultados para la dirección.');
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
    if (!this.searchMarker && !this.userLocationMarker || !this.map) {
      console.log('[FILTER] Showing all places (No search/location active). Total:', this.allPlaces.length);
      this.places.set([...this.allPlaces]); // Ensure a new reference to trigger signals
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
      this.notificationService.error('Explorar', `No hay resultados a menos de 30km de tu búsqueda. Mostrando todo.`);
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
    this.loadEvents();
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
        title: '¡Ofertas Exclusivas! 🎉',
        message: 'Descubre promociones especiales en los mejores lugares de Armenia. ¡Toca para explorar todas las ofertas!',
        duration: 12000,
        link: '/promotions'
      });
    }, 45000);
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
    this.loading.set(true);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.loading.set(false);
          const { latitude, longitude } = position.coords;
          const userPos: L.LatLngExpression = [latitude, longitude];

          if (this.map) {
            this.map.setView(userPos, 14);

            if (this.userLocationMarker) {
              this.userLocationMarker.setLatLng(userPos);
            } else {
              const icon = L.divIcon({
                className: 'user-location-marker',
                html: '<div class="pulse"></div>',
                iconSize: [20, 20],
                iconAnchor: [10, 10],
              });
              this.userLocationMarker = L.marker(userPos, { icon }).addTo(this.map);
              this.userLocationMarker.bindPopup('Mi ubicación', { closeButton: false });
              this.userLocationMarker.on('click', () => {
                const currentPos = this.userLocationMarker?.getLatLng();
                if (currentPos) {
                  this.map?.setView(currentPos, 14);
                  this.userLocationMarker?.openPopup();
                }
              });
            }

            // Remover el marcador de búsqueda
            if (this.searchMarker) {
              this.searchMarker.remove();
              this.searchMarker = undefined;
            }

            // Sólo aplicar filtro si no estamos en medio de una ruta, para no dañar el estado del mapa
            if (!this.isRoutingActive()) {
              this.applyDistanceFilter();
            }
            // this.notificationService.success('Explorar', 'Ubicación actualizada correctamente.');
            
          }
        },
        (err) => {
          this.loading.set(false);
          console.error('Geolocation error:', err);
          this.notificationService.error('Explorar', 'Modo offline: Mostrando ubicación simulada porque no hay GPS.');
          const fallbackPos: L.LatLngExpression = [4.5451, -75.6620];
          if (this.map) {
            this.map.setView(fallbackPos, 14);
            if (this.userLocationMarker) {
              this.userLocationMarker.setLatLng(fallbackPos);
            } else {
              const icon = L.divIcon({
                className: 'user-location-marker',
                html: '<div class="pulse"></div>',
                iconSize: [20, 20],
                iconAnchor: [10, 10],
              });
              this.userLocationMarker = L.marker(fallbackPos, { icon }).addTo(this.map);
              this.userLocationMarker.bindPopup('Mi ubicación (Simulada)', { closeButton: false });
              this.userLocationMarker.on('click', () => {
                const currentPos = this.userLocationMarker?.getLatLng();
                if (currentPos) {
                  this.map?.setView(currentPos, 14);
                  this.userLocationMarker?.openPopup();
                }
              });
            }
            if (!this.isRoutingActive()) {
              this.applyDistanceFilter();
            }
          }
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      this.loading.set(false);
      this.notificationService.error('Explorar', 'Tu navegador no soporta geolocalización.');
    }
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
        } else {
          favorites.add(placeId);
          this.analyticsService.create({ eventType: 'FAVORITE_ADD', placeId }).subscribe();
        }

        this.favoriteIds.set(favorites);
        
      },
      error: (err) => this.error.set(err?.error?.message ?? 'No fue posible actualizar favoritos.'),
    });
  }

  private loadCatalogs(): void {
    this.catalogsService.getCities().subscribe((cities) => {
      const armeniaOnly = cities.filter(c => c.name.toLowerCase() === 'armenia');
      this.cities.set(armeniaOnly);
    });
    this.catalogsService.getPlaceTypes().subscribe((types) => this.placeTypes.set(types));
  }

  private loadPlaces(): void {
    console.log('[DEBUG] Loading places...');
    this.loading.set(true);
    this.error.set(null);

    this.placesService
      .list(this.form.getRawValue())
      .pipe(
        timeout(15000),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (response) => {
          const filteredResponseItems = response.items.filter(p => 
            p.city?.name?.toLowerCase() === 'armenia'
          );
          
          const mockItems: Place[] = [
            { id: 'm-13', cityId: 'city-1', placeTypeId: 'type-1', name: 'El Chalet', description: 'La mejor rumba crossover con un ambiente espectacular.', city: { name: 'Armenia' } as any, placeType: { name: 'Discoteca' } as any, priceLevel: 3, photos: [{ url: '/assets/elchalet.png' }] as any, latitude: 4.5550 as any, longitude: -75.6600 as any, status: 'PUBLISHED' as any, slug: 'el-chalet', averageRating: 4.8, totalComments: 25 } as any,
            { id: 'm-14', cityId: 'city-1', placeTypeId: 'type-1', name: 'Arepas Nattys', description: 'Las arepas rellenas más famosas y deliciosas de la región.', city: { name: 'Armenia' } as any, placeType: { name: 'Restaurante' } as any, priceLevel: 1, photos: [{ url: '/assets/ArepasNattys.png' }] as any, latitude: 4.5405 as any, longitude: -75.6655 as any, status: 'PUBLISHED' as any, slug: 'arepas-nattys', averageRating: 4.7, totalComments: 42 } as any,
            { id: 'm-15', cityId: 'city-1', placeTypeId: 'type-1', name: 'La Viejoteca', description: 'Música de antaño y el mejor ambiente tradicional para bailar.', city: { name: 'Armenia' } as any, placeType: { name: 'Bar' } as any, priceLevel: 2, photos: [{ url: '/assets/Laviejoteca.png' }] as any, latitude: 4.5380 as any, longitude: -75.6680 as any, status: 'PUBLISHED' as any, slug: 'la-viejoteca', averageRating: 4.6, totalComments: 18 } as any,
            { id: 'm-20', cityId: 'city-1', placeTypeId: 'type-1', name: 'Samba Caramba', description: 'Discoteca con buena musica. ¡Pura candela!', city: { name: 'Armenia' } as any, placeType: { name: 'Discoteca' } as any, priceLevel: 3, photos: [{ url: '/assets/Sambacaramba.png' }] as any, latitude: 4.5425 as any, longitude: -75.6630 as any, status: 'PUBLISHED' as any, slug: 'samba-caramba', averageRating: 4.9, totalComments: 34 } as any,
            { id: 'm-1', cityId: 'city-1', placeTypeId: 'type-1', name: 'El Solar', description: 'Ambiente rústico y moderno en el norte de la ciudad. Coctelería premium.', city: { name: 'Armenia' } as any, placeType: { name: 'Gastrobar' } as any, priceLevel: 3, photos: [{ url: '/assets/elsolar.jpg' }] as any, latitude: 4.5495 as any, longitude: -75.6631 as any, status: 'PUBLISHED' as any, slug: 'el-solar', averageRating: 4.8 },
            { id: 'm-2', cityId: 'city-1', placeTypeId: 'type-1', name: 'El Bunker', description: 'Experiencia clandestina en el corazón de Armenia. Coctelería de autor.', city: { name: 'Armenia' } as any, placeType: { name: 'Bar' } as any, priceLevel: 4, photos: [{ url: '/assets/elbunker.jpg' }] as any, latitude: 4.5450 as any, longitude: -75.6680 as any, status: 'PUBLISHED' as any, slug: 'el-bunker', averageRating: 4.7 },
            { id: 'm-3', cityId: 'city-1', placeTypeId: 'type-1', name: 'Museo de Oro', description: 'Tesoros arqueológicos invaluables de la cultura Quimbaya.', city: { name: 'Armenia' } as any, placeType: { name: 'Museo' } as any, priceLevel: 2, photos: [{ url: '/assets/museodeoro.jpg' }] as any, latitude: 4.5501 as any, longitude: -75.6606 as any, status: 'PUBLISHED' as any, slug: 'museo-de-oro', averageRating: 4.9 },
            { id: 'm-4', cityId: 'city-1', placeTypeId: 'type-1', name: 'Parque de La Vida', description: 'Un oasis verde dentro de la ciudad con lagos y senderos ecológicos.', city: { name: 'Armenia' } as any, placeType: { name: 'Parque' } as any, priceLevel: 1, photos: [{ url: '/assets/ParquedeLaVidaArmenia.jpeg' }] as any, latitude: 4.5451 as any, longitude: -75.6620 as any, status: 'PUBLISHED' as any, slug: 'parque-de-la-vida', averageRating: 4.6 },
            { id: 'm-5', cityId: 'city-1', placeTypeId: 'type-1', name: 'Antro Urbano', description: 'Lugar de fiesta urbana con la mejor energía.', city: { name: 'Armenia' } as any, placeType: { name: 'Discoteca' } as any, priceLevel: 3, photos: [{ url: '/assets/AntroUrbano.jpg' }] as any, latitude: 4.5420 as any, longitude: -75.6690 as any, status: 'PUBLISHED' as any, slug: 'antro-urbano', averageRating: 4.5 },
            { id: 'm-6', cityId: 'city-1', placeTypeId: 'type-1', name: 'London Bar', description: 'Pub estilo londinense con cervezas artesanales y de barril.', city: { name: 'Armenia' } as any, placeType: { name: 'Bar' } as any, priceLevel: 3, photos: [{ url: '/assets/londonbar.jpg' }] as any, latitude: 4.5465 as any, longitude: -75.6640 as any, status: 'PUBLISHED' as any, slug: 'london-bar', averageRating: 4.7 },
            { id: 'm-7', cityId: 'city-1', placeTypeId: 'type-1', name: 'Centro de convenciones', description: 'Epicentro de los mayores eventos corporativos y ferias.', city: { name: 'Armenia' } as any, placeType: { name: 'Centro' } as any, priceLevel: 2, photos: [{ url: '/assets/Centrodeconvenciones.jpg' }] as any, latitude: 4.5470 as any, longitude: -75.6650 as any, status: 'PUBLISHED' as any, slug: 'centro-convenciones', averageRating: 4.4 },
            { id: 'm-8', cityId: 'city-1', placeTypeId: 'type-1', name: 'Coffee Garden', description: 'Café de especialidad rodeado de jardines hermosos.', city: { name: 'Armenia' } as any, placeType: { name: 'Café' } as any, priceLevel: 2, photos: [{ url: '/assets/CoffeeGarden.jpg' }] as any, latitude: 4.5480 as any, longitude: -75.6620 as any, status: 'PUBLISHED' as any, slug: 'coffee-garden', averageRating: 4.8 },
            { id: 'm-9', cityId: 'city-1', placeTypeId: 'type-1', name: 'Coliseo del Cafe', description: 'El recinto deportivo y cultural tradicional de la ciudad.', city: { name: 'Armenia' } as any, placeType: { name: 'Coliseo' } as any, priceLevel: 1, photos: [{ url: '/assets/ColiseodelCafe.jpg' }] as any, latitude: 4.5410 as any, longitude: -75.6700 as any, status: 'PUBLISHED' as any, slug: 'coliseo-cafe', averageRating: 4.3 },
            { id: 'm-10', cityId: 'city-1', placeTypeId: 'type-1', name: 'Rancho Eden', description: 'Restaurante campestre con deliciosa comida típica.', city: { name: 'Armenia' } as any, placeType: { name: 'Restaurante' } as any, priceLevel: 3, photos: [{ url: '/assets/RanchoEden.jpg' }] as any, latitude: 4.5300 as any, longitude: -75.6800 as any, status: 'PUBLISHED' as any, slug: 'rancho-eden', averageRating: 4.6 },
            { id: 'm-11', cityId: 'city-1', placeTypeId: 'type-1', name: 'The Grill Station', description: 'Las mejores hamburguesas y cortes de carne a la parrilla.', city: { name: 'Armenia' } as any, placeType: { name: 'Restaurante' } as any, priceLevel: 3, photos: [{ url: '/assets/TheGrillStation.jpg' }] as any, latitude: 4.5512 as any, longitude: -75.6598 as any, status: 'PUBLISHED' as any, slug: 'grill-station', averageRating: 4.7 },
            { id: 'm-12', cityId: 'city-1', placeTypeId: 'type-1', name: 'El Roble', description: 'Legendario parador con comida típica.', city: { name: 'Armenia' } as any, placeType: { name: 'Restaurante' } as any, priceLevel: 2, photos: [{ url: '/assets/elRoble.jpg' }] as any, latitude: 4.5600 as any, longitude: -75.6500 as any, status: 'PUBLISHED' as any, slug: 'el-roble', averageRating: 4.5 },
            { id: 'm-16', cityId: 'city-1', placeTypeId: 'type-1', name: 'Plaza Bolivar', description: 'El corazón cívico de Armenia.', city: { name: 'Armenia' } as any, placeType: { name: 'Lugar' } as any, priceLevel: 1, photos: [{ url: '/assets/plazabolivar.jpg' }] as any, latitude: 4.5330 as any, longitude: -75.6720 as any, status: 'PUBLISHED' as any, slug: 'plaza-bolivar', averageRating: 4.4 },
            { id: 'm-17', cityId: 'city-1', placeTypeId: 'type-1', name: 'Portal Quindio', description: 'El centro comercial más exclusivo.', city: { name: 'Armenia' } as any, placeType: { name: 'Lugar' } as any, priceLevel: 2, photos: [{ url: '/assets/portalquindio.jpg' }] as any, latitude: 4.5550 as any, longitude: -75.6600 as any, status: 'PUBLISHED' as any, slug: 'portal-quindio', averageRating: 4.7 },
            { id: 'm-18', cityId: 'city-1', placeTypeId: 'type-1', name: 'Route 66', description: 'Restaurante-bar retro americano.', city: { name: 'Armenia' } as any, placeType: { name: 'Bar' } as any, priceLevel: 3, photos: [{ url: '/assets/route66.jpg' }] as any, latitude: 4.5450 as any, longitude: -75.6650 as any, status: 'PUBLISHED' as any, slug: 'route-66', averageRating: 4.6 },
            { id: 'm-19', cityId: 'city-1', placeTypeId: 'type-1', name: 'Zoco Bar', description: 'Elegante lounge bar.', city: { name: 'Armenia' } as any, placeType: { name: 'Bar' } as any, priceLevel: 4, photos: [{ url: '/assets/zocobar.jpg' }] as any, latitude: 4.5480 as any, longitude: -75.6610 as any, status: 'PUBLISHED' as any, slug: 'zoco-bar', averageRating: 4.8 }
          ];

          // Filtrar mockItems según lo que devolvió el backend (filteredResponseItems)
          let all = mockItems.filter(mock => 
            filteredResponseItems.some(p => 
              p.name.toLowerCase().trim() === mock.name.toLowerCase().trim() || 
              p.name.toLowerCase().trim().includes(mock.name.toLowerCase().trim()) ||
              mock.name.toLowerCase().trim().includes(p.name.toLowerCase().trim())
            )
          );

          // AGREGAR los lugares del backend que no están en los mockItems
          filteredResponseItems.forEach(p => {
             const existingIndex = all.findIndex(m => m.name.toLowerCase() === p.name.toLowerCase() || p.name.toLowerCase().includes(m.name.toLowerCase()) || m.name.toLowerCase().includes(p.name.toLowerCase()));
             const isSpons = p.isSponsored || localStorage.getItem(`sponsored_${p.id}`) === 'true';

             if (existingIndex >= 0) {
                all[existingIndex].isSponsored = isSpons || false;
                all[existingIndex].id = p.id;
             } else {
                // Es un lugar nuevo del backend!
                all.push({
                   ...p,
                   isSponsored: isSpons || false,
                } as any);
             }
          });

          // Ordenar: Los destacados (isSponsored) primero
          all.sort((a, b) => {
            if (a.isSponsored && !b.isSponsored) return -1;
            if (!a.isSponsored && b.isSponsored) return 1;
            return 0;
          });

          this.allPlaces = all;
          this.applyDistanceFilter();
          this.updateMarkers();
          this.updateRecommendations();
        }
      });
  }

  private loadFavorites(): void {
    this.favoritesService.list().subscribe({
      next: (favorites) => this.favoriteIds.set(new Set(favorites.map((item) => item.placeId))),
    });
  }

  private loadRecentComments(): void {
    this.commentsService.list({ pageSize: 4 }).subscribe({
      next: (res) => {
        if (res.items && res.items.length > 0) {
          this.recentComments.set(res.items);
        } else {
          this.setFallbackComments();
        }
      },
      error: () => this.setFallbackComments()
    });
  }

  private setFallbackComments(): void {
    this.recentComments.set([
      { id: '1', content: '¡El ambiente de Dar Papaya es increíble! Muy recomendado. 💜', rating: 5, user: { fullName: 'Laura A.', email: 'laura@test.com' } } as any,
      { id: '2', content: 'La Fogata nunca falla. La mejor atención en Armenia. 🥩✨', rating: 5, user: { fullName: 'Juan P.', email: 'juan@test.com' } } as any
    ]);
  }

  private loadEvents(): void {
    this.eventsService.listAgenda({ pageSize: 100 }).subscribe({
      next: (response) => {
        this.events.set(response.items);
      },
      error: (err) => console.error('Error loading events for map', err)
    });
  }
}
