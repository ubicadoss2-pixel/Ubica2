import { Injectable, signal } from '@angular/core';

export interface AppNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'promo';
  title: string;
  message: string;
  icon?: string;
  duration?: number;
  link?: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly notifications = signal<AppNotification[]>([]);

  show(notif: Omit<AppNotification, 'id'>) {
    const id = Math.random().toString(36).substring(2, 9);
    const newNotif = { ...notif, id };
    
    this.notifications.update(list => [...list, newNotif]);

    if (notif.duration !== 0) {
      setTimeout(() => this.remove(id), notif.duration || 5000);
    }
    
    return id;
  }

  remove(id: string) {
    this.notifications.update(list => list.filter(n => n.id !== id));
  }

  success(title: string, message: string, duration = 5000) {
    return this.show({ type: 'success', title, message, duration });
  }

  error(title: string, message: string, duration = 6000) {
    // Silenciado por preferencia del usuario, los errores se muestran localmente.
    // return this.show({ type: 'error', title, message, duration });
    return '';
  }

  info(title: string, message: string, duration = 4000) {
    return this.show({ type: 'info', title, message, duration });
  }

  warning(title: string, message: string, duration = 5000) {
    return this.show({ type: 'warning', title, message, duration });
  }
}
