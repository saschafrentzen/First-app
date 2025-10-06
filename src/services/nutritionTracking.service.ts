import { DailyNutritionEntry, NutritionGoal, NutritionProgress } from '../types/nutrition';
import { nutritionGoalsService } from './nutritionGoals.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ProgressMetrics {
  daily: {
    average: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    consistency: number;
  };
  weekly: {
    average: number;
    bestDay: string;
    worstDay: string;
  };
  monthly: {
    average: number;
    improvement: number;
    challengingWeeks: string[];
  };
}

interface TrackingInsights {
  successRate: number;
  streaks: {
    current: number;
    longest: number;
  };
  patterns: {
    strongDays: string[];
    weakDays: string[];
    recommendations: string[];
  };
}

class NutritionTrackingService {
  private static instance: NutritionTrackingService;
  private trackingData: Map<string, NutritionProgress> = new Map();
  private insights: Map<string, TrackingInsights> = new Map();

  private constructor() {
    this.loadTrackingData();
  }

  static getInstance(): NutritionTrackingService {
    if (!NutritionTrackingService.instance) {
      NutritionTrackingService.instance = new NutritionTrackingService();
    }
    return NutritionTrackingService.instance;
  }

  // Hauptfunktionen für das Tracking
  async trackDailyProgress(entry: DailyNutritionEntry): Promise<void> {
    const date = new Date().toISOString().split('T')[0];
    const goals = entry.goals;

    for (const goal of goals) {
      const progress = this.trackingData.get(goal.goalId) || await this.initializeProgress(goal.goalId);
      
      // Aktualisiere den Fortschritt
      progress.history.push({
        date,
        value: goal.actual,
        deviation: goal.actual - goal.planned
      });

      // Aktualisiere Metriken und Analysen
      await this.updateProgressMetrics(progress);
      await this.updateTrackingInsights(goal.goalId);
      
      this.trackingData.set(goal.goalId, progress);
    }

    await this.saveTrackingData();
  }

