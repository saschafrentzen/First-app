import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { ApiService } from './api';
import { StorageError, NetworkError, ValidationError } from './errors';
import { 
  ShoppingList, 
  ShoppingItem, 
  OfflineChange,
  StorageKeys,
  SyncResult,
  StorageMetadata
} from '../types/storage';

// Cache-TTL in Millisekunden (5 Minuten)
const CACHE_TTL = 5 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface ConflictResolutionStrategy {
  preferLocal: boolean;
  mergeFunction?: (local: ShoppingList, remote: ShoppingList) => ShoppingList;
}

const STORAGE_KEYS: StorageKeys = {
  SHOPPING_LISTS: 'shopping_lists',
  OFFLINE_CHANGES: 'offline_changes',
  LAST_SYNC: 'last_sync'
};

export class OfflineStorageService {
  private static instance: OfflineStorageService;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private conflictStrategy: ConflictResolutionStrategy = {
    preferLocal: true,
    mergeFunction: (local, remote) => ({
      ...remote,
      items: [...local.items, ...remote.items.filter(item => 
        !local.items.some(localItem => localItem.id === item.id)
      )]
    })
  };

  private constructor() {
    // Initialisiere Metadaten beim ersten Start
    this.initializeMetadata();
  }

  private async initializeMetadata(): Promise<void> {
    try {
      const metadata = await AsyncStorage.getItem('storage_metadata');
      if (!metadata) {
        const initialMetadata: StorageMetadata = {
          version: 1,
          lastSync: new Date(0).toISOString(),
          dataVersion: 1
        };
        await AsyncStorage.setItem('storage_metadata', JSON.stringify(initialMetadata));
      }
    } catch (error) {
      console.error('Fehler bei der Initialisierung der Metadaten:', error);
    }
  }

  static getInstance(): OfflineStorageService {
    if (!OfflineStorageService.instance) {
      OfflineStorageService.instance = new OfflineStorageService();
    }
    return OfflineStorageService.instance;
  }

  async saveShoppingList(list: ShoppingList): Promise<void> {
    try {
      const lists = await this.getShoppingLists();
      const existingIndex = lists.findIndex(l => l.id === list.id);
      
      if (existingIndex >= 0) {
        lists[existingIndex] = list;
      } else {
        lists.push(list);
      }

      await AsyncStorage.setItem(STORAGE_KEYS.SHOPPING_LISTS, JSON.stringify(lists));
      await this.trackChange({
        id: list.id,
        type: existingIndex >= 0 ? 'update' : 'create',
        entityType: 'list',
        data: list,
        timestamp: new Date().toISOString(),
        synced: false
      });
    } catch (error) {
      console.error('Fehler beim Speichern der Einkaufsliste:', error);
      throw error;
    }
  }

  async getShoppingLists(): Promise<ShoppingList[]> {
    try {
      const listsJson = await AsyncStorage.getItem(STORAGE_KEYS.SHOPPING_LISTS);
      return listsJson ? JSON.parse(listsJson) : [];
    } catch (error) {
      console.error('Fehler beim Laden der Einkaufslisten:', error);
      return [];
    }
  }

  async deleteShoppingList(listId: string): Promise<void> {
    try {
      const lists = await this.getShoppingLists();
      const filteredLists = lists.filter(list => list.id !== listId);
      await AsyncStorage.setItem(STORAGE_KEYS.SHOPPING_LISTS, JSON.stringify(filteredLists));
      
      await this.trackChange({
        id: listId,
        type: 'delete',
        entityType: 'list',
        data: lists.find(l => l.id === listId)!,
        timestamp: new Date().toISOString(),
        synced: false
      });
    } catch (error) {
      console.error('Fehler beim Löschen der Einkaufsliste:', error);
      throw error;
    }
  }

