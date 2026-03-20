import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthStoreService } from '../../core/services/auth-store.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  private readonly router = inject(Router);
  readonly authStore = inject(AuthStoreService);

  logout(): void {
    this.authStore.logout();
    this.router.navigate(['/']);
  }
}