  async getProgressReport(goalId: string, timeframe: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<ProgressMetrics> {
    const progress = this.trackingData.get(goalId);
    if (!progress) {
      throw new Error('Keine Trackingdaten gefunden');
    }

    return {
      daily: await this.calculateDailyMetrics(progress),
      weekly: await this.calculateWeeklyMetrics(progress),
      monthly: await this.calculateMonthlyMetrics(progress)
    };
  }

  async getTrackingInsights(goalId: string): Promise<TrackingInsights> {
    const insights = this.insights.get(goalId);
    if (!insights) {
      throw new Error('Keine Insights gefunden');
    }
    return insights;
  }

  async getProgress(goalId: string): Promise<NutritionProgress> {
    const progress = this.trackingData.get(goalId);
    if (!progress) {
      throw new Error('Keine Fortschrittsdaten gefunden');
    }
    return progress;
  }

  // Private Hilfsmethoden
  private async initializeProgress(goalId: string): Promise<NutritionProgress> {
    const goal = await nutritionGoalsService.getGoal(goalId);
    if (!goal) {
      throw new Error('Ziel nicht gefunden');
    }

    return {
      id: `progress_${goalId}`,
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

  private async updateProgressMetrics(progress: NutritionProgress): Promise<void> {
    const history = progress.history;
    const goal = await nutritionGoalsService.getGoal(progress.goalId);

    if (!goal || history.length === 0) return;

    const values = history.map(h => h.value);
    const recent = values.slice(-7); // Letzte 7 Tage

    progress.metrics = {
      planned: goal.metrics.target,
      actual: values[values.length - 1],
      average: this.calculateAverage(recent),
      trend: this.determineTrend(recent)
    };

    // Aktualisiere die Analyse
    progress.analysis = {
      successRate: this.calculateSuccessRate(history, goal),
      consistencyScore: this.calculateConsistencyScore(history, goal),
      challengingDays: this.identifyChallengingDays(history, goal)
    };
  }

  private async updateTrackingInsights(goalId: string): Promise<void> {
    const progress = this.trackingData.get(goalId);
    const goal = await nutritionGoalsService.getGoal(goalId);

    if (!progress || !goal) return;

    const history = progress.history;
    const insights: TrackingInsights = {
      successRate: this.calculateSuccessRate(history, goal),
      streaks: this.calculateStreaks(history, goal),
      patterns: await this.analyzePatterns(history, goal)
    };

    this.insights.set(goalId, insights);
  }

  private calculateAverage(values: number[]): number {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private determineTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (values.length < 2) return 'stable';

    const changes = values.slice(1).map((val, i) => val - values[i]);
    const avgChange = this.calculateAverage(changes);

    if (Math.abs(avgChange) < 0.05) return 'stable';
    return avgChange > 0 ? 'increasing' : 'decreasing';
  }

  private calculateSuccessRate(history: NutritionProgress['history'], goal: NutritionGoal): number {
    const successfulDays = history.filter(day => 
      Math.abs(day.deviation) <= goal.metrics.target * 0.05
    ).length;
    return successfulDays / history.length;
  }

  private calculateConsistencyScore(history: NutritionProgress['history'], goal: NutritionGoal): number {
    const deviations = history.map(day => Math.abs(day.deviation));
    const avgDeviation = this.calculateAverage(deviations);
    return Math.max(0, 1 - (avgDeviation / goal.metrics.target));
  }

  private identifyChallengingDays(history: NutritionProgress['history'], goal: NutritionGoal): string[] {
    return history
      .filter(day => Math.abs(day.deviation) > goal.metrics.target * 0.1)
      .map(day => day.date);
  }

  private calculateStreaks(history: NutritionProgress['history'], goal: NutritionGoal): TrackingInsights['streaks'] {
    let currentStreak = 0;
    let longestStreak = 0;
    let streak = 0;

    history.forEach(day => {
      if (Math.abs(day.deviation) <= goal.metrics.target * 0.05) {
        streak++;
        if (streak > longestStreak) longestStreak = streak;
      } else {
        streak = 0;
      }
    });

    currentStreak = streak;

    return {
      current: currentStreak,
      longest: longestStreak
    };
  }

  private async analyzePatterns(history: NutritionProgress['history'], goal: NutritionGoal): Promise<TrackingInsights['patterns']> {
    const dayPerformance = new Map<string, number[]>();
    
    history.forEach(entry => {
      const dayOfWeek = new Date(entry.date).getDay();
      const perf = dayPerformance.get(dayOfWeek.toString()) || [];
      perf.push(Math.abs(entry.deviation));
      dayPerformance.set(dayOfWeek.toString(), perf);
    });

    const dayAnalysis = Array.from(dayPerformance.entries()).map(([day, deviations]) => ({
      day,
      avgDeviation: this.calculateAverage(deviations)
    }));

    const sortedDays = dayAnalysis.sort((a, b) => a.avgDeviation - b.avgDeviation);

    return {
      strongDays: [sortedDays[0]?.day, sortedDays[1]?.day].filter(Boolean),
      weakDays: [sortedDays[sortedDays.length - 1]?.day, sortedDays[sortedDays.length - 2]?.day].filter(Boolean),
      recommendations: this.generateRecommendations(sortedDays, goal)
    };
  }

  private generateRecommendations(dayAnalysis: { day: string; avgDeviation: number }[], goal: NutritionGoal): string[] {
    const recommendations: string[] = [];
    const weakestDay = dayAnalysis[dayAnalysis.length - 1];

    if (weakestDay) {
      recommendations.push(`Planen Sie besonders ${this.getDayName(weakestDay.day)} besser vor`);
    }

    const consistencyThreshold = goal.metrics.target * 0.15;
    const inconsistentDays = dayAnalysis.filter(d => d.avgDeviation > consistencyThreshold);
    
    if (inconsistentDays.length > 2) {
      recommendations.push('Versuchen Sie, Ihre Routine an verschiedenen Wochentagen konstanter zu gestalten');
    }

    return recommendations;
  }

  private getDayName(day: string): string {
    const days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    return days[parseInt(day)];
  }

  private async calculateDailyMetrics(progress: NutritionProgress): Promise<ProgressMetrics['daily']> {
    const recentHistory = progress.history.slice(-7);
    const goal = await nutritionGoalsService.getGoal(progress.goalId);
    if (!goal) {
      throw new Error('Ziel nicht gefunden');
    }
    
    return {
      average: this.calculateAverage(recentHistory.map(h => h.value)),
      trend: this.determineTrend(recentHistory.map(h => h.value)),
      consistency: this.calculateConsistencyScore(recentHistory, goal)
    };
  }

  private async calculateWeeklyMetrics(progress: NutritionProgress): Promise<ProgressMetrics['weekly']> {
    const weeklyData = progress.history.slice(-7);
    const values = weeklyData.map(h => h.value);
    
    return {
      average: this.calculateAverage(values),
      bestDay: weeklyData[values.indexOf(Math.max(...values))]?.date || '',
      worstDay: weeklyData[values.indexOf(Math.min(...values))]?.date || ''
    };
  }

  private async calculateMonthlyMetrics(progress: NutritionProgress): Promise<ProgressMetrics['monthly']> {
    const monthlyData = progress.history.slice(-30);
    const values = monthlyData.map(h => h.value);
    
    // Teile in Wochen auf
    const weeks: number[][] = [];
    for (let i = 0; i < values.length; i += 7) {
      weeks.push(values.slice(i, i + 7));
    }

    const weeklyAverages = weeks.map(week => this.calculateAverage(week));
    const improvement = weeklyAverages.length > 1 
      ? (weeklyAverages[weeklyAverages.length - 1] - weeklyAverages[0]) / weeklyAverages[0]
      : 0;

    const challengingWeeks = weeks
      .map((week, index) => ({
        index,
        consistency: this.calculateWeekConsistency(week)
      }))
      .filter(week => week.consistency < 0.7)
      .map(week => `Woche ${week.index + 1}`);

    return {
      average: this.calculateAverage(values),
      improvement: improvement * 100, // Als Prozentsatz
      challengingWeeks
    };
  }

  private calculateWeekConsistency(values: number[]): number {
    if (values.length === 0) return 0;
    const avg = this.calculateAverage(values);
    const deviations = values.map(v => Math.abs(v - avg));
    const avgDeviation = this.calculateAverage(deviations);
    return Math.max(0, 1 - (avgDeviation / avg));
  }

  // Persistenz
  private async loadTrackingData(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('nutrition_tracking');
      if (data) {
        const parsed = JSON.parse(data);
        this.trackingData = new Map(Object.entries(parsed));
      }

      const insightsData = await AsyncStorage.getItem('nutrition_insights');
      if (insightsData) {
        const parsed = JSON.parse(insightsData);
        this.insights = new Map(Object.entries(parsed));
      }
    } catch (error) {
      console.error('Fehler beim Laden der Trackingdaten:', error);
    }
  }

  private async saveTrackingData(): Promise<void> {
    try {
      const trackingData = Object.fromEntries(this.trackingData);
      await AsyncStorage.setItem('nutrition_tracking', JSON.stringify(trackingData));

      const insightsData = Object.fromEntries(this.insights);
      await AsyncStorage.setItem('nutrition_insights', JSON.stringify(insightsData));
    } catch (error) {
      console.error('Fehler beim Speichern der Trackingdaten:', error);
    }
  }
}

export const nutritionTrackingService = NutritionTrackingService.getInstance();