import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageError } from '../types/errors';
import { ProductNutriments } from '../types/products';

const NUTRITION_HISTORY_KEY = '@nutrition_history';

export interface NutritionEntry {
  date: string;
  productId: string;
  quantity: number;
  nutriments: ProductNutriments;
}

export interface DailyNutrition {
  date: string;
  totalEnergy: number;
  totalFat: number;
  totalCarbohydrates: number;
  totalProteins: number;
  products: Array<{
    productId: string;
    quantity: number;
    contribution: {
      energy: number;
      fat: number;
      carbohydrates: number;
      proteins: number;
    };
  }>;
}

export interface NutritionTrend {
  period: 'week' | 'month';
  averageEnergy: number;
  averageFat: number;
  averageCarbohydrates: number;
  averageProteins: number;
  data: {
    date: string;
    energy: number;
    fat: number;
    carbohydrates: number;
    proteins: number;
  }[];
}

class NutritionService {
  private static instance: NutritionService;
  private history: NutritionEntry[] = [];

  private constructor() {}

  public static getInstance(): NutritionService {
    if (!NutritionService.instance) {
      NutritionService.instance = new NutritionService();
    }
    return NutritionService.instance;
  }

  private async loadData(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(NUTRITION_HISTORY_KEY);
      this.history = data ? JSON.parse(data) : [];
    } catch (error) {
      throw new StorageError('Fehler beim Laden der Ernährungsdaten');
    }
  }

  private async saveData(): Promise<void> {
    try {
      await AsyncStorage.setItem(NUTRITION_HISTORY_KEY, JSON.stringify(this.history));
    } catch (error) {
      throw new StorageError('Fehler beim Speichern der Ernährungsdaten');
    }
  }

  public async addEntry(entry: NutritionEntry): Promise<void> {
    await this.loadData();
    this.history.push(entry);
    await this.saveData();
  }

  public async getDailyNutrition(date: string): Promise<DailyNutrition> {
    await this.loadData();
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const dayEntries = this.history.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= dayStart && entryDate <= dayEnd;
    });

    const products = dayEntries.map(entry => ({
      productId: entry.productId,
      quantity: entry.quantity,
      contribution: {
        energy: (entry.nutriments.energy * entry.quantity) / 100,
        fat: (entry.nutriments.fat * entry.quantity) / 100,
        carbohydrates: (entry.nutriments.carbohydrates * entry.quantity) / 100,
        proteins: (entry.nutriments.proteins * entry.quantity) / 100,
      },
    }));

    return {
      date,
      totalEnergy: products.reduce((sum, p) => sum + p.contribution.energy, 0),
      totalFat: products.reduce((sum, p) => sum + p.contribution.fat, 0),
      totalCarbohydrates: products.reduce((sum, p) => sum + p.contribution.carbohydrates, 0),
      totalProteins: products.reduce((sum, p) => sum + p.contribution.proteins, 0),
      products,
    };
  }

  public async getNutritionTrend(period: 'week' | 'month'): Promise<NutritionTrend> {
    await this.loadData();
    const now = new Date();
    const startDate = new Date();
    
    if (period === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else {
      startDate.setMonth(now.getMonth() - 1);
    }

    const dailyData: { [date: string]: DailyNutrition } = {};
    let currentDate = startDate;

    while (currentDate <= now) {
      const dateStr = currentDate.toISOString().split('T')[0];
      dailyData[dateStr] = await this.getDailyNutrition(dateStr);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const data = Object.values(dailyData).map(day => ({
      date: day.date,
      energy: day.totalEnergy,
      fat: day.totalFat,
      carbohydrates: day.totalCarbohydrates,
      proteins: day.totalProteins,
    }));

    const daysCount = data.length;
    return {
      period,
      averageEnergy: data.reduce((sum, d) => sum + d.energy, 0) / daysCount,
      averageFat: data.reduce((sum, d) => sum + d.fat, 0) / daysCount,
      averageCarbohydrates: data.reduce((sum, d) => sum + d.carbohydrates, 0) / daysCount,
      averageProteins: data.reduce((sum, d) => sum + d.proteins, 0) / daysCount,
      data,
    };
  }

  public async clearNutritionData(): Promise<void> {
    this.history = [];
    await AsyncStorage.removeItem(NUTRITION_HISTORY_KEY);
  }
}

export const nutritionService = NutritionService.getInstance();