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

export interface Promotion {
  id: string;
  placeId: string;
  title: string;
  description?: string;
  discountType: 'PERCENTAGE' | 'FIXED' | 'BOGO';
  discountValue?: number;
  code?: string;
  minPurchase?: number;
  maxUses?: number;
  currentUses: number;
  startDate: string;
  endDate: string;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'EXPIRED';
  imageUrl?: string;
  terms?: string;
  place?: any;
}

export interface PromotionRedemption {
  id: string;
  promotionId: string;
  userId: string;
  codeUsed?: string;
  discountUsed?: number;
  redeemedAt: string;
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
