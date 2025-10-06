import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  SeasonalFood, 
  SeasonalTip, 
  SeasonalMealPlan,
  SeasonalReport,
  Month 
} from '../types/seasonal';

class SeasonalFoodService {
  private static instance: SeasonalFoodService;
  private foods: Map<string, SeasonalFood> = new Map();
  private tips: Map<string, SeasonalTip> = new Map();
  private mealPlans: Map<string, SeasonalMealPlan> = new Map();
  private reports: Map<string, SeasonalReport> = new Map();

  private constructor() {
    this.loadData();
    this.initializeSampleData();
  }

  private async initializeSampleData() {
    try {
      // Prüfe ob bereits Daten existieren
      const existingFoods = await AsyncStorage.getItem('seasonal_foods');
      const existingTips = await AsyncStorage.getItem('seasonal_tips');

      if (!existingFoods || !existingTips) {
        const { sampleSeasonalFoods, sampleSeasonalTips } = await import('../data/seasonalSamples');
        
        // Initialisiere Foods
        sampleSeasonalFoods.forEach(food => {
          this.foods.set(food.id, food);
        });
        await this.saveFoods();

        // Initialisiere Tips
        sampleSeasonalTips.forEach(tip => {
          this.tips.set(tip.id, tip);
        });
        await this.saveTips();

        console.log('Beispieldaten erfolgreich initialisiert');
      }
    } catch (error) {
      console.error('Fehler beim Initialisieren der Beispieldaten:', error);
    }
  }

  static getInstance(): SeasonalFoodService {
    if (!SeasonalFoodService.instance) {
      SeasonalFoodService.instance = new SeasonalFoodService();
    }
    return SeasonalFoodService.instance;
  }

  // Saisonale Lebensmittel
  async getSeasonalFoods(month: Month): Promise<SeasonalFood[]> {
    return Array.from(this.foods.values()).filter(food => 
      this.isFoodInSeason(food, month)
    );
  }

  async getFood(id: string): Promise<SeasonalFood | undefined> {
    return this.foods.get(id);
  }

  async addFood(food: Omit<SeasonalFood, 'id'>): Promise<SeasonalFood> {
    const newFood: SeasonalFood = {
      ...food,
      id: `food_${Date.now()}`
    };

    this.foods.set(newFood.id, newFood);
    await this.saveFoods();
    return newFood;
  }

  // Saisonale Tipps
  async getCurrentTips(month: Month): Promise<SeasonalTip[]> {
    return Array.from(this.tips.values())
      .filter(tip => tip.applicableMonths.includes(month))
      .sort((a, b) => this.getImportanceScore(b.importance) - this.getImportanceScore(a.importance));
  }

  async addTip(tip: Omit<SeasonalTip, 'id' | 'metadata'>): Promise<SeasonalTip> {
    const newTip: SeasonalTip = {
      ...tip,
      id: `tip_${Date.now()}`,
      metadata: {
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      }
    };

    this.tips.set(newTip.id, newTip);
    await this.saveTips();
    return newTip;
  }

  // Wochenpläne
  async getCurrentMealPlan(): Promise<SeasonalMealPlan | undefined> {
    const currentWeek = this.getCurrentWeek();
    const currentYear = new Date().getFullYear();

    return Array.from(this.mealPlans.values())
      .find(plan => plan.week === currentWeek && plan.year === currentYear);
  }

  async generateMealPlan(profileId: string): Promise<SeasonalMealPlan> {
    const currentMonth = (new Date().getMonth() + 1) as Month;
    const seasonalFoods = await this.getSeasonalFoods(currentMonth);
    const currentTips = await this.getCurrentTips(currentMonth);

    const newPlan: SeasonalMealPlan = {
      id: `plan_${Date.now()}`,
      week: this.getCurrentWeek(),
      year: new Date().getFullYear(),
      seasonalFoods: seasonalFoods.slice(0, 5).map(food => ({
        foodId: food.id,
        suggestedUses: this.generateSuggestedUses(food)
      })),
      tips: currentTips.slice(0, 3).map(tip => tip.id),
      nutritionInfo: {
        seasonalPercentage: 80, // Beispielwert
        sustainabilityScore: 85, // Beispielwert
        costEstimate: {
          value: 50, // Beispielwert
          currency: 'EUR'
        }
      }
    };

    this.mealPlans.set(newPlan.id, newPlan);
    await this.saveMealPlans();
    return newPlan;
  }

