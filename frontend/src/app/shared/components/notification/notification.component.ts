import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, AppNotification } from '../../../core/services/notification.service';

@Component({
  selector: 'app-notification-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notification-container">
      <div 
        *ngFor="let notif of notificationService.notifications()" 
        class="notification-toast"
        [ngClass]="'type-' + notif.type"
      >
        <div class="icon">
          <!-- Success (Check) -->
          <svg *ngIf="notif.type === 'success'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <!-- Error (Alert Circle) -->
          <svg *ngIf="notif.type === 'error'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <!-- Info (Info) -->
          <svg *ngIf="notif.type === 'info'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          <!-- Warning (Alert Triangle) -->
          <svg *ngIf="notif.type === 'warning'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </div>
        
        <div class="content">
          <strong *ngIf="notif.title">{{ notif.title }}</strong>
          <p>{{ notif.message }}</p>
        </div>

        <button class="close-btn" (click)="close(notif.id)">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .notification-container {
      position: fixed;
      top: 80px; /* Debajo de la barra de navegación */
      right: 24px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 12px;
      align-items: flex-end;
      pointer-events: none;
    }

    .notification-toast {
      pointer-events: auto;
      background: var(--surface-card, #fff);
      color: var(--ink-primary, #000);
      padding: 16px 20px;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.15);
      display: flex;
      align-items: flex-start;
      gap: 12px;
      border: 1px solid var(--border-quiet, #eee);
      min-width: 300px;
      max-width: 400px;
      animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      
      &.type-success { border-left: 4px solid #10b981; }
      &.type-error { border-left: 4px solid #ef4444; }
      &.type-warning { border-left: 4px solid #f59e0b; }
      &.type-info { border-left: 4px solid #3b82f6; }

      .icon {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        margin-top: 2px;
      }
      
      &.type-success .icon { color: #10b981; }
      &.type-error .icon { color: #ef4444; }
      &.type-warning .icon { color: #f59e0b; }
      &.type-info .icon { color: #3b82f6; }
    }

    .content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;

      strong {
        font-size: 0.95rem;
        font-weight: 600;
      }

      p {
        margin: 0;
        font-size: 0.85rem;
        color: var(--text-secondary, #666);
        line-height: 1.4;
      }
    }

    .close-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--text-secondary, #999);
      padding: 4px;
      margin: -4px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;

      &:hover {
        background: var(--surface-soft, #f5f5f5);
        color: var(--ink-primary, #333);
      }
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(100%) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateX(0) scale(1);
      }
    }

    @media (max-width: 600px) {
      .notification-container {
        top: unset;
        bottom: 24px;
        right: 5%;
        left: 5%;
        width: 90%;
        align-items: center;
        gap: 8px;
      }
      .notification-toast {
        min-width: unset;
        max-width: 100%;
        width: 100%;
        padding: 8px 12px;
        gap: 8px;
        border-radius: 8px;
      }
      .notification-toast .icon svg {
        width: 16px;
        height: 16px;
      }
      .content strong {
        font-size: 0.85rem;
      }
      .content p {
        font-size: 0.75rem;
        line-height: 1.2;
      }
      .close-btn svg {
        width: 14px;
        height: 14px;
      }
    }
  `]
})
export class NotificationComponent {
  notificationService = inject(NotificationService);

  close(id: string) {
    this.notificationService.remove(id);
  }
}
