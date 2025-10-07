import { FridgeInventoryItem } from './FridgeInventory';

export interface SmartFridgeStats {
  fridgeId: string;
  totalItems: number;
  expiringItems: number;
  doorOpenCount: number;
  averageTemperature: number;
  powerConsumption: number;
  itemCategories: Record<FridgeInventoryItem['category'], number>;
}