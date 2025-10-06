import { NutritionGoal, NutritionProgress, NutritionProfile, DailyNutritionEntry } from '../types/nutrition';
import { nutritionGoalsService } from './nutritionGoals.service';
import { nutritionTrackingService } from './nutritionTracking.service';

interface Recommendation {
  id: string;
  type: 'habit' | 'adjustment' | 'milestone' | 'warning' | 'tip';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action?: string;
  metadata: {
    createdAt: string;
    expiresAt?: string;
    source: 'tracking' | 'pattern' | 'milestone' | 'analysis';
    context?: {
      goalId?: string;
      metric?: string;
      threshold?: number;
    };
  };
}

class NutritionRecommendationService {
  private static instance: NutritionRecommendationService;
  private recommendations: Map<string, Recommendation[]> = new Map();
  
  private constructor() {}

  static getInstance(): NutritionRecommendationService {
    if (!NutritionRecommendationService.instance) {
      NutritionRecommendationService.instance = new NutritionRecommendationService();
    }
    return NutritionRecommendationService.instance;
  }

  async generateRecommendations(profileId: string): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];
    
    // Lade alle aktiven Ziele für das Profil
    const goals = await this.getActiveGoals(profileId);
    
    for (const goal of goals) {
      const progress = await nutritionTrackingService.getProgress(goal.id);
      
      // Generiere verschiedene Arten von Empfehlungen
      recommendations.push(
        ...(await this.generateTrackingBasedRecommendations(goal, progress)),
        ...(await this.generatePatternBasedRecommendations(goal, progress)),
        ...(await this.generateMilestoneRecommendations(goal, progress)),
        ...(await this.generateAdjustmentRecommendations(goal, progress))
      );
    }

    // Speichere die neuen Empfehlungen
    this.recommendations.set(profileId, this.filterAndPrioritize(recommendations));
    
    return this.recommendations.get(profileId) || [];
  }

  private async getActiveGoals(profileId: string): Promise<NutritionGoal[]> {
    const goalsMap = await nutritionGoalsService.getAllGoals();
    const goals = Array.from(goalsMap.values());
    return goals.filter(goal => goal.profileId === profileId && goal.status === 'active');
  }

  private async generateTrackingBasedRecommendations(
    goal: NutritionGoal,
    progress: NutritionProgress
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];
    
    // Analysiere Tracking-Konsistenz
    if (progress.analysis.consistencyScore < 0.7) {
      recommendations.push({
        id: `track_${goal.id}_${Date.now()}`,
        type: 'habit',
        priority: 'high',
        title: 'Tracking-Konsistenz verbessern',
        description: 'Regelmäßiges Tracking hilft dir, deine Ziele besser zu erreichen.',
        action: 'Aktiviere Erinnerungen für das tägliche Tracking',
        metadata: {
          createdAt: new Date().toISOString(),
          source: 'tracking',
          context: {
            goalId: goal.id,
            metric: 'consistencyScore',
            threshold: 0.7
          }
        }
      });
    }

    // Analysiere Erfolgsrate
    if (progress.analysis.successRate < 0.5) {
      recommendations.push({
        id: `success_${goal.id}_${Date.now()}`,
        type: 'adjustment',
        priority: 'high',
        title: 'Zielanpassung empfohlen',
        description: 'Dein aktuelles Ziel könnte zu ambitioniert sein.',
        action: 'Überdenke dein Ziel oder teile es in kleinere Zwischenziele auf',
        metadata: {
          createdAt: new Date().toISOString(),
          source: 'analysis',
          context: {
            goalId: goal.id,
            metric: 'successRate',
            threshold: 0.5
          }
        }
      });
    }

    return recommendations;
  }

  private async generatePatternBasedRecommendations(
    goal: NutritionGoal,
    progress: NutritionProgress
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];
    
    // Analysiere Wochentags-Muster
    const insights = await nutritionTrackingService.getTrackingInsights(goal.id);
    if (insights.patterns.weakDays.length > 0) {
      const weakDays = insights.patterns.weakDays.map(this.getDayName).join(', ');
      recommendations.push({
        id: `pattern_${goal.id}_${Date.now()}`,
        type: 'tip',
        priority: 'medium',
        title: 'Herausfordernde Tage identifiziert',
        description: `${weakDays} scheinen besonders herausfordernd zu sein.`,
        action: 'Plane diese Tage besonders sorgfältig vor',
        metadata: {
          createdAt: new Date().toISOString(),
          source: 'pattern',
          context: {
            goalId: goal.id
          }
        }
      });
    }

    // Analysiere Tageszeit-Muster (falls verfügbar)
    if (goal.tracking.reminderTime) {
      recommendations.push({
        id: `timing_${goal.id}_${Date.now()}`,
        type: 'habit',
        priority: 'medium',
        title: 'Optimale Tageszeit nutzen',
        description: 'Du erreichst deine Ziele häufiger zu bestimmten Tageszeiten.',
        action: `Versuche, deine Mahlzeiten um ${goal.tracking.reminderTime} zu planen`,
        metadata: {
          createdAt: new Date().toISOString(),
          source: 'pattern',
          context: {
            goalId: goal.id
          }
        }
      });
    }

    return recommendations;
  }

  private async generateMilestoneRecommendations(
    goal: NutritionGoal,
    progress: NutritionProgress
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // Prüfe auf erreichte Meilensteine
    if (progress.metrics.actual >= goal.metrics.target) {
      recommendations.push({
        id: `milestone_${goal.id}_${Date.now()}`,
        type: 'milestone',
        priority: 'medium',
        title: 'Ziel erreicht! 🎉',
        description: 'Du hast dein Ziel erreicht. Möchtest du es anpassen?',
        action: 'Setze dir ein neues, herausforderndes Ziel',
        metadata: {
          createdAt: new Date().toISOString(),
          source: 'milestone',
          context: {
            goalId: goal.id
          }
        }
      });
    }

    // Prüfe auf Zwischenmeilensteine
    const progressPercentage = (progress.metrics.actual / goal.metrics.target) * 100;
    if (progressPercentage >= 50 && progressPercentage < 75) {
      recommendations.push({
        id: `progress_${goal.id}_${Date.now()}`,
        type: 'milestone',
        priority: 'low',
        title: 'Halbzeit erreicht!',
        description: 'Du bist auf einem guten Weg. Weiter so!',
        metadata: {
          createdAt: new Date().toISOString(),
          source: 'milestone',
          context: {
            goalId: goal.id
          }
        }
      });
    }

    return recommendations;
  }

  private async generateAdjustmentRecommendations(
    goal: NutritionGoal,
    progress: NutritionProgress
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // Prüfe auf notwendige Zielanpassungen
    if (progress.analysis.consistencyScore < 0.5 && progress.history.length >= 14) {
      const avgValue = progress.metrics.average;
      const targetValue = goal.metrics.target;
      const suggestedTarget = Math.round((avgValue + targetValue) / 2);

      recommendations.push({
        id: `adjust_${goal.id}_${Date.now()}`,
        type: 'adjustment',
        priority: 'high',
        title: 'Zielanpassung vorgeschlagen',
        description: `Basierend auf deinen Daten könnte ein Zielwert von ${suggestedTarget} realistischer sein.`,
        action: 'Passe dein Ziel an deine aktuelle Leistung an',
        metadata: {
          createdAt: new Date().toISOString(),
          source: 'analysis',
          context: {
            goalId: goal.id,
            metric: 'consistencyScore',
            threshold: 0.5
          }
        }
      });
    }

    // Prüfe auf Langzeit-Trends
    if (progress.metrics.trend === 'decreasing' && progress.history.length >= 30) {
      recommendations.push({
        id: `trend_${goal.id}_${Date.now()}`,
        type: 'warning',
        priority: 'high',
        title: 'Negativer Trend erkannt',
        description: 'Deine Werte zeigen einen abnehmenden Trend über die letzten 30 Tage.',
        action: 'Überprüfe deine Strategie und passe sie bei Bedarf an',
        metadata: {
          createdAt: new Date().toISOString(),
          source: 'analysis',
          context: {
            goalId: goal.id
          }
        }
      });
    }

    return recommendations;
  }

  private filterAndPrioritize(recommendations: Recommendation[]): Recommendation[] {
    // Entferne Duplikate basierend auf ähnlichen Empfehlungen
    const uniqueRecommendations = this.removeDuplicates(recommendations);
    
    // Sortiere nach Priorität
    return uniqueRecommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  private removeDuplicates(recommendations: Recommendation[]): Recommendation[] {
    const seen = new Set<string>();
    return recommendations.filter(rec => {
      const key = `${rec.type}_${rec.title}_${rec.metadata.context?.goalId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private getDayName(day: string): string {
    const days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    return days[parseInt(day)] || day;
  }

  // Öffentliche Methoden für den Zugriff auf Empfehlungen
  async getRecommendations(profileId: string): Promise<Recommendation[]> {
    // Generiere neue Empfehlungen falls keine vorhanden
    if (!this.recommendations.has(profileId)) {
      await this.generateRecommendations(profileId);
    }
    return this.recommendations.get(profileId) || [];
  }

  async getRecommendationsByType(
    profileId: string,
    type: Recommendation['type']
  ): Promise<Recommendation[]> {
    const allRecs = await this.getRecommendations(profileId);
    return allRecs.filter(rec => rec.type === type);
  }

  async getHighPriorityRecommendations(profileId: string): Promise<Recommendation[]> {
    const allRecs = await this.getRecommendations(profileId);
    return allRecs.filter(rec => rec.priority === 'high');
  }
}

export const nutritionRecommendationService = NutritionRecommendationService.getInstance();