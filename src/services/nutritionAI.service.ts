import { DailyNutritionEntry, NutritionGoal, NutritionProfile, NutritionProgress, NutritionInfo } from '../types/nutrition';
import { nutritionGoalsService } from './nutritionGoals.service';
import { nutritionTrackingService } from './nutritionTracking.service';
import { nutritionRecommendationService } from './nutritionRecommendation.service';

interface NutritionInsight {
  id: string;
  type: 'pattern' | 'correlation' | 'prediction' | 'anomaly' | 'trend';
  confidence: number;
  description: string;
  data: {
    metric: string;
    value: number;
    context?: any;
  };
  metadata: {
    generatedAt: string;
    validUntil?: string;
    source: 'ml' | 'analysis' | 'pattern';
    model?: string;
  };
}

interface NutritionPrediction {
  metric: string;
  predictedValue: number;
  confidence: number;
  factors: Array<{
    name: string;
    impact: number;
  }>;
  timeframe: 'short' | 'medium' | 'long';
}

interface AnalysisResult {
  insights: NutritionInsight[];
  predictions: NutritionPrediction[];
  correlations: Array<{
    factor1: string;
    factor2: string;
    strength: number;
    direction: 'positive' | 'negative';
  }>;
  patterns: Array<{
    type: string;
    description: string;
    confidence: number;
    supportingData: any;
  }>;
}

class NutritionAIService {
  private static instance: NutritionAIService;
  private insights: Map<string, NutritionInsight[]> = new Map();
  private modelCache: Map<string, any> = new Map();
  
  private constructor() {}

  static getInstance(): NutritionAIService {
    if (!NutritionAIService.instance) {
      NutritionAIService.instance = new NutritionAIService();
    }
    return NutritionAIService.instance;
  }

  async analyzeNutrition(profileId: string): Promise<AnalysisResult> {
    // Sammle alle relevanten Daten
    const data = await this.gatherData(profileId);
    
    // Führe verschiedene Analysen parallel durch
    const [insights, predictions, correlations, patterns] = await Promise.all([
      this.generateInsights(data),
      this.generatePredictions(data),
      this.findCorrelations(data),
      this.detectPatterns(data)
    ]);

    // Speichere neue Insights
    this.insights.set(profileId, insights);

    return {
      insights,
      predictions,
      correlations,
      patterns
    };
  }

  private async gatherData(profileId: string) {
    const goals = await this.getActiveGoals(profileId);
    const entries = await this.getRecentEntries(profileId);
    const progress = await this.getAllProgress(goals.map(g => g.id));

    return {
      goals,
      entries,
      progress,
      profileId
    };
  }

  private async generateInsights(data: any): Promise<NutritionInsight[]> {
    const insights: NutritionInsight[] = [];

    // Analysiere Ernährungsmuster
    const nutritionPatterns = await this.analyzeMealPatterns(data.entries);
    if (nutritionPatterns) {
      insights.push({
        id: `pattern_${Date.now()}`,
        type: 'pattern',
        confidence: nutritionPatterns.confidence,
        description: nutritionPatterns.description,
        data: {
          metric: 'meal_pattern',
          value: nutritionPatterns.score,
          context: nutritionPatterns.details
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          source: 'analysis'
        }
      });
    }

    // Identifiziere Trends
    const trends = await this.analyzeTrends(data.progress);
    trends.forEach(trend => {
      insights.push({
        id: `trend_${Date.now()}_${trend.metric}`,
        type: 'trend',
        confidence: trend.confidence,
        description: trend.description,
        data: {
          metric: trend.metric,
          value: trend.value,
          context: trend.context
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          source: 'ml',
          model: 'trend_analysis_v1'
        }
      });
    });

    // Erkenne Anomalien
    const anomalies = await this.detectAnomalies(data.entries);
    anomalies.forEach(anomaly => {
      insights.push({
        id: `anomaly_${Date.now()}_${anomaly.metric}`,
        type: 'anomaly',
        confidence: anomaly.confidence,
        description: anomaly.description,
        data: {
          metric: anomaly.metric,
          value: anomaly.value,
          context: anomaly.context
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          source: 'ml',
          model: 'anomaly_detection_v1'
        }
      });
    });

    return insights;
  }

