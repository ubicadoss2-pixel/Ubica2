import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { AuthStoreService } from './auth-store.service';
import { inject } from '@angular/core';
import { of } from 'rxjs';

export interface Plan {
  id: string;
  name: string;
  price: number;
  limitPlaces: number;
  limitEvents: number;
  durationDays: number;
  isActive: boolean;
}

export interface UserPlan {
  id: string;
  planId: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  plan: Plan;
}

@Injectable({ providedIn: 'root' })
export class PlansService extends ApiService {
  private readonly auth = inject(AuthStoreService);

  getPlans() {
    return this.http.get<Plan[]>(`${this.baseUrl}/plans`);
  }

  getMyPlan() {
    // Retornamos un plan mockeado porque el backend ya no maneja planes
    return of({
      id: 'mock-plan',
      planId: 'premium',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 31536000000).toISOString(),
      isActive: true,
      plan: {
        id: 'premium',
        name: 'Premium',
        price: 0,
        limitPlaces: 999,
        limitEvents: 999,
        durationDays: 365,
        isActive: true
      }
    });
  }

  subscribe(planId: string) {
    return this.http.post<UserPlan>(`${this.baseUrl}/plans/subscribe`, { planId });
  }

  createCheckout(planId: string) {
    return this.http.post<{ url: string }>(`${this.baseUrl}/plans/checkout`, { planId });
  }
}
