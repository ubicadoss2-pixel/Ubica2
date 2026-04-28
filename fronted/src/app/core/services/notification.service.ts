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
}
