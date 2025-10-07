import axios from 'axios';
import { 
  FridgeInventoryItem,
  FridgeTemperature,
  FridgeCamera,
  FridgeItemCategory,
  SmartFridgeFeature,
  FridgeCompartment,
  FridgeItemCategory
} from '../../types/smartHome';

/**
 * Abstrakte Basisklasse für Herst  mapInventoryItem(item: any): FridgeInventoryItem {
    return {
      id: item.id,
      name: item.productName,
      category: this.mapCategory(item.foodType),
      quantity: item.quantity,
      unit: this.mapUnit(item.quantityUnit),
      minQuantity: item.minimumQuantity || 1,
      expiryDate: item.expirationDate,
      addedDate: item.storageDate,
      location: item.compartment || 'mainCompartment',
      lastUpdated: new Date().toISOString(),
      barcode: item.barcode,
      imageUrl: item.productImage,
      nutritionInfo: item.nutritionalInfo ? {
        calories: item.nutritionalInfo.calories,
        protein: item.nutritionalInfo.protein,
        carbs: item.nutritionalInfo.carbohydrates,
        fat: item.nutritionalInfo.fat,
      } : undefined,
    };port abstract class FridgeManufacturerAPI {
  protected apiKey: string;
  protected baseUrl: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = this.getBaseUrl();
  }

  abstract getBaseUrl(): string;
  abstract getHeaders(): Record<string, string>;
  abstract mapInventoryItem(item: any): FridgeInventoryItem;
  abstract mapTemperature(temp: any): FridgeTemperature;
  abstract mapCamera(cam: any): FridgeCamera;
  
  // Öffentliche Methode zum Aktualisieren von Inventar-Items
  async updateInventoryItem(deviceId: string, item: FridgeInventoryItem): Promise<void> {
    await this.put(`devices/${deviceId}/inventory/${item.id}`, item);
  }

  protected async get(endpoint: string) {
    const response = await axios.get(`${this.baseUrl}${endpoint}`, {
      headers: this.getHeaders(),
    });
    return response.data;
  }

  protected async post(endpoint: string, data: any) {
    const response = await axios.post(`${this.baseUrl}${endpoint}`, data, {
      headers: this.getHeaders(),
    });
    return response.data;
  }

  protected async put(endpoint: string, data: any) {
    const response = await axios.put(`${this.baseUrl}${endpoint}`, data, {
      headers: this.getHeaders(),
    });
    return response.data;
  }
}

/**
 * Samsung Family Hub API Implementation
 */
export class SamsungFamilyHubAPI extends FridgeManufacturerAPI {
  getBaseUrl(): string {
    return 'https://api.samsungfamilyhub.com/v2/';
  }

  getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'X-API-Version': '2.0',
    };
  }

  async discover(ipAddress: string) {
    try {
      const response = await axios.get(`http://${ipAddress}:8080/api/discover`, {
        timeout: 5000,
      });

      if (response.data.type === 'Family Hub') {
        return {
          name: response.data.deviceName,
          model: response.data.modelNumber,
          features: this.mapFeatures(response.data.capabilities),
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  private mapFeatures(capabilities: string[]): SmartFridgeFeature[] {
    const featureMap: Record<string, SmartFridgeFeature> = {
      'INVENTORY': 'inventory',
      'TEMPERATURE': 'temperature',
      'CAMERA': 'camera',
      'NOTIFICATIONS': 'shoppingList',
      'SHOPPING_LIST': 'shoppingList',
    };

    return capabilities
      .map(cap => featureMap[cap])
      .filter(Boolean);
  }

  async getInventory(deviceId: string): Promise<FridgeInventoryItem[]> {
    const data = await this.get(`devices/${deviceId}/inventory`);
    return data.items.map(this.mapInventoryItem.bind(this));
  }

  mapInventoryItem(item: any): FridgeInventoryItem {
    return {
      id: item.itemId,
      name: item.name,
      category: this.mapCategory(item.category),
      quantity: item.quantity,
      unit: this.mapUnit(item.unit),
      minQuantity: item.minQuantity || 1,
      expiryDate: item.expirationDate,
      addedDate: item.addedDate,
      barcode: item.barcode,
      imageUrl: item.imageUrl,
      location: item.location || 'mainCompartment',
      lastUpdated: new Date().toISOString(),
      nutritionInfo: item.nutritionInfo ? {
        calories: item.nutritionInfo.calories,
        protein: item.nutritionInfo.protein,
        carbs: item.nutritionInfo.carbs,
        fat: item.nutritionInfo.fat,
      } : undefined,
    };
  }

  private mapCategory(category: string): FridgeItemCategory {
    const categoryMap: Record<string, FridgeItemCategory> = {
      'BEVERAGE': 'beverages',
      'DAIRY': 'dairy',
      'MEAT': 'meat',
      'VEGETABLE': 'vegetables',
      'FRUIT': 'fruits',
      'OTHER': 'condiments',
    };
    return categoryMap[category] || 'food';
  }

  private mapUnit(unit: string): FridgeInventoryItem['unit'] {
    const unitMap: Record<string, FridgeInventoryItem['unit']> = {
      'PCS': 'pieces',
      'ML': 'ml',
      'L': 'l',
      'G': 'g',
      'KG': 'kg',
    };
    return unitMap[unit] || 'pieces';
  }

  async getTemperatures(deviceId: string): Promise<FridgeTemperature[]> {
    const data = await this.get(`devices/${deviceId}/temperature`);
    return data.zones.map(this.mapTemperature.bind(this));
  }

  mapTemperature(temp: any): FridgeTemperature {
    return {
      compartment: temp.zone.toLowerCase() as FridgeCompartment,
      current: temp.current,
      target: temp.target,
      lastUpdated: temp.timestamp,
      humidity: temp.humidity
    };
  }

  async getCameras(deviceId: string): Promise<FridgeCamera[]> {
    const data = await this.get(`devices/${deviceId}/cameras`);
    return data.cameras.map(this.mapCamera.bind(this));
  }

  mapCamera(cam: any): FridgeCamera {
    return {
      id: cam.cameraId,
      location: cam.location as FridgeCompartment,
      lastImage: cam.streamUrl,
      lastUpdated: cam.lastUpdate,
      resolution: {
        width: 1920,
        height: 1080
      }
    };
  }
}

/**
 * LG ThinQ API Implementation
 */
export class LGThinQAPI extends FridgeManufacturerAPI {
  getBaseUrl(): string {
    return 'https://api.lgwebos.com/refrigerator/v1/';
  }

  getHeaders(): Record<string, string> {
    return {
      'x-api-key': this.apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  async discover(ipAddress: string) {
    try {
      const response = await axios.get(`http://${ipAddress}:3000/device-info`, {
        timeout: 5000,
      });

      if (response.data.productType === 'REFRIGERATOR') {
        return {
          name: response.data.friendlyName,
          model: response.data.modelName,
          features: this.mapFeatures(response.data.supportedFeatures),
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  private mapFeatures(features: string[]): SmartFridgeFeature[] {
    const featureMap: Record<string, SmartFridgeFeature> = {
      'foodManager': 'inventory',
      'tempControl': 'temperature',
      'internalCam': 'camera',
      'smartNotify': 'shoppingList',
      'shoppingList': 'shoppingList',
    };

    return features
      .map(feat => featureMap[feat])
      .filter(Boolean);
  }

  async getInventory(deviceId: string): Promise<FridgeInventoryItem[]> {
    const data = await this.get(`devices/${deviceId}/food-manager/items`);
    return data.items.map(this.mapInventoryItem.bind(this));
  }

  mapInventoryItem(item: any): FridgeInventoryItem {
    return {
      id: item.id,
      name: item.productName,
      category: this.mapCategory(item.foodType),
      quantity: item.quantity,
      unit: this.mapUnit(item.quantityUnit),
      minQuantity: item.minimumQuantity || 1,
      expiryDate: item.expirationDate, // Verwende das standardisierte Feld
      addedDate: item.storageDate,
      barcode: item.barcode,
      imageUrl: item.productImage,
      nutritionInfo: item.nutritionalInfo ? {
        calories: item.nutritionalInfo.calories,
        protein: item.nutritionalInfo.protein,
        carbs: item.nutritionalInfo.carbohydrates,
        fat: item.nutritionalInfo.fat,
      } : undefined,
    };
  }

  private mapCategory(category: string): FridgeItemCategory {
    const categoryMap: Record<string, FridgeItemCategory> = {
      'BEVERAGE': 'beverages',
      'MILK_DAIRY': 'dairy',
      'MEAT_FISH': 'meat',
      'VEGETABLE': 'vegetables',
      'FRUIT': 'fruits',
      'OTHERS': 'condiments',
    };
    return categoryMap[category] || 'food';
  }

  private mapUnit(unit: string): FridgeInventoryItem['unit'] {
    const unitMap: Record<string, FridgeInventoryItem['unit']> = {
      'COUNT': 'pieces',
      'MILLILITER': 'ml',
      'LITER': 'l',
      'GRAM': 'g',
      'KILOGRAM': 'kg',
    };
    return unitMap[unit] || 'pieces';
  }

  async getTemperatures(deviceId: string): Promise<FridgeTemperature[]> {
    const data = await this.get(`devices/${deviceId}/temperature`);
    return data.compartments.map(this.mapTemperature.bind(this));
  }

  mapTemperature(temp: any): FridgeTemperature {
    return {
      compartment: temp.compartmentType === 'FREEZER' ? 'freezer' : 'mainCompartment' as FridgeCompartment,
      current: temp.currentTemp,
      target: temp.targetTemp,
      lastUpdated: new Date().toISOString(), // LG API gibt keinen Zeitstempel
      humidity: temp.humidity
    };
  }

  async getCameras(deviceId: string): Promise<FridgeCamera[]> {
    const data = await this.get(`devices/${deviceId}/internal-camera`);
    return data.cameras.map(this.mapCamera.bind(this));
  }

  mapCamera(cam: any): FridgeCamera {
    return {
      id: cam.cameraId,
      location: cam.compartment as FridgeCompartment,
      lastImage: cam.liveStreamUrl,
      lastUpdated: cam.lastImageTime,
      resolution: {
        width: 1920,
        height: 1080
      }
    };
  }
}