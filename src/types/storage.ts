export interface ShoppingItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  barcode?: string;
  category?: string;
  addedAt: string;
  lastModified: string;
  version?: number;
}

export interface ShoppingList {
  id: string;
  name: string;
  items: ShoppingItem[];
  totalBudget?: number;
  createdAt: string;
  lastModified: string;
  version?: number;
}

export interface OfflineChange {
  id: string;
  type: 'create' | 'update' | 'delete';
  entityType: 'list' | 'item';
  data: ShoppingList | ShoppingItem;
  timestamp: string;
  synced: boolean;
  version?: number;
}

export interface StorageKeys {
  SHOPPING_LISTS: string;
  OFFLINE_CHANGES: string;
  LAST_SYNC: string;
}

export interface SyncResult {
  success: boolean;
  error?: string;
  syncedChanges: number;
  timestamp: string;
  conflicts?: Array<{
    local: ShoppingList | ShoppingItem;
    remote: ShoppingList | ShoppingItem;
    resolved: boolean;
  }>;
}

export interface StorageMetadata {
  version: number;
  lastSync: string;
  dataVersion: number;
}