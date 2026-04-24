import { CommonModule } from '@angular/common';
import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProfileService, UserProfile } from '../../core/services/profile.service';
import { AuthStoreService } from '../../core/services/auth-store.service';
import { PlacesService } from '../../core/services/places.service';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly profileService = inject(ProfileService);
  readonly authStore = inject(AuthStoreService);
  private readonly placesService = inject(PlacesService);

  readonly profile = signal<UserProfile | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  readonly isDragOver = signal(false);

  readonly isOwner = computed(() => {
    const fromAuth = this.authStore.hasRole('OWNER', 'ADMIN');
    const fromProfile = this.profile()?.userRoles?.some(ur => ur.role.code === 'OWNER' || ur.role.code === 'ADMIN');
    console.log(`[DEBUG_ROLE] Auth: ${fromAuth}, Profile: ${fromProfile}`);
    return fromAuth || fromProfile;
  });

  readonly form = this.fb.nonNullable.group({
    fullName: '',
    phone: '',
    avatarUrl: '',
  });

  ngOnInit() {
    this.loadProfile();
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
          phone: data.phone ?? '',
          avatarUrl: data.avatarUrl ?? ''
        });
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el perfil.');
        this.loading.set(false);
      }
    });
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver.set(false);
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
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
      const base64Url = e.target?.result as string;
      this.form.patchValue({ avatarUrl: base64Url });
      
      const current = this.profile();
      if (current) {
        this.profile.set({ ...current, avatarUrl: base64Url });
      }
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
