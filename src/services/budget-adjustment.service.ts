import AsyncStorage from '@react-native-async-storage/async-storage';
import { BudgetAdjustment } from '../types/budget';

class BudgetAdjustmentService {
  private static instance: BudgetAdjustmentService;

  private constructor() {}

  static getInstance(): BudgetAdjustmentService {
    if (!BudgetAdjustmentService.instance) {
      BudgetAdjustmentService.instance = new BudgetAdjustmentService();
    }
    return BudgetAdjustmentService.instance;
  }

  async saveAdjustment(adjustment: BudgetAdjustment): Promise<void> {
    try {
      // Lade bestehende Anpassungshistorie
      const historyData = await AsyncStorage.getItem(`budget_adjustments_${adjustment.categoryId}`);
      const history: BudgetAdjustment[] = historyData ? JSON.parse(historyData) : [];

      // Füge neue Anpassung hinzu
      history.push(adjustment);

      // Speichere aktualisierte Historie
      await AsyncStorage.setItem(
        `budget_adjustments_${adjustment.categoryId}`,
        JSON.stringify(history)
      );
    } catch (error) {
      console.error('Fehler beim Speichern der Budget-Anpassung:', error);
      throw error;
    }
  }

  async getAdjustmentHistory(categoryId: string): Promise<BudgetAdjustment[]> {
    try {
      const historyData = await AsyncStorage.getItem(`budget_adjustments_${categoryId}`);
      return historyData ? JSON.parse(historyData) : [];
    } catch (error) {
      console.error('Fehler beim Laden der Budget-Anpassungshistorie:', error);
      return [];
    }
  }

  async getRecentAdjustments(days: number = 30): Promise<BudgetAdjustment[]> {
    try {
      // Lade alle Kategorien-IDs aus dem AsyncStorage
      const categoriesData = await AsyncStorage.getItem('budget_categories');
      const categories = categoriesData ? JSON.parse(categoriesData) : {};
      
      // Sammle Anpassungen von allen Kategorien
      const allAdjustments: BudgetAdjustment[] = [];
      for (const categoryId of Object.keys(categories)) {
        const categoryAdjustments = await this.getAdjustmentHistory(categoryId);
        allAdjustments.push(...categoryAdjustments);
      }

      // Filtere nach Datum
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      return allAdjustments
        .filter(adj => new Date(adj.date) >= cutoffDate)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      console.error('Fehler beim Laden der kürzlichen Anpassungen:', error);
      return [];
    }
  }
}

export const budgetAdjustmentService = BudgetAdjustmentService.getInstance();