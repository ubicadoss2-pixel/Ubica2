import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-notification-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notification-container">
      @for (n of service.notifications(); track n.id) {
        <div class="notification-card" 
             [class]="n.type" 
             [class.clickable]="!!n.link"
             (click)="handleClick(n)">
          <div class="notif-icon">{{ n.icon || getDefaultIcon(n.type) }}</div>
          <div class="notif-content">
            <div class="notif-title">{{ n.title }}</div>
            <div class="notif-message">{{ n.message }}</div>
          </div>
          <button class="close-btn" (click)="stopProp($event); service.remove(n.id)">&times;</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .notification-container {
      position: fixed;
      top: 1.5rem;
      right: 1.5rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      pointer-events: none;
    }

    .notification-card {
      pointer-events: auto;
      width: 340px;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-radius: 20px;
      padding: 1.25rem;
      display: flex;
      gap: 1.25rem;
      align-items: center;
      box-shadow: 0 15px 40px rgba(0,0,0,0.4), 0 0 20px rgba(191, 0, 255, 0.1);
      border: 1px solid rgba(191, 0, 255, 0.2);
      cursor: pointer;
      animation: slideIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      position: relative;
      overflow: hidden;

      &:hover {
        transform: translateX(-8px) scale(1.02);
        background: rgba(15, 23, 42, 0.95);
        border-color: var(--neon-purple);
        box-shadow: 0 20px 50px rgba(0,0,0,0.5), 0 0 30px rgba(191, 0, 255, 0.3);
      }

      &::before {
        content: '';
        position: absolute;
        left: 0; top: 0; bottom: 0;
        width: 5px;
        background: linear-gradient(to bottom, var(--neon-purple), var(--neon-pink));
        box-shadow: 0 0 15px var(--neon-purple);
      }

      &.success::before { background: #10b981; box-shadow: 0 0 10px #10b981; }
      &.error::before { background: #ef4444; box-shadow: 0 0 10px #ef4444; }
      &.info::before { background: var(--neon-blue, #00d2ff); box-shadow: 0 0 10px var(--neon-blue, #00d2ff); }
      &.promo {
        border-color: var(--neon-purple);
        background: linear-gradient(135deg, rgba(191, 0, 255, 0.2), rgba(15, 23, 42, 1));
        box-shadow: 0 0 25px rgba(191, 0, 255, 0.2);
        
        .notif-title { 
          color: #fff;
          text-shadow: 0 0 10px rgba(191, 0, 255, 0.8);
          font-weight: 900;
          text-transform: uppercase;
        }

        .notif-message {
          color: #fff;
          font-weight: 500;
        }
      }
    }

    .notif-icon {
      font-size: 1.8rem;
      flex-shrink: 0;
      filter: grayscale(100%) brightness(500%);
      text-shadow: 0 0 15px white;
    }

    .notif-content {
      flex: 1;
    }

    .notif-title {
      font-weight: 800;
      color: #fff !important;
      font-size: 1.1rem;
      margin-bottom: 0.2rem;
      text-shadow: 0 0 10px rgba(255,255,255,0.8);
      text-transform: uppercase;
    }

    .notif-message {
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.85rem;
      line-height: 1.4;
    }

    .close-btn {
      background: none;
      border: none;
      color: rgba(255, 255, 255, 0.4);
      font-size: 1.25rem;
      cursor: pointer;
      padding: 0;
    }

    .clickable {
      cursor: pointer;
      &:active { transform: scale(0.98); }
    }

    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `]
})
export class NotificationComponent {
  readonly service = inject(NotificationService);
  private readonly router = inject(Router);

  handleClick(n: any) {
    if (n.link) {
      this.router.navigateByUrl(n.link);
    }
    this.service.remove(n.id);
  }

  stopProp(e: Event) {
    e.stopPropagation();
  }

  getDefaultIcon(type: string): string {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'promo': return '🔥';
      default: return 'ℹ️';
    }
  }
}
