import { encryptionService } from './EncryptionService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface EncryptedData<T> {
  data: string; // verschlüsselte Daten
  version: number;
  updatedAt: string;
}

export function withEncryption<T>(key: string) {
  return {
    async save(data: T): Promise<void> {
      if (encryptionService.isEncryptionEnabled()) {
        const encrypted: EncryptedData<T> = {
          data: await encryptionService.encrypt(data),
          version: 1,
          updatedAt: new Date().toISOString()
        };
        await AsyncStorage.setItem(key, JSON.stringify(encrypted));
      } else {
        await AsyncStorage.setItem(key, JSON.stringify(data));
      }
    },

    async load(): Promise<T | null> {
      const stored = await AsyncStorage.getItem(key);
      if (!stored) return null;

      try {
        const parsed = JSON.parse(stored);
        if (encryptionService.isEncryptionEnabled()) {
          if ('data' in parsed && 'version' in parsed) {
            return await encryptionService.decrypt(parsed.data);
          }
          // Legacy-Daten automatisch verschlüsseln
          await this.save(parsed);
          return parsed;
        }
        return parsed;
      } catch (error) {
        console.error('Error loading data:', error);
        return null;
      }
    },

    async remove(): Promise<void> {
      await AsyncStorage.removeItem(key);
    }
  };
}

// Beispiel für die Verwendung:
/*
class ShoppingListService {
  private storage = withEncryption<ShoppingList[]>('shopping-lists');

  async saveList(list: ShoppingList): Promise<void> {
    const lists = await this.storage.load() || [];
    const index = lists.findIndex(l => l.id === list.id);
    
    if (index >= 0) {
      lists[index] = list;
    } else {
      lists.push(list);
    }
    
    await this.storage.save(lists);
  }

  async getLists(): Promise<ShoppingList[]> {
    return await this.storage.load() || [];
  }
}
*/