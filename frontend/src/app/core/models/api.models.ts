import { Plan, Offer, ChatConversation } from './feature.models';

export type UserRole = 'USER' | 'OWNER' | 'ADMIN';

export interface JwtUser {
  id: string;
  email?: string;
  role: UserRole;
}

export interface CatalogItem {
  id: string;
  code?: string;
  name: string;
}

export interface City {
  id: string;
  countryCode: string;
  name: string;
  stateRegion?: string | null;
  timezone: string;
}

export interface PlaceOwner {
  id: string;
  fullName?: string;
  email: string;
}

export interface Place {
  id: string;
  cityId: string;
  placeTypeId: string;
  name: string;
  slug: string;
  description?: string | null;
  addressLine?: string | null;
  neighborhood?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  priceLevel?: number | null;
  status: 'DRAFT' | 'PUBLISHED' | 'SUSPENDED';
  city?: City;
  placeType?: CatalogItem;
  openingHours?: OpeningHour[];
  contacts?: PlaceContact[];
  socialLinks?: PlaceSocialLink[];
  photos?: PlacePhoto[];
  ownerUser?: PlaceOwner;
  isSponsored?: boolean;
  sponsoredUntil?: string | null;
  offers?: Offer[];
  averageRating?: number | null;
  totalRatings?: number;
}

export interface OpeningHour {
  id?: string;
  weekday: number;
  openTime?: string | null;
  closeTime?: string | null;
  isClosed?: boolean;
}

export interface PlaceContact {
  id?: string;
  contactType: 'WHATSAPP' | 'PHONE' | 'EMAIL' | 'WEBSITE';
  label?: string;
  value: string;
  isPrimary?: boolean;
}

export interface PlaceSocialLink {
  id?: string;
  platform: 'INSTAGRAM' | 'FACEBOOK' | 'TIKTOK' | 'X' | 'YOUTUBE' | 'OTHER';
  url: string;
}

export interface PlacePhoto {
  id: string;
  url: string;
  altText?: string;
  sortOrder: number;
}

export interface EventPhoto {
  id: string;
  url: string;
  altText?: string;
  sortOrder: number;
}

export interface EventItem {
  id: string;
  placeId: string;
  categoryId?: string | null;
  title: string;
  description?: string | null;
  dressCode?: string | null;
  minAge?: number | null;
  currency: string;
  priceFrom?: number | null;
  priceTo?: number | null;
  startTime: string;
  endTime?: string | null;
  status: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'CANCELLED' | 'SUSPENDED';
  addressLine?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  recurrence?: { weekday: number } | null;
  specialDates?: EventSpecialDate[];
  place?: Place;
  category?: CatalogItem;
  photos?: EventPhoto[];
  isSponsored?: boolean;
  sponsoredUntil?: string | null;
  eventDate?: string | null;
}

export interface EventSpecialDate {
  id?: string;
  eventDate: string;
  dateType: 'OCCURRENCE' | 'EXCEPTION';
  note?: string;
}

export interface Favorite {
  userId: string;
  placeId: string;
  place: Place;
  createdAt: string;
  isVisited?: boolean;
}

export interface ApiPage<T> {
  page: number;
  pageSize: number;
  total: number;
  items: T[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterResponse extends AuthTokens {
  user: {
    id: string;
    email: string;
    fullName?: string;
    role: UserRole;
  };
}

export interface Report {
  id: string;
  targetType: 'PLACE' | 'EVENT';
  placeId?: string | null;
  eventId?: string | null;
  reason: 'WRONG_INFO' | 'SPAM' | 'INAPPROPRIATE' | 'CLOSED' | 'OTHER';
  details?: string | null;
  status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'REJECTED';
  createdAt: string;
}

export interface AuditLog {
  id: string;
  entityId: string;
  entityType: string;
  action: string;
  createdAt: string;
}

export interface AnalyticsSummary {
  placeViews?: number;
  eventViews?: number;
  contactClicks?: number;
  favoriteAdds?: number;
  reportCreates?: number;
  totalUsers?: number;
  totalPlaces?: number;
  activePlaces?: number;
  totalEvents?: number;
  activeEvents?: number;
  finishedEvents?: number;
  usersByType?: { role: string; total: number }[];
  rawEvents?: any[];
}

export interface Comment {
  id: string;
  userId: string;
  placeId?: string | null;
  eventId?: string | null;
  content: string;
  rating?: number | null;
  status: 'VISIBLE' | 'HIDDEN';
  createdAt: string;
  likes?: number;
  likedByMe?: boolean;
  user?: {
    id: string;
    fullName?: string;
    email: string;
  };
}

export interface CommentStats {
  page: number;
  pageSize: number;
  total: number;
  items: Comment[];
  averageRating: number | null;
  totalRatings: number;
}
