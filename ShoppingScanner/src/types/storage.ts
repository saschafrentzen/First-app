export interface ShoppingItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  barcode?: string;
  category?: string;
  addedAt: string;
  lastModified: string;
}

export interface ShoppingList {
  id: string;
  name: string;
  items: ShoppingItem[];
  totalBudget?: number;
  createdAt: string;
  lastModified: string;
}

export interface OfflineChange {
  id: string;
  type: 'create' | 'update' | 'delete';
  entityType: 'list' | 'item';
  data: ShoppingList | ShoppingItem;
  timestamp: string;
  synced: boolean;
}

export interface CategoryBudget {
  id: string;
  category: string;
  budget: number;
  period: 'daily' | 'weekly' | 'monthly';
  startDate: string;
  endDate?: string;
  currentSpent: number;
  lastUpdated: string;
}

export interface StorageKeys {
  SHOPPING_LISTS: 'shopping_lists';
  OFFLINE_CHANGES: 'offline_changes';
  LAST_SYNC: 'last_sync';
}

export interface SyncResult {
  success: boolean;
  error?: string;
  syncedChanges: number;
  timestamp: string;
}