  private async generatePredictions(data: any): Promise<NutritionPrediction[]> {
    const predictions: NutritionPrediction[] = [];

    // Vorhersage für verschiedene Metriken
    const metrics = ['calories', 'protein', 'carbohydrates', 'fat'];
    
    for (const metric of metrics) {
      const prediction = await this.predictMetric(metric, data);
      if (prediction) {
        predictions.push({
          metric,
          predictedValue: prediction.value,
          confidence: prediction.confidence,
          factors: prediction.factors,
          timeframe: prediction.timeframe
        });
      }
    }

    return predictions;
  }

  private async findCorrelations(data: any) {
    const correlations = [];
    const metrics = ['calories', 'protein', 'carbohydrates', 'fat'];
    const factors = ['time_of_day', 'day_of_week', 'meal_size', 'activity_level'];

    for (const metric of metrics) {
      for (const factor of factors) {
        const correlation = await this.analyzeCorrelation(metric, factor, data.entries);
        if (correlation.strength > 0.5) { // Nur starke Korrelationen
          correlations.push({
            factor1: metric,
            factor2: factor,
            strength: correlation.strength,
            direction: correlation.direction
          });
        }
      }
    }

    return correlations;
  }

  private async detectPatterns(data: any) {
    const patterns = [];

    // Zeitliche Muster
    const temporalPatterns = await this.analyzeMealPatterns(data.entries);
    if (temporalPatterns && temporalPatterns.confidence > 0.7) {
      patterns.push({
        type: 'temporal',
        description: temporalPatterns.description,
        confidence: temporalPatterns.confidence,
        supportingData: temporalPatterns.details
      });
    }

    // Ernährungsmuster
    const nutritionPatterns = await this.analyzeMealPatterns(data.entries);
    if (nutritionPatterns && nutritionPatterns.confidence > 0.7) {
      patterns.push({
        type: 'nutrition',
        description: nutritionPatterns.description,
        confidence: nutritionPatterns.confidence,
        supportingData: nutritionPatterns.details
      });
    }

    return patterns;
  }

  // Hilfsmethoden für die Analyse
  private async analyzeMealPatterns(entries: DailyNutritionEntry[]) {
    if (entries.length < 7) return null;

    const mealTimes = entries.flatMap(entry =>
      entry.meals.map(meal => ({
        time: new Date(meal.time).getHours(),
        nutrition: meal.totalNutrition
      }))
    );

    // Gruppiere Mahlzeiten nach Tageszeit
    const timeGroups = this.groupByTimeOfDay(mealTimes);
    
    // Analysiere Muster in den Gruppen
    const patterns = Object.entries(timeGroups).map(([time, meals]) => ({
      time,
      avgCalories: this.average(meals.map(m => m.nutrition.calories)),
      avgProtein: this.average(meals.map(m => m.nutrition.protein)),
      consistency: this.calculateConsistency(meals.map(m => m.nutrition.calories))
    }));

    // Bewerte die Qualität der Muster
    const consistency = this.average(patterns.map(p => p.consistency));
    
    return {
      confidence: consistency,
      score: this.calculatePatternScore(patterns),
      description: this.generatePatternDescription(patterns),
      details: patterns
    };
  }

  private async analyzeTrends(progress: NutritionProgress[]) {
    const trends = [];
    const metrics = ['calories', 'protein', 'carbohydrates', 'fat'];

    for (const p of progress) {
      for (const metric of metrics) {
        const values = p.history.map(h => h.value);
        const trend = this.calculateTrend(values);
        
        if (trend.significance > 0.7) {
          trends.push({
            metric,
            value: trend.slope,
            confidence: trend.significance,
            description: this.describeTrend(trend, metric),
            context: {
              period: p.period,
              dataPoints: values.length
            }
          });
        }
      }
    }

    return trends;
  }

  private async detectAnomalies(entries: DailyNutritionEntry[]) {
    const anomalies = [];
    const metrics = ['calories', 'protein', 'carbohydrates', 'fat'];

    for (const metric of metrics) {
      const values = entries.map(e => this.extractMetric(e, metric));
      const stats = this.calculateStats(values);
      
      // Identifiziere Ausreißer
      const outliers = this.findOutliers(values, stats);
      
      if (outliers.length > 0) {
        anomalies.push({
          metric,
          value: outliers[0],
          confidence: this.calculateAnomalyConfidence(outliers[0], stats),
          description: this.describeAnomaly(metric, outliers[0], stats),
          context: {
            mean: stats.mean,
            stdDev: stats.stdDev,
            outliers: outliers
          }
        });
      }
    }

    return anomalies;
  }

