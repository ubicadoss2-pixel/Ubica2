import { CommonModule } from '@angular/common';
import { Component, inject, signal, OnInit, computed, effect, ElementRef, ViewChild, HostListener } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProfileService, UserProfile } from '../../core/services/profile.service';
import { AuthStoreService } from '../../core/services/auth-store.service';
import { PlacesService } from '../../core/services/places.service';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { CommentsService } from '../../core/services/comments.service';
import { PlaceCardComponent } from '../../shared/components/place-card/place-card.component';

const USER_ACHIEVEMENTS = [
  { id: 1, title: 'Explorador Nocturno', description: 'Visita 5 bares o discotecas.', icon: '🌙', progress: 0, unlocked: false },
  { id: 2, title: 'Gourmet de Neón', description: 'Deja 3 reseñas en restaurantes.', icon: '🍣', progress: 0, unlocked: false },
  { id: 3, title: 'Local Hero', description: 'Añade 10 lugares a tus favoritos.', icon: '🛡️', progress: 0, unlocked: false },
  { id: 4, title: 'Cazador de Ofertas', description: 'Usa tu primera promoción flash.', icon: '⚡', progress: 0, unlocked: false },
  { id: 5, title: 'Viajero Urbano', description: 'Explora 3 ciudades distintas.', icon: '🗺️', progress: 0, unlocked: false },
  { id: 6, title: 'Comentarista Pro', description: 'Escribe 5 comentarios en lugares.', icon: '💬', progress: 0, unlocked: false },
];

