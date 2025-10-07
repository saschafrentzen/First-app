import { GeoPoint } from '@react-native-firebase/firestore';
import { UserProfile } from '@app/types/user';

export interface PriceReport {
  reportId: string;
  productId: string;
  storeId: string;
  price: number;
  currency: string;
  reportedBy: string; // User ID
  reportedAt: string;
  location: GeoPoint;
  imageUrl?: string;
  quantity: number;
  unit: string;
  validUntil: string; // Gültig bis (z.B. bei Sonderangeboten)
  isSpecialOffer: boolean;
  trustScore: number; // 0-100
  verifiedByUsers: string[]; // User IDs
  disputedByUsers: string[]; // User IDs
  status: 'pending' | 'verified' | 'disputed' | 'expired';
}

export interface PriceHistory {
  productId: string;
  storeId: string;
  prices: PriceDataPoint[];
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
  lastUpdate: string;
  reliability: number; // 0-100
}

export interface PriceDataPoint {
  price: number;
  date: string;
  reportId: string;
  isVerified: boolean;
  isSpecialOffer: boolean;
}

export interface Store {
  id: string;
  name: string;
  chain?: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  location: GeoPoint;
  openingHours?: OpeningHours;
  priceLevel: 1 | 2 | 3 | 4 | 5; // 1 = sehr günstig, 5 = sehr teuer
  reliability: number; // 0-100, basierend auf verifizierten Preismeldungen
  lastUpdate: string;
}

export interface OpeningHours {
  monday: TimeRange[];
  tuesday: TimeRange[];
  wednesday: TimeRange[];
  thursday: TimeRange[];
  friday: TimeRange[];
  saturday: TimeRange[];
  sunday: TimeRange[];
}

export interface TimeRange {
  from: string; // "HH:MM" Format
  to: string; // "HH:MM" Format
}

export interface PriceDispute {
  disputeId: string;
  reportId: string;
  reportedBy: string; // User ID
  reportedAt: string;
  reason: DisputeReason;
  comment?: string;
  imageUrl?: string;
  status: 'open' | 'resolved' | 'rejected';
  resolvedBy?: string; // Admin/Moderator ID
  resolvedAt?: string;
}

export type DisputeReason =
  | 'wrong_price'
  | 'price_expired'
  | 'wrong_product'
  | 'wrong_store'
  | 'fake_report'
  | 'other';

export type SortOption = 'price_asc' | 'price_desc' | 'distance' | 'trust';

export interface FilterOptions {
  maxPrice: string;
  minPrice: string;
  radius: string;
  onlyVerified: boolean;
  includeSpecialOffers: boolean;
  minTrustScore: string;
}

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string;
}

export interface CommunityTrust {
  userId: string;
  trustScore: number; // 0-100
  verifiedReports: number;
  disputedReports: number;
  totalReports: number;
  memberSince: string;
  badges: Badge[];
  lastActivity: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  earnedAt: string;
  level: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export interface PriceAlert {
  alertId: string;
  userId: string;
  productId: string;
  productName: string;
  storeIds?: string[];
  maxPrice: number;
  minPrice?: number;
  radius?: number;
  location?: GeoPoint;
  isActive: boolean;
  createdAt: string;
  lastNotification?: string;
  notificationFrequency: 'immediately' | 'daily' | 'weekly';
  lastPriceFound?: number;
  lastPriceFoundAt?: string;
  lastPriceFoundStoreId?: string;
  notificationId?: string;
  nextCheck?: string;
}

export interface PriceTrend {
  productId: string;
  period: '24h' | '7d' | '30d' | '90d';
  trend: 'rising' | 'falling' | 'stable';
  changePercent: number;
  confidenceScore: number; // 0-100
  lastUpdate: string;
}

export interface CommunityTrust {
  userId: string;
  trustScore: number; // 0-100
  verifiedReports: number;
  disputedReports: number;
  totalReports: number;
  memberSince: string;
  badges: Badge[];
  lastActivity: string;
}