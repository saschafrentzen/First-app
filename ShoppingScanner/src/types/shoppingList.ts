import { CustomCategory } from '../services/categoryService';

export interface ShoppingListItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  completed: boolean;
  category?: string | CustomCategory;
  addedAt: Date;
}