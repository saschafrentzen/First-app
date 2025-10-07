export type ShoppingListStatus = 'active' | 'completed' | 'archived';
export type ShoppingListType = 'manual' | 'auto' | 'shared';
export type ShoppingCategory = 
  | 'produce' 
  | 'meat' 
  | 'dairy'
  | 'beverages'
  | 'pantry'
  | 'household'
  | 'other';

export interface ShoppingListItem {
  id: string;
  name: string;
  quantity: number;
  unit?: string;
  category: ShoppingCategory;
  note?: string;
  price?: number;
  checked: boolean;
  added: string;
  source?: 'manual' | 'fridge' | 'scanner';
  sourceId?: string;
}

export interface ShoppingList {
  id: string;
  name: string;
  created: string;
  updated: string;
  items: ShoppingListItem[];
  type: ShoppingListType;
  status: ShoppingListStatus;
  fridgeId?: string;
  householdId?: string;
  note?: string;
  budget?: number;
  totalSpent?: number;
}