  private async predictMetric(metric: string, data: any): Promise<any> {
    // Lade oder initialisiere das ML-Modell
    const model = await this.getOrCreateModel(metric);
    
    // Extrahiere Features
    const features = this.extractFeatures(data, metric);
    
    // Mache Vorhersage
    const prediction = await this.runPrediction(model, features);
    
    return {
      value: prediction.value,
      confidence: prediction.confidence,
      factors: this.extractTopFactors(model, features),
      timeframe: this.determineTimeframe(prediction.confidence)
    };
  }

  // Utility-Methoden
  private async getActiveGoals(profileId: string): Promise<NutritionGoal[]> {
    const goalsMap = await nutritionGoalsService.getAllGoals();
    const goals = Array.from(goalsMap.values());
    return goals.filter(goal => goal.profileId === profileId && goal.status === 'active');
  }

  private async getRecentEntries(profileId: string): Promise<DailyNutritionEntry[]> {
    // Diese Methode muss noch im NutritionGoalsService implementiert werden
    return [];
  }

  private async getAllProgress(goalIds: string[]): Promise<NutritionProgress[]> {
    return Promise.all(
      goalIds.map(id => nutritionTrackingService.getProgress(id))
    );
  }

  private groupByTimeOfDay(meals: Array<{time: number, nutrition: NutritionInfo}>): Record<string, Array<{time: number, nutrition: NutritionInfo}>> {
    return meals.reduce((groups: Record<string, Array<{time: number, nutrition: NutritionInfo}>>, meal) => {
      const hour = new Date(meal.time).getHours();
      const timeGroup = this.getTimeGroup(hour);
      if (!groups[timeGroup]) groups[timeGroup] = [];
      groups[timeGroup].push(meal);
      return groups;
    }, {});
  }

  private getTimeGroup(hour: number): string {
    if (hour < 10) return 'morning';
    if (hour < 14) return 'lunch';
    if (hour < 18) return 'afternoon';
    return 'evening';
  }

