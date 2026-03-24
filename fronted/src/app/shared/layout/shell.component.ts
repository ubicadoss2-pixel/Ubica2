import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthStoreService } from '../../core/services/auth-store.service';
import { ChatbotWidgetComponent } from '../components/chatbot-widget/chatbot-widget.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, ChatbotWidgetComponent],
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
