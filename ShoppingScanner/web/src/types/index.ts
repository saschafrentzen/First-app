export interface ShoppingItem {
  id?: string;
  name: string;
  price: number;
  quantity: number;
  barcode?: string;
  createdAt: Date;
}

export interface ShoppingList {
  id?: string;
  name: string;
  budget?: number;
  items: ShoppingItem[];
  totalAmount: number;
  createdAt: Date;
  userId: string;
}