  // Reports und Analysen
  async generateReport(profileId: string, startDate: string, endDate: string): Promise<SeasonalReport> {
    const newReport: SeasonalReport = {
      id: `report_${Date.now()}`,
      profileId,
      period: {
        start: startDate,
        end: endDate
      },
      seasonalityScore: 75, // Beispielwert
      usedSeasonalFoods: [], // Wird aus den Mahlzeiten-Logs generiert
      missedOpportunities: [], // Wird aus der Analyse generiert
      impact: {
        environmental: {
          co2Saved: 25.5, // Beispielwert in kg
          waterSaved: 1000 // Beispielwert in L
        },
        economic: {
          moneySaved: 30, // Beispielwert
          currency: 'EUR'
        }
      },
      recommendations: [
        {
          type: 'food',
          description: 'Mehr saisonales Gemüse in Ihre Mahlzeiten einbauen',
          potentialImpact: 'high'
        }
      ]
    };

    this.reports.set(newReport.id, newReport);
    await this.saveReports();
    return newReport;
  }

  // Private Hilfsmethoden
  private isFoodInSeason(food: SeasonalFood, month: Month): boolean {
    if (food.season.start <= food.season.end) {
      return month >= food.season.start && month <= food.season.end;
    } else {
      // Für Lebensmittel, die über den Jahreswechsel gehen
      return month >= food.season.start || month <= food.season.end;
    }
  }

  private getImportanceScore(importance: 'low' | 'medium' | 'high'): number {
    switch (importance) {
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
    }
  }

  private getCurrentWeek(): number {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now.getTime() - start.getTime();
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    return Math.ceil(diff / oneWeek);
  }

  private generateSuggestedUses(food: SeasonalFood): Array<{mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack', preparation: string}> {
    // Einfache Beispielimplementierung
    return [
      {
        mealType: 'lunch',
        preparation: food.preparation.methods[0] || 'Nach Belieben zubereiten'
      }
    ];
  }

  // Persistenz
  private async loadData(): Promise<void> {
    await Promise.all([
      this.loadFoods(),
      this.loadTips(),
      this.loadMealPlans(),
      this.loadReports()
    ]);
  }

  private async loadFoods(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('seasonal_foods');
      if (data) {
        const foods = JSON.parse(data);
        this.foods = new Map(Object.entries(foods));
      }
    } catch (error) {
      console.error('Fehler beim Laden der saisonalen Lebensmittel:', error);
    }
  }

  private async saveFoods(): Promise<void> {
    try {
      const data = Object.fromEntries(this.foods);
      await AsyncStorage.setItem('seasonal_foods', JSON.stringify(data));
    } catch (error) {
      console.error('Fehler beim Speichern der saisonalen Lebensmittel:', error);
    }
  }

  private async loadTips(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('seasonal_tips');
      if (data) {
        const tips = JSON.parse(data);
        this.tips = new Map(Object.entries(tips));
      }
    } catch (error) {
      console.error('Fehler beim Laden der saisonalen Tipps:', error);
    }
  }

  private async saveTips(): Promise<void> {
    try {
      const data = Object.fromEntries(this.tips);
      await AsyncStorage.setItem('seasonal_tips', JSON.stringify(data));
    } catch (error) {
      console.error('Fehler beim Speichern der saisonalen Tipps:', error);
    }
  }

  private async loadMealPlans(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('seasonal_meal_plans');
      if (data) {
        const plans = JSON.parse(data);
        this.mealPlans = new Map(Object.entries(plans));
      }
    } catch (error) {
      console.error('Fehler beim Laden der Wochenpläne:', error);
    }
  }

  private async saveMealPlans(): Promise<void> {
    try {
      const data = Object.fromEntries(this.mealPlans);
      await AsyncStorage.setItem('seasonal_meal_plans', JSON.stringify(data));
    } catch (error) {
      console.error('Fehler beim Speichern der Wochenpläne:', error);
    }
  }

  private async loadReports(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('seasonal_reports');
      if (data) {
        const reports = JSON.parse(data);
        this.reports = new Map(Object.entries(reports));
      }
    } catch (error) {
      console.error('Fehler beim Laden der Reports:', error);
    }
  }

  private async saveReports(): Promise<void> {
    try {
      const data = Object.fromEntries(this.reports);
      await AsyncStorage.setItem('seasonal_reports', JSON.stringify(data));
    } catch (error) {
      console.error('Fehler beim Speichern der Reports:', error);
    }
  }
}

export const seasonalFoodService = SeasonalFoodService.getInstance();