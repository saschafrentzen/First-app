import { SmartFridgeConfig, FridgeInventoryItem, FridgeTemperature, FridgeCamera, SmartFridgeEvent, SmartFridgeStats } from '../types/smartHome';
import firestore from '@react-native-firebase/firestore';
import { networkService } from './NetworkService';
import { Platform } from 'react-native';

// API-Keys für verschiedene Hersteller
const SAMSUNG_API_KEY = process.env.SAMSUNG_API_KEY || '';
const LG_API_KEY = process.env.LG_API_KEY || '';dgeStats } from '../types/smartHome';
import firestore from '@react-native-firebase/firestore';
import { networkService } from './NetworkService';
import { Platform } from 'react-native';
import { SAMSUNG_API_KEY, LG_API_KEY } from '../config/env';
import { SamsungFamilyHubAPI, LGThinQAPI } from './manufacturers/FridgeManufacturerAPI';

class SmartFridgeService {
  private static instance: SmartFridgeService;
  private readonly fridgesCollection = 'smart_fridges';
  private readonly inventoryCollection = 'fridge_inventory';
  private readonly eventsCollection = 'fridge_events';
  
  // Cache für verbundene Kühlschränke
  private connectedFridges: Map<string, SmartFridgeConfig> = new Map();

  private constructor() {}

  public static getInstance(): SmartFridgeService {
    if (!SmartFridgeService.instance) {
      SmartFridgeService.instance = new SmartFridgeService();
    }
    return SmartFridgeService.instance;
  }

