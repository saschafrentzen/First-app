export type SmartFridgeManufacturer = 'Samsung' | 'LG' | 'Bosch' | 'Siemens' | 'Other';

export interface SmartFridgeConfig {
  id: string;
  name: string;
  manufacturer: SmartFridgeManufacturer;
  model: string;
  apiKey?: string;
  ipAddress?: string;
  lastSync: string;
  isConnected: boolean;
  features: SmartFridgeFeature[];
}

export type SmartFridgeFeature = 
  | 'inventory'
  | 'temperature'
  | 'camera'
  | 'shoppingList'
  | 'expiration';

export interface FridgeInventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: FridgeItemCategory;
  location: FridgeCompartment;
  expiryDate: string;
  addedDate: string;
  lastUpdated: string;
  minQuantity: number; // Umbenannt von minimumQuantity und als Pflichtfeld
  barcode?: string;
  imageUrl?: string;
  temperature?: number; // Für temperaturempfindliche Artikel
  nutritionInfo?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
}

export type FridgeItemCategory =
  | 'dairy'
  | 'meat'
  | 'vegetables'
  | 'fruits'
  | 'beverages'
  | 'condiments'
  | 'leftovers'
  | 'other';

export interface SmartFridgeStats {
  fridgeId: string;
  totalItems: number;
  expiringItems: number;
  doorOpenCount: number;
  averageTemperature: number;
  powerConsumption: number;
  itemCategories: Record<FridgeItemCategory, number>;
}

export type FridgeCompartment =
  | 'mainCompartment'
  | 'freezer'
  | 'coolZone'
  | 'door'
  | 'vegetableDrawer';

export interface FridgeTemperature {
  compartment: FridgeCompartment;
  current: number;
  target: number;
  humidity?: number;
  lastUpdated: string;
}

export interface FridgeCamera {
  id: string;
  location: FridgeCompartment;
  lastImage?: string;
  lastUpdated: string;
  resolution: {
    width: number;
    height: number;
  };
}

export interface FridgeShoppingListItem {
  productId: string;
  name: string;
  quantity: number;
  unit: string;
  urgency: 'low' | 'medium' | 'high';
  addedDate: string;
  reason: 'lowStock' | 'expired' | 'manual';
}

export interface SmartFridgeEvent {
  eventId: string;
  fridgeId: string;
  type: SmartFridgeEventType;
  timestamp: string;
  details: any;
  isHandled: boolean;
}

export type SmartFridgeEventType =
  | 'itemAdded'
  | 'itemRemoved'
  | 'itemExpired'
  | 'temperatureAlert'
  | 'doorOpen'
  | 'connectionLost'
  | 'maintenance';

// Removed duplicate SmartFridgeStats declaration