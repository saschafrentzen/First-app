import { smartFridgeService } from './SmartFridgeService';
import { FridgeInventoryItem, FridgeItemCategory } from '../types/smartHome';
import { ShoppingListItem, ShoppingList, ShoppingCategory } from '../types/shopping';
import firestore from '@react-native-firebase/firestore';

class AutoShoppingListService {
  private static instance: AutoShoppingListService;
  private readonly shoppingListsCollection = 'shopping_lists';
  private readonly AUTO_LIST_PREFIX = 'AUTO_';

  private constructor() {}

  public static getInstance(): AutoShoppingListService {
    if (!AutoShoppingListService.instance) {
      AutoShoppingListService.instance = new AutoShoppingListService();
    }
    return AutoShoppingListService.instance;
  }

  /**
   * Generiert eine neue Einkaufsliste basierend auf Kühlschrank-Inventar
   */
  public async generateShoppingList(fridgeId: string): Promise<string> {
    try {
      // Hole aktuelles Inventar
      const inventory = await smartFridgeService.getInventory(fridgeId);
      
      // Filtere Artikel unter Mindestbestand
      const lowItems = this.findLowStockItems(inventory);
      if (lowItems.length === 0) {
        return ''; // Keine Items unter Mindestbestand
      }

      // Erstelle neue Einkaufsliste
      const listId = await this.createShoppingList(lowItems, fridgeId);
      return listId;
    } catch (error) {
      console.error('Error generating shopping list:', error);
      throw new Error('Fehler beim Erstellen der Einkaufsliste');
    }
  }

  /**
   * Aktualisiert bestehende automatische Einkaufslisten
   */
  public async updateAutoLists(): Promise<void> {
    try {
      // Hole alle aktiven automatischen Listen
      const autoLists = await this.getAutoLists();
      
      for (const list of autoLists) {
        const fridgeId = list.fridgeId;
        if (!fridgeId) continue;

        // Prüfe aktuelles Inventar
        const inventory = await smartFridgeService.getInventory(fridgeId);
        const lowItems = this.findLowStockItems(inventory);

        // Aktualisiere Liste
        await this.updateShoppingList(list.id, lowItems);
      }
    } catch (error) {
      console.error('Error updating auto lists:', error);
      throw new Error('Fehler beim Aktualisieren der automatischen Listen');
    }
  }

  /**
   * Aktiviert/Deaktiviert automatische Listen für einen Kühlschrank
   */
  public async toggleAutoListGeneration(
    fridgeId: string,
    enabled: boolean
  ): Promise<void> {
    try {
      await firestore()
        .collection('smart_fridges')
        .doc(fridgeId)
        .update({
          autoListEnabled: enabled,
          lastAutoListUpdate: new Date().toISOString(),
        });

      if (enabled) {
        // Erstelle initiale Liste
        await this.generateShoppingList(fridgeId);
      }
    } catch (error) {
      console.error('Error toggling auto list generation:', error);
      throw new Error('Fehler beim Ändern der automatischen Listengenerierung');
    }
  }

  /**
   * Findet Artikel, die nachgekauft werden müssen
   */
  private findLowStockItems(inventory: FridgeInventoryItem[]): ShoppingListItem[] {
    return inventory
      .filter(item => {
        // Prüfe ob unter Mindestbestand
        if (!item.minQuantity) return false;
        return item.quantity < item.minQuantity;
      })
      .map(item => ({
        id: `${this.AUTO_LIST_PREFIX}${item.id}`,
        name: item.name,
        quantity: item.minQuantity! - item.quantity,
        unit: item.unit || 'stk',
        category: this.mapFridgeCategoryToShoppingCategory(item.category),
        note: `Automatisch generiert für ${item.name}`,
        checked: false,
        added: new Date().toISOString(),
        source: 'fridge',
        sourceId: item.id
      }));
  }

  /**
   * Erstellt eine neue Einkaufsliste
   */
  private async createShoppingList(
    items: ShoppingListItem[],
    fridgeId: string
  ): Promise<string> {
    const list: ShoppingList = {
      id: `${this.AUTO_LIST_PREFIX}${Date.now()}`,
      name: 'Automatische Einkaufsliste',
      items: items,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      type: 'auto',
      status: 'active',
      fridgeId,
      totalSpent: 0
    };

    await firestore()
      .collection(this.shoppingListsCollection)
      .doc(list.id)
      .set(list);

    return list.id;
  }

  /**
   * Aktualisiert eine bestehende Einkaufsliste
   */
  private async updateShoppingList(
    listId: string,
    newItems: ShoppingListItem[]
  ): Promise<void> {
    const listRef = firestore()
      .collection(this.shoppingListsCollection)
      .doc(listId);

    const doc = await listRef.get();
    if (!doc.exists) return;

    const currentList = doc.data() as ShoppingList;
    
    // Behalte markierte Items
    const checkedItems = currentList.items.filter((item: ShoppingListItem) => item.checked);
    
    // Füge neue Items hinzu, wenn sie nicht schon markiert sind
    const updatedItems = [
      ...checkedItems,
      ...newItems.filter(newItem => 
        !checkedItems.some((checked: ShoppingListItem) => checked.sourceId === newItem.sourceId)
      ),
    ];

    await listRef.update({
      items: updatedItems,
      updated: new Date().toISOString()
    });
  }

  /**
   * Holt alle aktiven automatischen Einkaufslisten
   */
  private async getAutoLists(): Promise<ShoppingList[]> {
    const snapshot = await firestore()
      .collection(this.shoppingListsCollection)
      .where('type', '==', 'auto')
      .where('status', '==', 'active')
      .get();

    return snapshot.docs.map(doc => doc.data() as ShoppingList);
  }

  /**
   * Mappt Kühlschrank-Kategorien zu Einkaufslisten-Kategorien
   */
  private mapFridgeCategoryToShoppingCategory(
    category: FridgeInventoryItem['category']
  ): ShoppingListItem['category'] {
    switch (category) {
      case 'beverages':
        return 'beverages';
      case 'dairy':
        return 'dairy';
      case 'meat':
        return 'meat';
      case 'vegetables':
        return 'produce';
      case 'fruits':
        return 'produce';
      default:
        return 'other';
    }
  }
}

export const autoShoppingListService = AutoShoppingListService.getInstance();