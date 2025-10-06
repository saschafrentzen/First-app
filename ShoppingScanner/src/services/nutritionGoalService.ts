import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  NutritionGoal, 
  NutritionProgress, 
  NutritionRecommendation,
  NutritionGoalValidation,
  NutritionGoalError
} from '../types/nutritionGoal';
import { StorageError } from '../types/errors';

const NUTRITION_GOALS_KEY = '@nutrition_goals';
const NUTRITION_PROGRESS_KEY = '@nutrition_progress';
const NUTRITION_RECOMMENDATIONS_KEY = '@nutrition_recommendations';

class NutritionGoalService {
  private static instance: NutritionGoalService;
  private goals: NutritionGoal[] = [];
  private progress: NutritionProgress[] = [];
  private recommendations: NutritionRecommendation[] = [];
  private initialized = false;

  private constructor() {}

  public static getInstance(): NutritionGoalService {
    if (!NutritionGoalService.instance) {
      NutritionGoalService.instance = new NutritionGoalService();
    }
    return NutritionGoalService.instance;
  }

  private async initialize() {
    if (this.initialized) return;

    try {
      // Lade Ziele
      const storedGoals = await AsyncStorage.getItem(NUTRITION_GOALS_KEY);
      this.goals = storedGoals ? JSON.parse(storedGoals) : [];

      // Lade Fortschritte
      const storedProgress = await AsyncStorage.getItem(NUTRITION_PROGRESS_KEY);
      this.progress = storedProgress ? JSON.parse(storedProgress) : [];

      // Lade Empfehlungen
      const storedRecommendations = await AsyncStorage.getItem(NUTRITION_RECOMMENDATIONS_KEY);
      this.recommendations = storedRecommendations ? JSON.parse(storedRecommendations) : [];

      this.initialized = true;
    } catch (error) {
      console.error('Fehler beim Initialisieren der Ernährungsziele:', error);
      throw new StorageError('Fehler beim Laden der Ernährungsziele');
    }
  }

  private async saveGoals() {
    try {
      await AsyncStorage.setItem(NUTRITION_GOALS_KEY, JSON.stringify(this.goals));
    } catch (error) {
      throw new StorageError('Fehler beim Speichern der Ernährungsziele');
    }
  }

  private async saveProgress() {
    try {
      await AsyncStorage.setItem(NUTRITION_PROGRESS_KEY, JSON.stringify(this.progress));
    } catch (error) {
      throw new StorageError('Fehler beim Speichern des Fortschritts');
    }
  }

  private async saveRecommendations() {
    try {
      await AsyncStorage.setItem(NUTRITION_RECOMMENDATIONS_KEY, JSON.stringify(this.recommendations));
    } catch (error) {
      throw new StorageError('Fehler beim Speichern der Empfehlungen');
    }
  }

  public async getAllGoals(): Promise<NutritionGoal[]> {
    await this.initialize();
    return [...this.goals];
  }

  public async getActiveGoals(): Promise<NutritionGoal[]> {
    await this.initialize();
    return this.goals.filter(goal => goal.active);
  }

  public async getGoalById(id: string): Promise<NutritionGoal | undefined> {
    await this.initialize();
    return this.goals.find(goal => goal.id === id);
  }

  public async createGoal(goal: Omit<NutritionGoal, 'id' | 'createdAt' | 'lastModified'>): Promise<NutritionGoal> {
    await this.initialize();
    
    const validation = await this.validateGoal(goal);
    if (!validation.isValid) {
      throw new Error(validation.errors[0].message);
    }

    const newGoal: NutritionGoal = {
      ...goal,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };

    this.goals.push(newGoal);
    await this.saveGoals();
    
    // Generiere initiale Empfehlungen für das neue Ziel
    await this.generateRecommendations(newGoal.id);
    
    return newGoal;
  }

  public async updateGoal(id: string, updates: Partial<NutritionGoal>): Promise<NutritionGoal> {
    await this.initialize();
    
    const index = this.goals.findIndex(goal => goal.id === id);
    if (index === -1) {
      throw new StorageError('Ernährungsziel nicht gefunden');
    }

    const updatedGoal = {
      ...this.goals[index],
      ...updates,
      lastModified: new Date().toISOString(),
    };

    const validation = await this.validateGoal(updatedGoal);
    if (!validation.isValid) {
      throw new Error(validation.errors[0].message);
    }

    this.goals[index] = updatedGoal;
    await this.saveGoals();
    
    // Aktualisiere Empfehlungen basierend auf den Änderungen
    await this.generateRecommendations(id);
    
    return updatedGoal;
  }

