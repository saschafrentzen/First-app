import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageError } from '../types/errors';

const CUSTOM_CATEGORIES_KEY = '@custom_categories';

export interface CustomCategory {
  id: string;
  name: string;
  color: string;
  icon?: string;
  parentCategory?: string;
  createdAt: string;
  lastModified: string;
}

class CategoryService {
  private static instance: CategoryService;
  private categories: CustomCategory[] = [];
  private initialized = false;

  private constructor() {}

  public static getInstance(): CategoryService {
    if (!CategoryService.instance) {
      CategoryService.instance = new CategoryService();
    }
    return CategoryService.instance;
  }

  private async initialize() {
    if (this.initialized) return;

    try {
      const stored = await AsyncStorage.getItem(CUSTOM_CATEGORIES_KEY);
      this.categories = stored ? JSON.parse(stored) : this.getDefaultCategories();
      this.initialized = true;
    } catch (error) {
      console.error('Fehler beim Initialisieren der Kategorien:', error);
      throw new StorageError('Fehler beim Laden der Kategorien');
    }
  }

  private async save() {
    try {
      await AsyncStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(this.categories));
    } catch (error) {
      throw new StorageError('Fehler beim Speichern der Kategorien');
    }
  }

  private getDefaultCategories(): CustomCategory[] {
    return [
      {
        id: 'groceries',
        name: 'Lebensmittel',
        color: '#4CAF50',
        icon: 'food',
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      },
      {
        id: 'household',
        name: 'Haushalt',
        color: '#2196F3',
        icon: 'home',
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      },
      {
        id: 'hygiene',
        name: 'Hygiene',
        color: '#9C27B0',
        icon: 'shower',
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      },
    ];
  }

  public async getAllCategories(): Promise<CustomCategory[]> {
    await this.initialize();
    return [...this.categories];
  }

  public async getCategoryById(id: string): Promise<CustomCategory | undefined> {
    await this.initialize();
    return this.categories.find(cat => cat.id === id);
  }

  public async createCategory(category: Omit<CustomCategory, 'id' | 'createdAt' | 'lastModified'>): Promise<CustomCategory> {
    await this.initialize();
    
    const newCategory: CustomCategory = {
      ...category,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };

    this.categories.push(newCategory);
    await this.save();
    return newCategory;
  }

  public async updateCategory(id: string, updates: Partial<CustomCategory>): Promise<CustomCategory> {
    await this.initialize();
    
    const index = this.categories.findIndex(cat => cat.id === id);
    if (index === -1) {
      throw new StorageError('Kategorie nicht gefunden');
    }

    const updatedCategory = {
      ...this.categories[index],
      ...updates,
      lastModified: new Date().toISOString(),
    };

    this.categories[index] = updatedCategory;
    await this.save();
    return updatedCategory;
  }

  public async deleteCategory(id: string): Promise<void> {
    await this.initialize();
    
    const index = this.categories.findIndex(cat => cat.id === id);
    if (index === -1) {
      throw new StorageError('Kategorie nicht gefunden');
    }

    // Prüfe, ob die Kategorie Unterkategorien hat
    const hasChildren = this.categories.some(cat => cat.parentCategory === id);
    if (hasChildren) {
      throw new StorageError('Kategorie hat Unterkategorien und kann nicht gelöscht werden');
    }

    this.categories.splice(index, 1);
    await this.save();
  }

  public async getSubcategories(parentId: string): Promise<CustomCategory[]> {
    await this.initialize();
    return this.categories.filter(cat => cat.parentCategory === parentId);
  }

  public async getCategoryPath(id: string): Promise<CustomCategory[]> {
    await this.initialize();
    
    const path: CustomCategory[] = [];
    let currentId = id;

    while (currentId) {
      const category = await this.getCategoryById(currentId);
      if (!category) break;

      path.unshift(category);
      if (!category.parentCategory) break;
      currentId = category.parentCategory;
    }

    return path;
  }
}

export const categoryService = CategoryService.getInstance();