  /**
   * Verbindet einen neuen Smart-Kühlschrank
   */
  public async connectFridge(
    manufacturer: SmartFridgeConfig['manufacturer'],
    ipAddress: string
  ): Promise<{ success: boolean; fridgeId?: string; error?: string }> {
    try {
      // Prüfe Netzwerkverbindung
      if (!await this.checkNetworkConnection(ipAddress)) {
        return { success: false, error: 'Kühlschrank nicht erreichbar' };
      }

      // Hole Geräteinformationen basierend auf Hersteller
      const fridgeInfo = await this.discoverFridge(manufacturer, ipAddress);
      if (!fridgeInfo) {
        return { success: false, error: 'Gerät nicht erkannt' };
      }

      const fridgeId = `fridge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const config: SmartFridgeConfig = {
        id: fridgeId,
        name: fridgeInfo.name || 'Neuer Kühlschrank',
        manufacturer,
        model: fridgeInfo.model,
        ipAddress,
        apiKey: this.getApiKey(manufacturer),
        lastSync: new Date().toISOString(),
        isConnected: true,
        features: fridgeInfo.features
      };

      await firestore().collection(this.fridgesCollection).doc(fridgeId).set(config);
      this.connectedFridges.set(fridgeId, config);

      return { success: true, fridgeId };
    } catch (error) {
      console.error('Error connecting fridge:', error);
      return {
        success: false,
        error: 'Fehler beim Verbinden des Kühlschranks'
      };
    }
  }

  /**
   * Ruft das aktuelle Inventar eines Kühlschranks ab
   */
  public async getInventory(fridgeId: string): Promise<FridgeInventoryItem[]> {
    try {
      const fridge = await this.getFridgeConfig(fridgeId);
      if (!fridge || !fridge.isConnected) {
        throw new Error('Kühlschrank nicht verbunden');
      }

      // Versuche zuerst direkte API-Abfrage
      try {
        const items = await this.fetchInventoryFromFridge(fridge);
        // Synchronisiere mit Firestore
        await this.syncInventoryWithFirestore(fridgeId, items);
        return items;
      } catch (error) {
        // Fallback: Lade aus Firestore
        console.warn('Could not fetch from fridge, using cached data:', error);
        const snapshot = await firestore()
          .collection(this.inventoryCollection)
          .where('fridgeId', '==', fridgeId)
          .get();
        
        return snapshot.docs.map(doc => doc.data() as FridgeInventoryItem);
      }
    } catch (error) {
      console.error('Error getting inventory:', error);
      return [];
    }
  }

  /**
   * Aktualisiert den Bestand eines Artikels
   */
  public async updateInventoryItem(
    fridgeId: string,
    item: FridgeInventoryItem
  ): Promise<boolean> {
    try {
      const fridge = await this.getFridgeConfig(fridgeId);
      if (!fridge || !fridge.isConnected) {
        throw new Error('Kühlschrank nicht verbunden');
      }

      // Aktualisiere im Kühlschrank
      await this.updateFridgeItem(fridge, item);

      // Aktualisiere in Firestore
      await firestore()
        .collection(this.inventoryCollection)
        .doc(`${fridgeId}_${item.id}`)
        .set({
          ...item,
          lastUpdated: new Date().toISOString()
        }, { merge: true });

      return true;
    } catch (error) {
      console.error('Error updating inventory item:', error);
      return false;
    }
  }

  /**
   * Ruft die aktuellen Temperaturen ab
   */
  public async getTemperatures(fridgeId: string): Promise<FridgeTemperature[]> {
    try {
      const fridge = await this.getFridgeConfig(fridgeId);
      if (!fridge || !fridge.isConnected) {
        throw new Error('Kühlschrank nicht verbunden');
      }

      return await this.fetchTemperaturesFromFridge(fridge);
    } catch (error) {
      console.error('Error getting temperatures:', error);
      return [];
    }
  }

  /**
   * Ruft die Kamerabilder ab
   */
  public async getCameraImages(fridgeId: string): Promise<FridgeCamera[]> {
    try {
      const fridge = await this.getFridgeConfig(fridgeId);
      if (!fridge || !fridge.isConnected || !fridge.features.includes('camera')) {
        throw new Error('Kamera nicht verfügbar');
      }

      return await this.fetchCameraImagesFromFridge(fridge);
    } catch (error) {
      console.error('Error getting camera images:', error);
      return [];
    }
  }

  /**
   * Ruft Statistiken und Events ab
   */
  public async getFridgeStats(fridgeId: string): Promise<SmartFridgeStats> {
    try {
      const fridge = await this.getFridgeConfig(fridgeId);
      if (!fridge || !fridge.isConnected) {
        throw new Error('Kühlschrank nicht verbunden');
      }

      const stats = await this.fetchFridgeStats(fridge);
      const events = await this.getRecentEvents(fridgeId);

      // Ergänze Statistiken mit Event-Daten
      const doorOpenCount = events
        .filter(e => e.type === 'doorOpen')
        .length;

      return {
        ...stats,
        doorOpenCount
      };
    } catch (error) {
      console.error('Error getting fridge stats:', error);
      return {
        fridgeId,
        totalItems: 0,
        expiringItems: 0,
        doorOpenCount: 0,
        averageTemperature: 0,
        powerConsumption: 0,
        itemCategories: {}
      };
    }
  }

  /**
   * Holt kürzliche Events
   */
  private async getRecentEvents(fridgeId: string): Promise<SmartFridgeEvent[]> {
    const snapshot = await firestore()
      .collection(this.eventsCollection)
      .where('fridgeId', '==', fridgeId)
      .orderBy('timestamp', 'desc')
      .limit(100)
      .get();

    return snapshot.docs.map(doc => doc.data() as SmartFridgeEvent);
  }

  /**
   * Prüft die Netzwerkverbindung zum Kühlschrank
   */
  private async checkNetworkConnection(ipAddress: string): Promise<boolean> {
    try {
      const response = await networkService.ping(ipAddress);
      return response.success;
    } catch {
      return false;
    }
  }

  /**
   * Erkennt den Kühlschrank im Netzwerk
   */
  private async discoverFridge(
    manufacturer: SmartFridgeConfig['manufacturer'],
    ipAddress: string
  ): Promise<{
    name?: string;
    model: string;
    features: SmartFridgeConfig['features'];
  } | null> {
    // Implementiere herstellerspezifische Erkennungslogik
    switch (manufacturer) {
      case 'Samsung':
        return await this.discoverSamsungFridge(ipAddress);
      case 'LG':
        return await this.discoverLGFridge(ipAddress);
      // Weitere Hersteller...
      default:
        return null;
    }
  }

  /**
   * Holt API-Keys für verschiedene Hersteller
   */
  private getApiKey(manufacturer: SmartFridgeConfig['manufacturer']): string | undefined {
    switch (manufacturer) {
      case 'Samsung':
        return SAMSUNG_API_KEY;
      case 'LG':
        return LG_API_KEY;
      default:
        return undefined;
    }
  }

  /**
   * Lädt die Kühlschrank-Konfiguration
   */
  private async getFridgeConfig(fridgeId: string): Promise<SmartFridgeConfig | null> {
    // Prüfe Cache
    if (this.connectedFridges.has(fridgeId)) {
      return this.connectedFridges.get(fridgeId)!;
    }

    // Lade aus Firestore
    const doc = await firestore()
      .collection(this.fridgesCollection)
      .doc(fridgeId)
      .get();

    if (!doc.exists) return null;

    const config = doc.data() as SmartFridgeConfig;
    this.connectedFridges.set(fridgeId, config);
    return config;
  }

  // Herstellerspezifische Implementierungen
  private getManufacturerAPI(fridge: SmartFridgeConfig) {
    const apiKey = this.getApiKey(fridge.manufacturer);
    if (!apiKey) return null;

    switch (fridge.manufacturer) {
      case 'Samsung':
        return new SamsungFamilyHubAPI(apiKey);
      case 'LG':
        return new LGThinQAPI(apiKey);
      default:
        return null;
    }
  }

  private async discoverSamsungFridge(ipAddress: string) {
    const api = new SamsungFamilyHubAPI(SAMSUNG_API_KEY);
    return await api.discover(ipAddress);
  }

  private async discoverLGFridge(ipAddress: string) {
    const api = new LGThinQAPI(LG_API_KEY);
    return await api.discover(ipAddress);
  }

  private async fetchInventoryFromFridge(fridge: SmartFridgeConfig): Promise<FridgeInventoryItem[]> {
    const api = this.getManufacturerAPI(fridge);
    if (!api) return [];

    try {
      const items = await api.getInventory(fridge.id);
      await this.syncInventoryWithFirestore(fridge.id, items);
      return items;
    } catch (error) {
      console.error('Error fetching inventory:', error);
      return [];
    }
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

  private async updateFridgeItem(fridge: SmartFridgeConfig, item: FridgeInventoryItem): Promise<void> {
    const api = this.getManufacturerAPI(fridge);
    if (!api) return;

    try {
      // Update im Kühlschrank
      await api.updateInventoryItem(fridge.id, item);
      
      // Lokales Update in Firestore
      await this.syncInventoryWithFirestore(fridge.id, [item]);
    } catch (error) {
      console.error('Error updating item:', error);
      throw new Error('Item update failed');
    }
  }

  private async fetchTemperaturesFromFridge(fridge: SmartFridgeConfig): Promise<FridgeTemperature[]> {
    const api = this.getManufacturerAPI(fridge);
    if (!api) return [];

    try {
      return await api.getTemperatures(fridge.id);
    } catch (error) {
      console.error('Error fetching temperatures:', error);
      return [];
    }
  }

  private async fetchCameraImagesFromFridge(fridge: SmartFridgeConfig): Promise<FridgeCamera[]> {
    const api = this.getManufacturerAPI(fridge);
    if (!api) return [];

    try {
      return await api.getCameras(fridge.id);
    } catch (error) {
      console.error('Error fetching camera images:', error);
      return [];
    }
  }

  private async fetchFridgeStats(fridge: SmartFridgeConfig): Promise<SmartFridgeStats> {
    const [inventory, temperatures] = await Promise.all([
      this.fetchInventoryFromFridge(fridge),
      this.fetchTemperaturesFromFridge(fridge)
    ]);

    // Berechne Statistiken
    const expiringItems = inventory.filter(item => {
      const daysUntilExpiry = Math.floor(
        (new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)
      );
      return daysUntilExpiry <= 3 && daysUntilExpiry >= 0; // Nur zukünftige Ablaufdaten
    }).length;

    const itemCategories = inventory.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {} as Record<FridgeInventoryItem['category'], number>);

    const averageTemperature = temperatures.length
      ? temperatures.reduce((sum, temp) => sum + temp.current, 0) / temperatures.length
      : 0;

    return {
      fridgeId: fridge.id,
      totalItems: inventory.length,
      expiringItems,
      doorOpenCount: 0, // Wird über Events aktualisiert
      averageTemperature,
      powerConsumption: 0, // TODO: Implementieren wenn API verfügbar
      itemCategories
    };
  }
}

export const smartFridgeService = SmartFridgeService.getInstance();