export type FridgeItemCategory = 
  | 'dairy'
  | 'meat'
  | 'vegetables'
  | 'fruits'
  | 'beverages'
  | 'condiments'
  | 'leftovers'
  | 'other';

export interface FridgeInventoryItem {
  id: string;
  name: string;
  category: FridgeItemCategory;
  quantity: number;
  unit: string;
  expiryDate: string;
  addedDate: string;
  lastModified: string;
}