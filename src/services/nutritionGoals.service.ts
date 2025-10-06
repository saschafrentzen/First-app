import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  NutritionProfile, 
  NutritionGoal, 
  DailyNutritionEntry, 
  NutritionProgress,
  NutritionInfo 
} from '../types/nutrition';

class NutritionGoalsService {
  private static instance: NutritionGoalsService;
  private profiles: Map<string, NutritionProfile> = new Map();
  private goals: Map<string, NutritionGoal> = new Map();
  private entries: Map<string, DailyNutritionEntry> = new Map();
  private progress: Map<string, NutritionProgress> = new Map();

  private constructor() {
    this.loadData();
  }

  static getInstance(): NutritionGoalsService {
    if (!NutritionGoalsService.instance) {
      NutritionGoalsService.instance = new NutritionGoalsService();
    }
    return NutritionGoalsService.instance;
  }

  // Profile-Management
  async createProfile(profile: Omit<NutritionProfile, 'id' | 'createdAt' | 'lastModified'>): Promise<NutritionProfile> {
    const newProfile: NutritionProfile = {
      ...profile,
      id: `profile_${Date.now()}`,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };

    this.profiles.set(newProfile.id, newProfile);
    await this.saveProfiles();
    return newProfile;
  }

  async updateProfile(profileId: string, updates: Partial<NutritionProfile>): Promise<NutritionProfile> {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      throw new Error('Profil nicht gefunden');
    }

    const updatedProfile = {
      ...profile,
      ...updates,
      lastModified: new Date().toISOString()
    };

