export interface ShoppingListItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  completed: boolean;
  category?: string;
  addedAt: Date;
}