import { StorageError } from '../types/errors';
import { Product } from '../types/products';
import AsyncStorage from '@react-native-async-storage/async-storage';

const OPEN_FOOD_FACTS_API = 'https://world.openfoodfacts.org/api/v2';
const PRODUCT_CACHE_KEY = '@product_cache';
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 Tage in Millisekunden

interface ProductCache {
  [barcode: string]: {
    product: Product;
    timestamp: number;
  };
}

class ProductService {
  private static instance: ProductService;
  private cache: ProductCache = {};
  private initialized = false;

  private constructor() {}

  public static getInstance(): ProductService {
    if (!ProductService.instance) {
      ProductService.instance = new ProductService();
    }
    return ProductService.instance;
  }

  private async initialize() {
    if (this.initialized) return;

    try {
      const cachedData = await AsyncStorage.getItem(PRODUCT_CACHE_KEY);
      if (cachedData) {
        this.cache = JSON.parse(cachedData);
        // Alte Cache-Einträge entfernen
        const now = Date.now();
        Object.keys(this.cache).forEach(key => {
          if (now - this.cache[key].timestamp > CACHE_EXPIRY) {
            delete this.cache[key];
          }
        });
        await this.saveCache();
      }
      this.initialized = true;
    } catch (error) {
      console.error('Fehler beim Initialisieren des Produkt-Cache:', error);
    }
  }

  private async saveCache() {
    try {
      await AsyncStorage.setItem(PRODUCT_CACHE_KEY, JSON.stringify(this.cache));
    } catch (error) {
      console.error('Fehler beim Speichern des Produkt-Cache:', error);
    }
  }

  public async getProduct(barcode: string): Promise<Product> {
    await this.initialize();

    // Prüfen, ob das Produkt im Cache ist und noch nicht abgelaufen ist
    const cachedProduct = this.cache[barcode];
    if (cachedProduct?.product && Date.now() - cachedProduct.timestamp < CACHE_EXPIRY) {
      return cachedProduct.product;
    }

    try {
      const response = await fetch(`${OPEN_FOOD_FACTS_API}/product/${barcode}.json`);
      if (!response.ok) {
        throw new Error(`Produkt nicht gefunden (Status: ${response.status})`);
      }

      const data = await response.json();
      if (!data || !data.product) {
        throw new Error('Ungültige Produktdaten von der API');
      }

      // Extrahiere die Nährwerte sicher
      const nutriments = data.product.nutriments || {};
      
      // Konvertiere kcal zu kJ falls nötig
      let energy = nutriments.energy_100g;
      if (!energy && nutriments.energy_kcal_100g) {
        energy = nutriments.energy_kcal_100g * 4.184;
      }

      const product: Product = {
        barcode,
        name: data.product.product_name_de || data.product.product_name || 'Unbekanntes Produkt',
        brand: data.product.brands?.split(',')[0]?.trim() || 'Unbekannte Marke',
        category: data.product.categories_tags?.[0] || 'Keine Kategorie',
        image: data.product.image_front_url || null,
        nutriments: {
          energy: energy || 0,
          fat: nutriments.fat_100g || 0,
          carbohydrates: nutriments.carbohydrates_100g || 0,
          proteins: nutriments.proteins_100g || 0,
        },
        ingredients: data.product.ingredients_text_de || data.product.ingredients_text || '',
        price: 0, // Preis muss separat ermittelt werden
        lastUpdated: new Date().toISOString(),
      };

      // Produkt im Cache speichern
      this.cache[barcode] = {
        product,
        timestamp: Date.now(),
      };
      await this.saveCache();

      return product;
    } catch (error) {
      if (error instanceof Error) {
        throw new StorageError(`Fehler beim Abrufen des Produkts: ${error.message}`);
      }
      throw new StorageError('Unbekannter Fehler beim Abrufen des Produkts');
    }
  }

  public async updateProductPrice(barcode: string, price: number): Promise<void> {
    await this.initialize();

    const cachedProduct = this.cache[barcode];
    if (cachedProduct) {
      cachedProduct.product.price = price;
      cachedProduct.timestamp = Date.now();
      await this.saveCache();
    }
  }

  public async clearCache(): Promise<void> {
    this.cache = {};
    await AsyncStorage.removeItem(PRODUCT_CACHE_KEY);
  }
}

export const productService = ProductService.getInstance();

export const lookupProduct = async (barcode: string) => {
  return productService.getProduct(barcode);
};