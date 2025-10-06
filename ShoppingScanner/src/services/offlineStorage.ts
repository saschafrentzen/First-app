import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { ShoppingList, ShoppingItem } from '../types/storage';

const LISTS_STORAGE_KEY = '@shopping_lists';
const PENDING_CHANGES_KEY = '@pending_changes';

interface PendingChange {
  type: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
}

export class OfflineStorage {
  // Speichern einer Einkaufsliste lokal
  static async saveList(list: ShoppingList): Promise<void> {
    try {
      const lists = await this.getLists();
      const existingIndex = lists.findIndex(l => l.id === list.id);
      
      if (existingIndex >= 0) {
        lists[existingIndex] = list;
      } else {
        lists.push(list);
      }

      await AsyncStorage.setItem(LISTS_STORAGE_KEY, JSON.stringify(lists));

      // Änderung für Synchronisation vormerken
      await this.addPendingChange({
        type: existingIndex >= 0 ? 'update' : 'create',
        data: list,
        timestamp: Date.now()
      });

      // Versuche zu synchronisieren, falls online
      await this.syncWithServer();
    } catch (error) {
      console.error('Fehler beim lokalen Speichern:', error);
      throw error;
    }
  }

  // Alle lokalen Listen abrufen
  static async getLists(): Promise<ShoppingList[]> {
    try {
      const listsJson = await AsyncStorage.getItem(LISTS_STORAGE_KEY);
      return listsJson ? JSON.parse(listsJson) : [];
    } catch (error) {
      console.error('Fehler beim Abrufen der lokalen Listen:', error);
      return [];
    }
  }

  // Eine Liste lokal löschen
  static async deleteList(listId: string): Promise<void> {
    try {
      const lists = await this.getLists();
      const filteredLists = lists.filter(list => list.id !== listId);
      await AsyncStorage.setItem(LISTS_STORAGE_KEY, JSON.stringify(filteredLists));

      // Änderung für Synchronisation vormerken
      await this.addPendingChange({
        type: 'delete',
        data: { id: listId },
        timestamp: Date.now()
      });

      // Versuche zu synchronisieren, falls online
      await this.syncWithServer();
    } catch (error) {
      console.error('Fehler beim lokalen Löschen:', error);
      throw error;
    }
  }

  // Pending Changes verwalten
  private static async addPendingChange(change: PendingChange): Promise<void> {
    try {
      const changes = await this.getPendingChanges();
      changes.push(change);
      await AsyncStorage.setItem(PENDING_CHANGES_KEY, JSON.stringify(changes));
    } catch (error) {
      console.error('Fehler beim Speichern der ausstehenden Änderungen:', error);
    }
  }

  private static async getPendingChanges(): Promise<PendingChange[]> {
    try {
      const changesJson = await AsyncStorage.getItem(PENDING_CHANGES_KEY);
      return changesJson ? JSON.parse(changesJson) : [];
    } catch (error) {
      console.error('Fehler beim Abrufen der ausstehenden Änderungen:', error);
      return [];
    }
  }

  private static async clearPendingChanges(): Promise<void> {
    await AsyncStorage.setItem(PENDING_CHANGES_KEY, JSON.stringify([]));
  }

  // Mit Server synchronisieren
  static async syncWithServer(): Promise<void> {
    try {
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        return; // Keine Internetverbindung
      }

      const changes = await this.getPendingChanges();
      if (changes.length === 0) {
        return; // Keine ausstehenden Änderungen
      }

      // Änderungen nach Typ sortieren und an den Server senden
      for (const change of changes) {
        switch (change.type) {
          case 'create':
            // TODO: Server-API-Aufruf für Create
            break;
          case 'update':
            // TODO: Server-API-Aufruf für Update
            break;
          case 'delete':
            // TODO: Server-API-Aufruf für Delete
            break;
        }
      }

      // Nach erfolgreicher Synchronisation Pending Changes löschen
      await this.clearPendingChanges();
    } catch (error) {
      console.error('Fehler bei der Synchronisation:', error);
      throw error;
    }
  }

  // Netzwerkstatus überwachen und bei Verbindung synchronisieren
  static startNetworkMonitoring(): void {
    NetInfo.addEventListener(state => {
      if (state.isConnected) {
        this.syncWithServer().catch(console.error);
      }
    });
  }
}