import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { AuthStoreService } from './auth-store.service';
import { inject } from '@angular/core';

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
    return this.http.get<UserPlan | null>(`${this.baseUrl}/plans/my-plan`);
  }

  subscribe(planId: string) {
    return this.http.post<UserPlan>(`${this.baseUrl}/plans/subscribe`, { planId });
  }

  createCheckout(planId: string) {
    return this.http.post<{ url: string }>(`${this.baseUrl}/plans/checkout`, { planId });
  }
}
