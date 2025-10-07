import { Platform } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { networkService } from './NetworkService';
import { 
  SmartFridgeConfig, 
  FridgeInventoryItem, 
  FridgeTemperature, 
  FridgeCamera, 
  SmartFridgeEvent, 
  SmartFridgeStats,
  SmartFridgeFeature 
} from '../types/smartHome';
import { BaseFridgeAPI, SamsungFamilyHubAPI, LGThinQAPI } from './manufacturers/FridgeManufacturerAPI';

// Lokale Entwicklungs-API-Keys (in Produktion durch echte Keys ersetzen)
const SAMSUNG_API_KEY = 'dev_samsung_key';
const LG_API_KEY = 'dev_lg_key';

class SmartFridgeService {
  private static instance: SmartFridgeService;
  private readonly fridgesCollection = 'smart_fridges';
  private readonly inventoryCollection = 'fridge_inventory';
  private readonly eventsCollection = 'fridge_events';
  
  // Cache für verbundene Kühlschränke
  private connectedFridges: Map<string, SmartFridgeConfig> = new Map();
  private manufacturerAPIs: Map<string, BaseFridgeAPI> = new Map();

  private constructor() {}

  public static getInstance(): SmartFridgeService {
    if (!SmartFridgeService.instance) {
      SmartFridgeService.instance = new SmartFridgeService();
    }
    return SmartFridgeService.instance;
  }