  private average(values: number[]): number {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private calculateConsistency(values: number[]): number {
    const mean = this.average(values);
    const variance = this.average(values.map(v => Math.pow(v - mean, 2)));
    return 1 / (1 + Math.sqrt(variance) / mean);
  }

  private calculatePatternScore(patterns: any[]): number {
    return this.average(patterns.map(p => p.consistency));
  }

  private generatePatternDescription(patterns: any[]): string {
    const mostConsistent = patterns.sort((a, b) => b.consistency - a.consistency)[0];
    return `Die konsistentesten Ernährungsmuster zeigen sich ${mostConsistent.time} mit durchschnittlich ${Math.round(mostConsistent.avgCalories)} Kalorien und ${Math.round(mostConsistent.avgProtein)}g Protein.`;
  }

  private calculateTrend(values: number[]) {
    if (values.length < 2) return { slope: 0, significance: 0 };

    const n = values.length;
    const x = Array.from({length: n}, (_, i) => i);
    const y = values;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const significance = Math.abs(slope) / this.calculateStats(values).stdDev;

    return { slope, significance };
  }

  private describeTrend(trend: {slope: number, significance: number}, metric: string): string {
    const direction = trend.slope > 0 ? 'steigend' : 'fallend';
    const strength = trend.significance > 0.9 ? 'stark' : 'leicht';
    return `${metric} zeigt einen ${strength} ${direction}en Trend.`;
  }

  private extractMetric(entry: DailyNutritionEntry, metric: string): number {
    return entry.totalDailyNutrition[metric as keyof NutritionInfo] as number;
  }

  private calculateStats(values: number[]) {
    const mean = this.average(values);
    const variance = this.average(values.map(v => Math.pow(v - mean, 2)));
    const stdDev = Math.sqrt(variance);
    
    return { mean, stdDev };
  }

  private findOutliers(values: number[], stats: {mean: number, stdDev: number}): number[] {
    const threshold = 2; // Standardabweichungen
    return values.filter(v => 
      Math.abs(v - stats.mean) > threshold * stats.stdDev
    );
  }

  private calculateAnomalyConfidence(value: number, stats: {mean: number, stdDev: number}): number {
    const zScore = Math.abs(value - stats.mean) / stats.stdDev;
    return Math.min(1, zScore / 3); // Normalisiert auf [0,1]
  }

  private describeAnomaly(metric: string, value: number, stats: {mean: number, stdDev: number}): string {
    const direction = value > stats.mean ? 'höher' : 'niedriger';
    const deviation = Math.abs(value - stats.mean) / stats.stdDev;
    return `Ungewöhnlicher ${metric}-Wert: ${Math.round(value)} ist ${Math.round(deviation * 100)}% ${direction} als üblich.`;
  }

  private async getOrCreateModel(metric: string): Promise<any> {
    if (this.modelCache.has(metric)) {
      return this.modelCache.get(metric);
    }

    // Hier würde normalerweise ein ML-Modell geladen oder trainiert werden
    const model = {
      predict: (features: any) => ({
        value: features.historical_mean,
        confidence: 0.8
      }),
      getFeatureImportance: () => ({
        historical_mean: 0.5,
        time_of_day: 0.3,
        day_of_week: 0.2
      })
    };

    this.modelCache.set(metric, model);
    return model;
  }

  private extractFeatures(data: any, metric: string): any {
    // Vereinfachte Feature-Extraktion
    const relevantEntries = data.entries
      .map((e: DailyNutritionEntry) => this.extractMetric(e, metric))
      .filter((v: number) => !isNaN(v));

    return {
      historical_mean: this.average(relevantEntries),
      time_of_day: new Date().getHours(),
      day_of_week: new Date().getDay()
    };
  }

  private async runPrediction(model: any, features: any) {
    return model.predict(features);
  }

  private extractTopFactors(model: any, features: any): Array<{name: string, impact: number}> {
    const importance = model.getFeatureImportance();
    return Object.entries(importance)
      .map(([name, impact]) => ({name, impact: impact as number}))
      .sort((a, b) => b.impact - a.impact)
      .slice(0, 3);
  }

  private determineTimeframe(confidence: number): 'short' | 'medium' | 'long' {
    if (confidence > 0.8) return 'short';
    if (confidence > 0.6) return 'medium';
    return 'long';
  }

  private async analyzeCorrelation(metric: string, factor: string, entries: DailyNutritionEntry[]): Promise<{strength: number; direction: 'positive' | 'negative'}> {
    if (entries.length < 7) {
      return { strength: 0, direction: 'positive' };
    }

    const metricValues = entries.map(e => this.extractMetric(e, metric));
    const factorValues = entries.map(e => this.extractFactorValue(e, factor));

    const correlation = this.calculatePearsonCorrelation(metricValues, factorValues);
    
    return {
      strength: Math.abs(correlation),
      direction: correlation >= 0 ? 'positive' : 'negative'
    };
  }

  private extractFactorValue(entry: DailyNutritionEntry, factor: string): number {
    switch (factor) {
      case 'time_of_day':
        return new Date(entry.date).getHours();
      case 'day_of_week':
        return new Date(entry.date).getDay();
      case 'meal_size':
        return entry.meals.length;
      case 'activity_level':
        return 1; // Platzhalter - könnte später aus Aktivitätsdaten kommen
      default:
        return 0;
    }
  }

  private calculatePearsonCorrelation(x: number[], y: number[]): number {
    const n = Math.min(x.length, y.length);
    if (n < 2) return 0;

    const avgX = this.average(x);
    const avgY = this.average(y);

    let numerator = 0;
    let denomX = 0;
    let denomY = 0;

    for (let i = 0; i < n; i++) {
      const xDiff = x[i] - avgX;
      const yDiff = y[i] - avgY;
      numerator += xDiff * yDiff;
      denomX += xDiff * xDiff;
      denomY += yDiff * yDiff;
    }

    if (denomX === 0 || denomY === 0) return 0;
    return numerator / Math.sqrt(denomX * denomY);
  }
}

export const nutritionAIService = NutritionAIService.getInstance();