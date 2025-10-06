import { ShoppingListItem } from '../types/shoppingList';

class ShoppingListService {
  private static instance: ShoppingListService;
  private items: ShoppingListItem[] = [];

  private constructor() {}

  public static getInstance(): ShoppingListService {
    if (!ShoppingListService.instance) {
      ShoppingListService.instance = new ShoppingListService();
    }
    return ShoppingListService.instance;
  }

  async addItem(item: Omit<ShoppingListItem, 'id' | 'addedAt'>): Promise<ShoppingListItem> {
    const newItem: ShoppingListItem = {
      ...item,
      id: Math.random().toString(36).substring(7),
      addedAt: new Date()
    };
    this.items.push(newItem);
    return newItem;
  }

  async getItems(): Promise<ShoppingListItem[]> {
    return this.items;
  }

  async updateItem(id: string, updates: Partial<ShoppingListItem>): Promise<ShoppingListItem | null> {
    const index = this.items.findIndex(item => item.id === id);
    if (index === -1) return null;
    
    this.items[index] = { ...this.items[index], ...updates };
    return this.items[index];
  }

  async deleteItem(id: string): Promise<boolean> {
    const index = this.items.findIndex(item => item.id === id);
    if (index === -1) return false;
    
    this.items.splice(index, 1);
    return true;
  }

  async addItems(items: Omit<ShoppingListItem, 'id' | 'addedAt'>[]): Promise<ShoppingListItem[]> {
    const newItems = await Promise.all(items.map(item => this.addItem(item)));
    return newItems;
  }
}

export const shoppingListService = ShoppingListService.getInstance();