  public async connectFridge(
    manufacturer: SmartFridgeConfig['manufacturer'],
    ipAddress: string
  ): Promise<{ success: boolean; fridgeId?: string; error?: string }> {
    try {
      if (!await networkService.ping(ipAddress)) {
        return { success: false, error: 'Kühlschrank nicht erreichbar' };
      }

      const api = this.getManufacturerAPI(manufacturer);
      if (!api) {
        return { success: false, error: 'Nicht unterstützter Hersteller' };
      }

      const fridgeInfo = await api.discover(ipAddress);
      if (!fridgeInfo) {
        return { success: false, error: 'Gerät nicht erkannt' };
      }

      const fridgeId = `fridge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const features = this.mapFeatures(fridgeInfo.features);
      const config: SmartFridgeConfig = {
        id: fridgeId,
        name: fridgeInfo.name || 'Neuer Kühlschrank',
        manufacturer,
        model: fridgeInfo.model,
        ipAddress,
        features,
        lastSync: new Date().toISOString(),
        isConnected: true
      };

      await firestore().collection(this.fridgesCollection).doc(fridgeId).set(config);
      this.connectedFridges.set(fridgeId, config);
      this.manufacturerAPIs.set(fridgeId, api);

      return { success: true, fridgeId };
    } catch (error) {
      console.error('Error connecting fridge:', error);
      return { success: false, error: 'Fehler beim Verbinden des Kühlschranks' };
    }
  }

  public async getInventory(fridgeId: string): Promise<FridgeInventoryItem[]> {
    try {
      const fridge = await this.getFridgeConfig(fridgeId);
      if (!fridge || !fridge.isConnected) {
        throw new Error('Kühlschrank nicht verbunden');
      }

      const api = this.getManufacturerAPI(fridge.manufacturer);
      if (!api) {
        throw new Error('API nicht verfügbar');
      }

      const items = await api.getInventory(fridgeId);
      await this.syncInventoryWithFirestore(fridgeId, items);
      return items;
    } catch (error) {
      console.error('Error getting inventory:', error);
      return [];
    }
  }

  public async updateInventoryItem(
    fridgeId: string,
    item: FridgeInventoryItem
  ): Promise<boolean> {
    try {
      const fridge = await this.getFridgeConfig(fridgeId);
      if (!fridge || !fridge.isConnected) {
        throw new Error('Kühlschrank nicht verbunden');
      }

      const api = this.getManufacturerAPI(fridge.manufacturer);
      if (!api) {
        throw new Error('API nicht verfügbar');
      }

      await api.updateInventoryItem(fridgeId, item);
      await this.syncInventoryWithFirestore(fridgeId, [item]);
      return true;
    } catch (error) {
      console.error('Error updating item:', error);
      return false;
    }
  }

  public async getFridgeStats(fridgeId: string): Promise<SmartFridgeStats | null> {
    try {
      const fridge = await this.getFridgeConfig(fridgeId);
      if (!fridge || !fridge.isConnected) {
        throw new Error('Kühlschrank nicht verbunden');
      }

      const [inventory, temperatures] = await Promise.all([
        this.getInventory(fridgeId),
        this.getTemperatures(fridgeId)
      ]);

      const expiringItems = inventory.filter(item => {
        const daysUntilExpiry = Math.floor(
          (new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)
        );
        return daysUntilExpiry <= 3 && daysUntilExpiry >= 0;
      }).length;

      const itemCategories = inventory.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      }, {} as Record<FridgeInventoryItem['category'], number>);

      const averageTemperature = temperatures.length
        ? temperatures.reduce((sum, temp) => sum + temp.current, 0) / temperatures.length
        : 0;

      return {
        fridgeId,
        totalItems: inventory.length,
        expiringItems,
        doorOpenCount: 0, // Wird über Events aktualisiert
        averageTemperature,
        powerConsumption: 0, // TODO: Implementieren
        itemCategories
      };
    } catch (error) {
      console.error('Error getting fridge stats:', error);
      return null;
    }
  }

  private async getTemperatures(fridgeId: string): Promise<FridgeTemperature[]> {
    try {
      const fridge = await this.getFridgeConfig(fridgeId);
      if (!fridge || !fridge.isConnected) {
        throw new Error('Kühlschrank nicht verbunden');
      }

      const api = this.getManufacturerAPI(fridge.manufacturer);
      if (!api) {
        throw new Error('API nicht verfügbar');
      }

      return await api.getTemperatures(fridgeId);
    } catch (error) {
      console.error('Error getting temperatures:', error);
      return [];
    }
  }

  private getManufacturerAPI(manufacturer: SmartFridgeConfig['manufacturer']): BaseFridgeAPI | null {
    switch (manufacturer) {
      case 'Samsung':
        return new SamsungFamilyHubAPI(SAMSUNG_API_KEY);
      case 'LG':
        return new LGThinQAPI(LG_API_KEY);
      default:
        return null;
    }
  }

  private async getFridgeConfig(fridgeId: string): Promise<SmartFridgeConfig | null> {
    if (this.connectedFridges.has(fridgeId)) {
      return this.connectedFridges.get(fridgeId)!;
    }

    const doc = await firestore()
      .collection(this.fridgesCollection)
      .doc(fridgeId)
      .get();

    if (!doc.exists) return null;

    const config = doc.data() as SmartFridgeConfig;
    this.connectedFridges.set(fridgeId, config);
    return config;
  }

  private async syncInventoryWithFirestore(fridgeId: string, items: FridgeInventoryItem[]): Promise<void> {
    const batch = firestore().batch();
    
    items.forEach(item => {
      const ref = firestore()
        .collection(this.inventoryCollection)
        .doc(`${fridgeId}_${item.id}`);
      batch.set(ref, item, { merge: true });
    });

    await batch.commit();
  }

  private mapFeatures(features: string[]): SmartFridgeFeature[] {
    const featureMap: Record<string, SmartFridgeFeature> = {
      'INVENTORY': 'inventory',
      'TEMPERATURE': 'temperature',
      'CAMERA': 'camera',
      'SHOPPING_LIST': 'shoppingList',
      'EXPIRATION': 'expiration'
    };

    return features
      .map(feature => featureMap[feature.toUpperCase()])
      .filter((feature): feature is SmartFridgeFeature => feature !== undefined);
  }
}

export const smartFridgeService = SmartFridgeService.getInstance();