  async addItemToList(listId: string, item: ShoppingItem): Promise<void> {
    try {
      const lists = await this.getShoppingLists();
      const listIndex = lists.findIndex(l => l.id === listId);
      
      if (listIndex >= 0) {
        const list = lists[listIndex];
        const existingItemIndex = list.items.findIndex((i: ShoppingItem) => i.id === item.id);
        
        if (existingItemIndex >= 0) {
          list.items[existingItemIndex] = item;
        } else {
          list.items.push(item);
        }
        
        list.lastModified = new Date().toISOString();
        lists[listIndex] = list;
        
        await AsyncStorage.setItem(STORAGE_KEYS.SHOPPING_LISTS, JSON.stringify(lists));
        await this.trackChange({
          id: item.id,
          type: existingItemIndex >= 0 ? 'update' : 'create',
          entityType: 'item',
          data: item,
          timestamp: new Date().toISOString(),
          synced: false
        });
      }
    } catch (error) {
      console.error('Fehler beim Hinzufügen des Items:', error);
      throw error;
    }
  }

  private async trackChange(change: OfflineChange): Promise<void> {
    try {
      const changes = await this.getOfflineChanges();
      changes.push(change);
      await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_CHANGES, JSON.stringify(changes));
    } catch (error) {
      console.error('Fehler beim Tracking der Änderung:', error);
      throw error;
    }
  }

  private async getOfflineChanges(): Promise<OfflineChange[]> {
    try {
      const changesJson = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_CHANGES);
      return changesJson ? JSON.parse(changesJson) : [];
    } catch (error) {
      console.error('Fehler beim Laden der Offline-Änderungen:', error);
      return [];
    }
  }

  async isOnline(): Promise<boolean> {
    const netInfo = await NetInfo.fetch();
    return netInfo.isConnected ?? false;
  }

  async syncWithServer(): Promise<SyncResult> {
    try {
      if (!await this.isOnline()) {
        return {
          success: false,
          error: 'Keine Internetverbindung verfügbar',
          syncedChanges: 0,
          timestamp: new Date().toISOString()
        };
      }

      const api = ApiService.getInstance();
      const changes = await this.getOfflineChanges();
      const unsyncedChanges = changes.filter(change => !change.synced);
      
      if (unsyncedChanges.length === 0) {
        return {
          success: true,
          syncedChanges: 0,
          timestamp: new Date().toISOString()
        };
      }

      // Sende lokale Änderungen an den Server
      const syncResponse = await api.syncChanges(unsyncedChanges);
      if (!syncResponse.success) {
        return {
          success: false,
          error: syncResponse.error,
          syncedChanges: 0,
          timestamp: new Date().toISOString()
        };
      }

      // Hole Server-Änderungen seit der letzten Synchronisation
      const lastSync = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC) || new Date(0).toISOString();
      const serverChangesResponse = await api.getServerChanges(lastSync);
      
      if (!serverChangesResponse.success) {
        return {
          success: false,
          error: serverChangesResponse.error,
          syncedChanges: 0,
          timestamp: new Date().toISOString()
        };
      }

      // Aktualisiere lokalen Zustand mit Server-Änderungen
      if (serverChangesResponse.data) {
        for (const change of serverChangesResponse.data) {
          if (change.entityType === 'list') {
            const list = change.data as ShoppingList;
            if (change.type === 'delete') {
              await this.deleteShoppingList(list.id);
            } else {
              await this.saveShoppingList(list);
            }
          } else if (change.entityType === 'item') {
            const item = change.data as ShoppingItem;
            // Finde die zugehörige Liste und aktualisiere das Item
            const lists = await this.getShoppingLists();
            for (const list of lists) {
              if (list.items.some((i: ShoppingItem) => i.id === item.id)) {
                await this.addItemToList(list.id, item);
                break;
              }
            }
          }
        }
      }

      // Markiere lokale Änderungen als synchronisiert
      const allChanges = [
        ...changes.map(change => ({ ...change, synced: true })),
        ...(serverChangesResponse.data || [])
      ];
      await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_CHANGES, JSON.stringify(allChanges));
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());

      return {
        success: true,
        syncedChanges: unsyncedChanges.length + (serverChangesResponse.data?.length || 0),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Fehler bei der Synchronisation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unbekannter Fehler',
        syncedChanges: 0,
        timestamp: new Date().toISOString()
      };
    }
  }

  async clearStorage(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.SHOPPING_LISTS,
        STORAGE_KEYS.OFFLINE_CHANGES,
        STORAGE_KEYS.LAST_SYNC
      ]);
    } catch (error) {
      console.error('Fehler beim Löschen des Speichers:', error);
      throw error;
    }
  }
}