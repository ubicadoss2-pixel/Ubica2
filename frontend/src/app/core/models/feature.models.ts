export interface Preference {
  id?: string;
  key: string;
  value: string;
}

export interface PlanFavorite {
  id: string;
  userId: string;
  planId: string;
  plan: Plan;
  createdAt: string;
}

export interface Plan {
  id: string;
  name: string;
  limitPlaces: number;
  limitEvents: number;
  price: number;
  durationDays: number;
  isActive: boolean;
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  cityId?: string;
  placeTypeId?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  resultsCount?: number;
  createdAt: string;
}

export interface Offer {
  id: string;
  placeId: string;
  title: string;
  description?: string;
  conditions?: string;
  imageUrl?: string;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'INACTIVE';
  place?: any;
  createdAt?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: any;
  createdAt: string;
}

export interface ChatConversation {
  id: string;
  userId: string;
  messages?: ChatMessage[];
  updatedAt: string;
  createdAt: string;
}

export interface UserBlock {
  id: string;
  blockerId: string;
  blockedId: string;
  reason?: string;
  createdAt: string;
  blocked?: {
    id: string;
    email: string;
    fullName?: string;
    avatarUrl?: string;
  };
}
