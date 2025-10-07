import { GeoPoint } from '@react-native-firebase/firestore';

export interface PriceAlert {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  targetPrice: number;
  radius: number;
  location: GeoPoint;
  isActive: boolean;
  createdAt: string;
  lastTriggered?: string;
}