const OWNER_ACHIEVEMENTS = [
  { id: 1, title: 'Primer Local', description: 'Registra tu primer lugar en Ubica2.', icon: '🏪', progress: 0, unlocked: false },
  { id: 2, title: 'Anfitrión Activo', description: 'Crea 3 eventos en tu local.', icon: '🎉', progress: 0, unlocked: false },
  { id: 3, title: 'Vitrina de Neón', description: 'Añade 5 fotos a uno de tus lugares.', icon: '📸', progress: 0, unlocked: false },
  { id: 4, title: 'Destacado', description: 'Promueve un lugar o evento.', icon: '⭐', progress: 0, unlocked: false },
  { id: 5, title: 'Red de Contactos', description: 'Agrega info de contacto a todos tus lugares.', icon: '📞', progress: 0, unlocked: false },
  { id: 6, title: 'Empresario Urbano', description: 'Ten 3 lugares activos al mismo tiempo.', icon: '🏆', progress: 0, unlocked: false },
];

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslatePipe, PlaceCardComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly profileService = inject(ProfileService);
  readonly authStore = inject(AuthStoreService);
  private readonly placesService = inject(PlacesService);
  private readonly commentsService = inject(CommentsService);

  readonly profile = signal<UserProfile | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);

  readonly sponsoredPlaces = signal<any[]>([]);
  readonly userComments = signal<any[]>([]);

  readonly achievements = computed(() => {
    const role = this.authStore.user()?.role;
    const p = this.profile();
    if (!p) return [];

    if (role === 'OWNER') {
      const places = p.places || [];
      const placesCount = places.length;
      const eventsCount = places.reduce((sum, pl) => sum + (pl.events?.length || 0), 0);
      const progress1 = Math.min((placesCount / 1) * 100, 100);
      const progress2 = Math.min((eventsCount / 3) * 100, 100);
      const progress3 = Math.min((placesCount > 0 ? 100 : 0), 100);
      const promotedCount = this.sponsoredPlaces()?.length || 0;
      const progress4 = Math.min((promotedCount / 1) * 100, 100);
      const hasContact = places.some(pl => (pl as any).phone || (pl as any).email) ? 100 : 0;
      const progress6 = Math.min((placesCount / 3) * 100, 100);

      return [
        { id: 1, title: 'Primer Local', description: 'Registra tu primer lugar en Ubica2.', icon: '🏪', progress: progress1, unlocked: progress1 >= 100 },
        { id: 2, title: 'Anfitrión Activo', description: 'Crea 3 eventos en tu local.', icon: '🎉', progress: progress2, unlocked: progress2 >= 100 },
        { id: 3, title: 'Vitrina de Neón', description: 'Añade fotos a uno de tus lugares.', icon: '📸', progress: progress3, unlocked: progress3 >= 100 },
        { id: 4, title: 'Destacado', description: 'Promueve un lugar o evento.', icon: '⭐', progress: progress4, unlocked: progress4 >= 100 },
        { id: 5, title: 'Red de Contactos', description: 'Agrega info de contacto a tus lugares.', icon: '📞', progress: hasContact, unlocked: hasContact >= 100 },
        { id: 6, title: 'Empresario Urbano', description: 'Ten 3 lugares activos al mismo tiempo.', icon: '🏆', progress: progress6, unlocked: progress6 >= 100 },
      ];
    } else {
      const favorites = p.favorites || [];
      const favsCount = favorites.length;
      const nocturnos = favorites.filter(f => {
        const type = (f.place?.placeType as any)?.code || '';
        return type === 'BAR' || type === 'CLUB';
      }).length;
      const progress1 = Math.min((nocturnos / 5) * 100, 100);
      const restComments = this.userComments().filter(c => (c.place?.placeType as any)?.code === 'RESTAURANT').length;
      const progress2 = Math.min((restComments / 3) * 100, 100);
      const progress3 = Math.min((favsCount / 10) * 100, 100);
      const promoUses = p.analytics?.filter(a => a.eventType === 'PROMO_REDEEM' || a.eventType === 'CONTACT_CLICK').length || 0;
      const progress4 = Math.min((promoUses / 1) * 100, 100);
      const cities = new Set(favorites.map(f => (f.place as any)?.cityId).filter(Boolean));
      const progress5 = Math.min((cities.size / 3) * 100, 100);
      const commentsCount = this.userComments().length;
      const progress6 = Math.min((commentsCount / 5) * 100, 100);

      return [
        { id: 1, title: 'Explorador Nocturno', description: 'Visita 5 bares o discotecas.', icon: '🌙', progress: progress1, unlocked: progress1 >= 100 },
        { id: 2, title: 'Gourmet de Neón', description: 'Deja 3 reseñas en restaurantes.', icon: '🍣', progress: progress2, unlocked: progress2 >= 100 },
        { id: 3, title: 'Local Hero', description: 'Añade 10 lugares a tus favoritos.', icon: '🛡️', progress: progress3, unlocked: progress3 >= 100 },
        { id: 4, title: 'Cazador de Ofertas', description: 'Usa tu primera promoción flash.', icon: '⚡', progress: progress4, unlocked: progress4 >= 100 },
        { id: 5, title: 'Viajero Urbano', description: 'Explora 3 ciudades distintas.', icon: '🗺️', progress: progress5, unlocked: progress5 >= 100 },
        { id: 6, title: 'Comentarista Pro', description: 'Escribe 5 comentarios en lugares.', icon: '💬', progress: progress6, unlocked: progress6 >= 100 },
      ];
    }
  });

  readonly isOwner = computed(() => {
    const fromAuth = this.authStore.hasRole('OWNER', 'ADMIN');
    const fromProfile = this.profile()?.userRoles?.some(ur => ur.role.code === 'OWNER' || ur.role.code === 'ADMIN');
    console.log(`[DEBUG_ROLE] Auth: ${fromAuth}, Profile: ${fromProfile}`);
    return fromAuth || fromProfile;
  });

  readonly form = this.fb.nonNullable.group({
    fullName: '',
    username: '',
    birthDate: '',
    phone: '',
    avatarUrl: '',
  });

  ngOnInit() {
    this.loadProfile();
    this.loadSponsoredPlaces();
  }

  private loadSponsoredPlaces() {
    const user = this.authStore.user();
    if (user && this.isOwner()) {
      this.placesService.list({ ownerId: user.id, isSponsored: true, pageSize: 5 }).subscribe({
        next: (res) => this.sponsoredPlaces.set(res.items),
        error: () => {}
      });
    }
  }

  hasRole(role: string): boolean {
    return this.profile()?.userRoles?.some(ur => ur.role.code === role) ?? false;
  }

  private loadProfile() {
    this.loading.set(true);
    this.profileService.getProfile().subscribe({
      next: (data) => {
        this.profile.set(data);
        this.form.patchValue({
          fullName: data.fullName ?? '',
          username: data.username ?? '',
          birthDate: data.birthDate ? new Date(data.birthDate).toISOString().split('T')[0] : '',
          phone: data.phone ?? '',
          avatarUrl: data.avatarUrl ?? ''
        });
        
        this.commentsService.list({ userId: data.id, pageSize: 100 }).subscribe({
          next: (res) => {
            this.userComments.set(res.items);
            this.loading.set(false);
          },
          error: () => {
            this.loading.set(false);
          }
        });
      },
      error: () => {
        this.error.set('No se pudo cargar el perfil.');
        this.loading.set(false);
      }
    });
  }

  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('cameraInput') cameraInputRef!: ElementRef<HTMLInputElement>;

  triggerFileInput() {
    this.fileInputRef?.nativeElement?.click();
  }

  triggerCameraInput() {
    this.cameraInputRef?.nativeElement?.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  private handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      this.error.set('Por favor, selecciona una imagen válida.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // Convertir a JPEG comprimido para no saturar localStorage
        const base64Url = canvas.toDataURL('image/jpeg', 0.8);
        this.form.patchValue({ avatarUrl: base64Url });
        
        const current = this.profile();
        if (current) {
          this.profile.set({ ...current, avatarUrl: base64Url });
        }

        // Auto-save image so it persists immediately
        this.onSubmit();
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      this.error.set('Error al leer la imagen.');
    };
    reader.readAsDataURL(file);
  }

  onSubmit() {
    this.error.set(null);
    this.success.set(null);
    this.profileService.updateProfile(this.form.getRawValue()).subscribe({
      next: (updated) => {
        this.success.set('Perfil actualizado exitosamente.');
        const curr = this.profile();
        if (curr) {
          this.profile.set({ ...curr, ...updated });
        }
      },
      error: () => this.error.set('Error actualizando perfil.')
    });
  }

}