  public async deleteGoal(id: string): Promise<void> {
    await this.initialize();
    
    const index = this.goals.findIndex(goal => goal.id === id);
    if (index === -1) {
      throw new StorageError('Ernährungsziel nicht gefunden');
    }

    // Lösche zugehörige Fortschritte und Empfehlungen
    this.progress = this.progress.filter(p => p.goalId !== id);
    this.recommendations = this.recommendations.filter(r => r.goalId !== id);

    this.goals.splice(index, 1);
    
    await Promise.all([
      this.saveGoals(),
      this.saveProgress(),
      this.saveRecommendations()
    ]);
  }

  public async addProgress(progress: Omit<NutritionProgress, 'id'>): Promise<NutritionProgress> {
    await this.initialize();
    
    const goal = await this.getGoalById(progress.goalId);
    if (!goal) {
      throw new StorageError('Zugehöriges Ernährungsziel nicht gefunden');
    }

    const newProgress: NutritionProgress = {
      ...progress,
      id: Date.now().toString(),
    };

    this.progress.push(newProgress);
    await this.saveProgress();

    // Aktualisiere Empfehlungen basierend auf dem neuen Fortschritt
    await this.generateRecommendations(progress.goalId);
    
    return newProgress;
  }

  public async getProgressForGoal(goalId: string, startDate?: string, endDate?: string): Promise<NutritionProgress[]> {
    await this.initialize();
    
    let progress = this.progress.filter(p => p.goalId === goalId);
    
    if (startDate) {
      progress = progress.filter(p => p.date >= startDate);
    }
    
    if (endDate) {
      progress = progress.filter(p => p.date <= endDate);
    }
    
    return progress.sort((a, b) => a.date.localeCompare(b.date));
  }

  public async getRecommendations(goalId?: string): Promise<NutritionRecommendation[]> {
    await this.initialize();
    
    if (goalId) {
      return this.recommendations.filter(r => r.goalId === goalId && !r.completed);
    }
    
    return this.recommendations.filter(r => !r.completed);
  }

  private async generateRecommendations(goalId: string): Promise<void> {
    const goal = await this.getGoalById(goalId);
    if (!goal) return;

    const recentProgress = await this.getProgressForGoal(
      goalId,
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // Letzte 7 Tage
    );

    // Lösche alte Empfehlungen für dieses Ziel
    this.recommendations = this.recommendations.filter(r => r.goalId !== goalId);

    // Generiere neue Empfehlungen basierend auf Ziel und Fortschritt
    const newRecommendations: NutritionRecommendation[] = [];

    // TODO: Implementiere komplexere Logik für Empfehlungen
    // Beispiel für eine einfache Empfehlung:
    if (recentProgress.length === 0) {
      newRecommendations.push({
        id: Date.now().toString(),
        goalId,
        type: 'tip',
        title: 'Starten Sie die Verfolgung',
        description: 'Beginnen Sie damit, Ihre tägliche Aufnahme zu protokollieren.',
        priority: 'high',
        impact: 100,
        createdAt: new Date().toISOString(),
        completed: false
      });
    }

    this.recommendations.push(...newRecommendations);
    await this.saveRecommendations();
  }

  private async validateGoal(goal: Omit<NutritionGoal, 'id' | 'createdAt' | 'lastModified'>): Promise<NutritionGoalValidation> {
    const errors: NutritionGoalError[] = [];

    // Überprüfe realistische Zielwerte
    if (goal.type === 'calories') {
      if (goal.targetValue < 1200 || goal.targetValue > 4000) {
        errors.push({
          type: 'unrealistic-goal',
          message: 'Das Kalorienziel sollte zwischen 1200 und 4000 kcal liegen',
          goalId: ''
        });
      }
    }

    // Überprüfe auf Zielkonflikte
    const existingGoals = await this.getAllGoals();
    const conflictingGoal = existingGoals.find(
      g => g.type === goal.type && 
          g.period === goal.period && 
          g.active &&
          true // Bei der Validierung von neuen Zielen immer auf Konflikte prüfen
    );

    if (conflictingGoal) {
      errors.push({
        type: 'conflicting-goals',
        message: `Es existiert bereits ein aktives Ziel für ${goal.type} mit der gleichen Periode`,
        goalId: conflictingGoal.id
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export const nutritionGoalService = NutritionGoalService.getInstance();