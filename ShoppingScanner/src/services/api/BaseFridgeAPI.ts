import { FridgeInventoryItem } from '../../types/FridgeInventory';
import { FridgeInfo } from '../../types/FridgeInfo';
import { FridgeTemperature } from '../../types/FridgeTemperature';

export interface BaseFridgeAPI {
  discover(ipAddress: string): Promise<FridgeInfo | null>;
  getInventory(fridgeId: string): Promise<FridgeInventoryItem[]>;
  updateInventoryItem(fridgeId: string, item: FridgeInventoryItem): Promise<void>;
  getTemperatures(fridgeId: string): Promise<FridgeTemperature[]>;
}