    this.profiles.set(profileId, updatedProfile);
    await this.saveProfiles();
    return updatedProfile;
  }

  // Ziel-Management
  async getGoal(goalId: string): Promise<NutritionGoal | undefined> {
    return this.goals.get(goalId);
  }

  async getAllGoals(): Promise<Map<string, NutritionGoal>> {
    return this.goals;
  }

  async createGoal(goal: Omit<NutritionGoal, 'id' | 'metadata'>): Promise<NutritionGoal> {
    // Validiere, dass das Profil existiert
    if (!this.profiles.has(goal.profileId)) {
      throw new Error('Profil nicht gefunden');
    }

    const newGoal: NutritionGoal = {
      ...goal,
      id: `goal_${Date.now()}`,
      metadata: {
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      },
      progress: {
        percentage: 0,
        history: [],
        trend: 'stable'
      }
    };

    this.goals.set(newGoal.id, newGoal);
    await this.saveGoals();
    return newGoal;
  }

  async updateGoal(goalId: string, updates: Partial<NutritionGoal>): Promise<NutritionGoal> {
    const goal = this.goals.get(goalId);
    if (!goal) {
      throw new Error('Ziel nicht gefunden');
    }

    const updatedGoal = {
      ...goal,
      ...updates,
      metadata: {
        ...goal.metadata,
        lastModified: new Date().toISOString()
      }
    };

    this.goals.set(goalId, updatedGoal);
    await this.saveGoals();
    return updatedGoal;
  }

  // Tägliche Einträge
  async addDailyEntry(entry: Omit<DailyNutritionEntry, 'id'>): Promise<DailyNutritionEntry> {
    const newEntry: DailyNutritionEntry = {
      ...entry,
      id: `entry_${Date.now()}`
    };

    // Berechne die Gesamternährung für den Tag
    newEntry.totalDailyNutrition = this.calculateTotalNutrition(newEntry.meals);

    // Überprüfe die Ziele für den Tag
    newEntry.goals = await this.evaluateGoals(newEntry);

    this.entries.set(newEntry.id, newEntry);
    await this.saveEntries();
    return newEntry;
  }

  // Fortschrittsverfolgung
  async trackProgress(goalId: string, value: number, date: string = new Date().toISOString()): Promise<NutritionProgress> {
    const goal = this.goals.get(goalId);
    if (!goal) {
      throw new Error('Ziel nicht gefunden');
    }

    let progress = this.progress.get(goalId) || this.initializeProgress(goal);
    
    // Aktualisiere den Verlauf
    progress.history.push({
      date,
      value,
      deviation: value - goal.metrics.target
    });

    // Berechne neue Metriken
    progress.metrics = this.calculateMetrics(progress.history, goal);

    // Aktualisiere die Analyse
    progress.analysis = this.analyzeProgress(progress, goal);

    this.progress.set(goalId, progress);
    await this.saveProgress();

    // Aktualisiere auch das Ziel selbst
    await this.updateGoalProgress(goal, progress);

    return progress;
  }

  // Private Hilfsmethoden
  private calculateTotalNutrition(meals: DailyNutritionEntry['meals']): NutritionInfo {
    return meals.reduce((total, meal) => ({
      calories: (total.calories ?? 0) + (meal.totalNutrition.calories ?? 0),
      protein: (total.protein ?? 0) + (meal.totalNutrition.protein ?? 0),
      carbohydrates: (total.carbohydrates ?? 0) + (meal.totalNutrition.carbohydrates ?? 0),
      fat: (total.fat ?? 0) + (meal.totalNutrition.fat ?? 0),
      fiber: (total.fiber ?? 0) + (meal.totalNutrition.fiber ?? 0),
      sugar: (total.sugar ?? 0) + (meal.totalNutrition.sugar ?? 0),
      sodium: (total.sodium ?? 0) + (meal.totalNutrition.sodium ?? 0)
    }), {
      calories: 0,
      protein: 0,
      carbohydrates: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0
    });
  }

  private async evaluateGoals(entry: DailyNutritionEntry): Promise<DailyNutritionEntry['goals']> {
    const profile = this.profiles.get(entry.profileId);
    if (!profile) {
      return [];
    }

    const activeGoals = Array.from(this.goals.values())
      .filter(goal => goal.profileId === profile.id && goal.status === 'active');

    return activeGoals.map(goal => {
      const actual = this.calculateActualValue(goal, entry);
      const planned = goal.metrics.target;

      return {
        goalId: goal.id,
        planned,
        actual,
        status: this.determineGoalStatus(actual, planned, goal.metrics)
      };
    });
  }

  private calculateActualValue(goal: NutritionGoal, entry: DailyNutritionEntry): number {
    switch (goal.type) {
      case 'macro':
        if (goal.nutritionTargets?.macronutrients?.protein) {
          return entry.totalDailyNutrition.protein;
        }
        if (goal.nutritionTargets?.macronutrients?.carbohydrates) {
          return entry.totalDailyNutrition.carbohydrates;
        }
        if (goal.nutritionTargets?.macronutrients?.fat) {
          return entry.totalDailyNutrition.fat;
        }
        return 0;
      case 'weight':
        // Gewichtsziele werden separat getrackt
        return goal.metrics.current;
      default:
        return 0;
    }
  }

  private determineGoalStatus(actual: number, planned: number, metrics: NutritionGoal['metrics']): 'met' | 'notMet' | 'exceeded' {
    const tolerance = 0.05; // 5% Toleranz
    const lowerBound = planned * (1 - tolerance);
    const upperBound = planned * (1 + tolerance);

    if (metrics.minimum !== undefined && actual < metrics.minimum) return 'notMet';
    if (metrics.maximum !== undefined && actual > metrics.maximum) return 'exceeded';

    if (actual >= lowerBound && actual <= upperBound) return 'met';
    return actual < planned ? 'notMet' : 'exceeded';
  }

  private initializeProgress(goal: NutritionGoal): NutritionProgress {
    return {
      id: `progress_${goal.id}`,
      profileId: goal.profileId,
      goalId: goal.id,
      period: {
        start: goal.startDate,
        end: goal.targetDate || new Date().toISOString()
      },
      metrics: {
        planned: goal.metrics.target,
        actual: goal.metrics.current,
        average: goal.metrics.current,
        trend: 'stable'
      },
      history: [],
      analysis: {
        successRate: 0,
        consistencyScore: 0,
        challengingDays: []
      }
    };
  }

  private calculateMetrics(history: NutritionProgress['history'], goal: NutritionGoal): NutritionProgress['metrics'] {
    if (history.length === 0) {
      return {
        planned: goal.metrics.target,
        actual: goal.metrics.current,
        average: goal.metrics.current,
        trend: 'stable'
      };
    }

    const values = history.map(h => h.value);
    const actual = values[values.length - 1];
    const average = values.reduce((a, b) => a + b) / values.length;
    
    // Trendberechnung
    const trend = this.calculateTrend(values);

    return {
      planned: goal.metrics.target,
      actual,
      average,
      trend
    };
  }

  private calculateTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (values.length < 2) return 'stable';

    const recentValues = values.slice(-3); // Betrachte die letzten 3 Werte
    const changes = recentValues.slice(1).map((value, index) => value - recentValues[index]);
    const averageChange = changes.reduce((a, b) => a + b) / changes.length;

    if (Math.abs(averageChange) < 0.01) return 'stable'; // Toleranzbereich
    return averageChange > 0 ? 'increasing' : 'decreasing';
  }

  private analyzeProgress(progress: NutritionProgress, goal: NutritionGoal): NutritionProgress['analysis'] {
    const history = progress.history;
    if (history.length === 0) {
      return {
        successRate: 0,
        consistencyScore: 0,
        challengingDays: []
      };
    }

    // Erfolgsrate berechnen
    const successfulDays = history.filter(day => 
      Math.abs(day.deviation) <= goal.metrics.target * 0.05 // 5% Toleranz
    ).length;
    const successRate = successfulDays / history.length;

    // Konsistenz berechnen
    const deviations = history.map(day => Math.abs(day.deviation));
    const averageDeviation = deviations.reduce((a, b) => a + b) / deviations.length;
    const consistencyScore = Math.max(0, 1 - (averageDeviation / goal.metrics.target));

    // Schwierige Tage identifizieren
    const challengingDays = history
      .filter(day => Math.abs(day.deviation) > goal.metrics.target * 0.1) // 10% Abweichung
      .map(day => day.date);

    return {
      successRate,
      consistencyScore,
      challengingDays,
      recommendations: this.generateRecommendations(successRate, consistencyScore, goal)
    };
  }

  private generateRecommendations(successRate: number, consistencyScore: number, goal: NutritionGoal): string[] {
    const recommendations: string[] = [];

    if (successRate < 0.5) {
      recommendations.push('Überdenken Sie Ihr Ziel - es könnte zu ambitioniert sein.');
    }
    if (consistencyScore < 0.7) {
      recommendations.push('Versuchen Sie, regelmäßiger zu tracken und kleine Fortschritte zu feiern.');
    }
    if (goal.tracking.reminder && successRate < 0.8) {
      recommendations.push('Aktivieren Sie Erinnerungen, um keine Einträge zu verpassen.');
    }

    return recommendations;
  }

  private async updateGoalProgress(goal: NutritionGoal, progress: NutritionProgress): Promise<void> {
    const updatedGoal: NutritionGoal = {
      ...goal,
      progress: {
        percentage: (progress.metrics.actual / goal.metrics.target) * 100,
        history: progress.history.map(h => ({
          date: h.date,
          value: h.value
        })),
        trend: progress.metrics.trend
      },
      metadata: {
        ...goal.metadata,
        lastModified: new Date().toISOString()
      }
    };

    this.goals.set(goal.id, updatedGoal);
    await this.saveGoals();
  }

  // Persistenz
  private async loadData(): Promise<void> {
    await Promise.all([
      this.loadProfiles(),
      this.loadGoals(),
      this.loadEntries(),
      this.loadProgress()
    ]);
  }

  private async loadProfiles(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('nutrition_profiles');
      if (data) {
        const profiles = JSON.parse(data);
        this.profiles = new Map(Object.entries(profiles));
      }
    } catch (error) {
      console.error('Fehler beim Laden der Profile:', error);
    }
  }

  private async saveProfiles(): Promise<void> {
    try {
      const data = Object.fromEntries(this.profiles);
      await AsyncStorage.setItem('nutrition_profiles', JSON.stringify(data));
    } catch (error) {
      console.error('Fehler beim Speichern der Profile:', error);
    }
  }

  private async loadGoals(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('nutrition_goals');
      if (data) {
        const goals = JSON.parse(data);
        this.goals = new Map(Object.entries(goals));
      }
    } catch (error) {
      console.error('Fehler beim Laden der Ziele:', error);
    }
  }

  private async saveGoals(): Promise<void> {
    try {
      const data = Object.fromEntries(this.goals);
      await AsyncStorage.setItem('nutrition_goals', JSON.stringify(data));
    } catch (error) {
      console.error('Fehler beim Speichern der Ziele:', error);
    }
  }

  private async loadEntries(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('nutrition_entries');
      if (data) {
        const entries = JSON.parse(data);
        this.entries = new Map(Object.entries(entries));
      }
    } catch (error) {
      console.error('Fehler beim Laden der Einträge:', error);
    }
  }

  private async saveEntries(): Promise<void> {
    try {
      const data = Object.fromEntries(this.entries);
      await AsyncStorage.setItem('nutrition_entries', JSON.stringify(data));
    } catch (error) {
      console.error('Fehler beim Speichern der Einträge:', error);
    }
  }

  private async loadProgress(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('nutrition_progress');
      if (data) {
        const progress = JSON.parse(data);
        this.progress = new Map(Object.entries(progress));
      }
    } catch (error) {
      console.error('Fehler beim Laden des Fortschritts:', error);
    }
  }

  private async saveProgress(): Promise<void> {
    try {
      const data = Object.fromEntries(this.progress);
      await AsyncStorage.setItem('nutrition_progress', JSON.stringify(data));
    } catch (error) {
      console.error('Fehler beim Speichern des Fortschritts:', error);
    }
  }
}

export const nutritionGoalsService = NutritionGoalsService.getInstance();