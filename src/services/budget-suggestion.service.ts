import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  BudgetCategory,
  BudgetAdjustment,
  BudgetSuggestion,
  BudgetForecast 
} from '../types/budget';

class BudgetSuggestionService {
  private static instance: BudgetSuggestionService;

  private constructor() {}

  static getInstance(): BudgetSuggestionService {
    if (!BudgetSuggestionService.instance) {
      BudgetSuggestionService.instance = new BudgetSuggestionService();
    }
    return BudgetSuggestionService.instance;
  }

  async generateSuggestions(category: BudgetCategory): Promise<BudgetSuggestion[]> {
    try {
      const suggestions: BudgetSuggestion[] = [];
      
      // 1. Analysiere historische Daten
      const historicalData = await this.getHistoricalData(category.id);
      if (historicalData.length > 0) {
        // Identifiziere Muster und Trends
        const trends = this.analyzeTrends(historicalData);
        
        // Prüfe auf saisonale Muster
        const seasonalPatterns = this.analyzeSeasonalPatterns(historicalData);
        
        // Prüfe auf wiederkehrende Ausgaben
        const recurringExpenses = this.identifyRecurringExpenses(historicalData);

        // Erstelle Vorschläge basierend auf den Analysen
        suggestions.push(...this.createTrendBasedSuggestions(trends));
        suggestions.push(...this.createSeasonalSuggestions(seasonalPatterns));
        suggestions.push(...this.createRecurringExpenseSuggestions(recurringExpenses));
      }

      // 2. Vergleiche mit ähnlichen Kategorien
      const similarCategories = await this.findSimilarCategories(category);
      if (similarCategories.length > 0) {
        suggestions.push(...this.createBenchmarkSuggestions(category, similarCategories));
      }

      // 3. Berücksichtige finanzielle Ziele
      const financialGoals = await this.getFinancialGoals();
      if (financialGoals) {
        suggestions.push(...this.createGoalBasedSuggestions(category, financialGoals));
      }

      // 4. Bewerte und priorisiere Vorschläge
      return this.rankAndFilterSuggestions(suggestions);
    } catch (error) {
      console.error('Fehler bei der Generierung von Budget-Vorschlägen:', error);
      return [];
    }
  }

  private async getHistoricalData(categoryId: string): Promise<Array<{
    date: string;
    amount: number;
    type: string;
  }>> {
    try {
      const data = await AsyncStorage.getItem(`spending_history_${categoryId}`);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Fehler beim Laden der historischen Daten:', error);
      return [];
    }
  }

  private analyzeTrends(historicalData: Array<{ date: string; amount: number }>): {
    averageSpending: number;
    growthRate: number;
    volatility: number;
    confidence: number;
  } {
    // Gruppiere nach Monaten
    const monthlyData = this.aggregateByMonth(historicalData);

    // Berechne Durchschnitt
    const averageSpending = monthlyData.reduce((sum, entry) => sum + entry.amount, 0) / monthlyData.length;

    // Berechne Wachstumsrate
    const growthRate = this.calculateGrowthRate(monthlyData);

    // Berechne Volatilität
    const volatility = this.calculateVolatility(monthlyData, averageSpending);

    // Berechne Konfidenz basierend auf Datenmenge und Konsistenz
    const confidence = this.calculateConfidence(monthlyData.length, volatility);

    return {
      averageSpending,
      growthRate,
      volatility,
      confidence
    };
  }

  private aggregateByMonth(data: Array<{ date: string; amount: number }>): Array<{
    month: string;
    amount: number;
  }> {
    const monthlyMap = new Map<string, number>();

    data.forEach(entry => {
      const date = new Date(entry.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      const current = monthlyMap.get(monthKey) || 0;
      monthlyMap.set(monthKey, current + entry.amount);
    });

    return Array.from(monthlyMap.entries())
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  private calculateGrowthRate(monthlyData: Array<{ month: string; amount: number }>): number {
    if (monthlyData.length < 2) return 0;

    const monthlyGrowth = [];
    for (let i = 1; i < monthlyData.length; i++) {
      const growth = (monthlyData[i].amount - monthlyData[i-1].amount) / monthlyData[i-1].amount;
      monthlyGrowth.push(growth);
    }

    return monthlyGrowth.reduce((sum, rate) => sum + rate, 0) / monthlyGrowth.length;
  }

  private calculateVolatility(data: Array<{ month: string; amount: number }>, average: number): number {
    if (data.length < 2) return 0;

    const squaredDiffs = data.map(entry => Math.pow(entry.amount - average, 2));
    const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / (data.length - 1);
    
    return Math.sqrt(variance) / average; // Relative Standardabweichung
  }

  private calculateConfidence(dataPoints: number, volatility: number): number {
    // Basiere Konfidenz auf Datenmenge und Volatilität
    const dataConfidence = Math.min(dataPoints / 12, 1) * 50; // Max 50% basierend auf Datenmenge
    const stabilityConfidence = (1 - Math.min(volatility, 1)) * 50; // Max 50% basierend auf Stabilität

    return dataConfidence + stabilityConfidence;
  }

  private analyzeSeasonalPatterns(historicalData: Array<{ date: string; amount: number }>): {
    seasonalFactors: Map<number, number>;
    reliability: number;
  } {
    const monthlyAverages = new Array(12).fill(0);
    const monthCounts = new Array(12).fill(0);

    // Sammle Daten pro Monat
    historicalData.forEach(entry => {
      const date = new Date(entry.date);
      const month = date.getMonth();
      monthlyAverages[month] += entry.amount;
      monthCounts[month]++;
    });

    // Berechne Durchschnitte
    for (let i = 0; i < 12; i++) {
      if (monthCounts[i] > 0) {
        monthlyAverages[i] /= monthCounts[i];
      }
    }

    // Berechne Gesamtdurchschnitt
    const yearlyAverage = monthlyAverages.reduce((sum, avg) => sum + avg, 0) / 12;

    // Berechne saisonale Faktoren
    const seasonalFactors = new Map<number, number>();
    monthlyAverages.forEach((avg, month) => {
      if (monthCounts[month] > 0) {
        seasonalFactors.set(month, avg / yearlyAverage);
      }
    });

    // Berechne Zuverlässigkeit basierend auf Datenmenge und Konsistenz
    const reliability = Math.min(
      Math.min(...monthCounts) / 2, // Mindestens 2 Datenpunkte pro Monat für volle Zuverlässigkeit
      1
    ) * 100;

    return {
      seasonalFactors,
      reliability
    };
  }

  private identifyRecurringExpenses(historicalData: Array<{
    date: string;
    amount: number;
    type: string;
  }>): Array<{
    amount: number;
    frequency: 'weekly' | 'monthly' | 'yearly';
    confidence: number;
    description?: string;
  }> {
    const recurring: Array<{
      amount: number;
      frequency: 'weekly' | 'monthly' | 'yearly';
      confidence: number;
      description?: string;
    }> = [];

    // Gruppiere ähnliche Beträge
    const amountGroups = new Map<number, Array<{ date: string; type: string }>>();
    
    historicalData.forEach(entry => {
      // Runde auf 2 Dezimalstellen für besseres Gruppieren
      const roundedAmount = Math.round(entry.amount * 100) / 100;
      
      const existing = amountGroups.get(roundedAmount) || [];
      existing.push({ date: entry.date, type: entry.type });
      amountGroups.set(roundedAmount, existing);
    });

    // Analysiere jede Gruppe
    amountGroups.forEach((dates, amount) => {
      if (dates.length >= 3) { // Mindestens 3 Vorkommen
        const intervals = this.calculateIntervals(dates.map(d => new Date(d.date)));
        const { frequency, confidence } = this.determineFrequency(intervals);
        
        if (confidence > 60) { // Nur wenn ausreichend sicher
          recurring.push({
            amount,
            frequency,
            confidence,
            description: this.generateRecurringDescription(amount, frequency, dates[0].type)
          });
        }
      }
    });

    return recurring;
  }

  private calculateIntervals(dates: Date[]): number[] {
    const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime());
    const intervals = [];
    
    for (let i = 1; i < sortedDates.length; i++) {
      const days = (sortedDates[i].getTime() - sortedDates[i-1].getTime()) / (1000 * 60 * 60 * 24);
      intervals.push(Math.round(days));
    }

    return intervals;
  }

  private determineFrequency(intervals: number[]): {
    frequency: 'weekly' | 'monthly' | 'yearly';
    confidence: number;
  } {
    const avgInterval = intervals.reduce((sum, int) => sum + int, 0) / intervals.length;
    const variance = intervals.reduce((sum, int) => sum + Math.pow(int - avgInterval, 2), 0) / intervals.length;
    const standardDev = Math.sqrt(variance);

    // Bestimme Frequenz basierend auf durchschnittlichem Intervall
    let frequency: 'weekly' | 'monthly' | 'yearly';
    if (avgInterval >= 350) frequency = 'yearly';
    else if (avgInterval >= 25) frequency = 'monthly';
    else frequency = 'weekly';

    // Berechne Konfidenz basierend auf Standardabweichung
    const confidence = Math.max(0, 100 - (standardDev / avgInterval) * 100);

    return { frequency, confidence };
  }

  private generateRecurringDescription(
    amount: number,
    frequency: 'weekly' | 'monthly' | 'yearly',
    type: string
  ): string {
    const formatter = new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    });

    return `Wiederkehrende Ausgabe von ${formatter.format(amount)} ${
      frequency === 'weekly' ? 'wöchentlich' :
      frequency === 'monthly' ? 'monatlich' : 'jährlich'
    } für ${type}`;
  }

  private async findSimilarCategories(category: BudgetCategory): Promise<BudgetCategory[]> {
    try {
      const allCategories = await this.getAllCategories();
      return allCategories.filter(c => 
        c.id !== category.id && 
        this.calculateCategorySimilarity(category, c) > 0.7
      );
    } catch (error) {
      console.error('Fehler beim Finden ähnlicher Kategorien:', error);
      return [];
    }
  }

  private async getAllCategories(): Promise<BudgetCategory[]> {
    try {
      const data = await AsyncStorage.getItem('budget_categories');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Fehler beim Laden aller Kategorien:', error);
      return [];
    }
  }

  private calculateCategorySimilarity(a: BudgetCategory, b: BudgetCategory): number {
    // Implementiere hier eine Ähnlichkeitsberechnung basierend auf:
    // - Ausgabenmuster
    // - Kategoriename (z.B. mittels Levenshtein-Distanz)
    // - Budget-Größe
    // - Ausgabenhistorie
    
    // Vereinfachte Version für den Anfang:
    const budgetSimilarity = Math.min(a.limit, b.limit) / Math.max(a.limit, b.limit);
    const spendingSimilarity = Math.min(a.spent / a.limit, b.spent / b.limit) /
                              Math.max(a.spent / a.limit, b.spent / b.limit);

    return (budgetSimilarity * 0.7 + spendingSimilarity * 0.3);
  }

  private async getFinancialGoals(): Promise<any> {
    try {
      const data = await AsyncStorage.getItem('financial_goals');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Fehler beim Laden der finanziellen Ziele:', error);
      return null;
    }
  }

  private createTrendBasedSuggestions(trends: {
    averageSpending: number;
    growthRate: number;
    volatility: number;
    confidence: number;
  }): BudgetSuggestion[] {
    const suggestions: BudgetSuggestion[] = [];

    if (trends.confidence >= 70) {
      if (trends.growthRate > 0.1) {
        suggestions.push({
          type: 'trend',
          action: 'increase',
          amount: trends.averageSpending * (1 + trends.growthRate),
          reason: 'Steigende Ausgabentrends erkannt',
          confidence: trends.confidence,
          impact: 'medium'
        });
      } else if (trends.growthRate < -0.1) {
        suggestions.push({
          type: 'trend',
          action: 'decrease',
          amount: trends.averageSpending * (1 + trends.growthRate),
          reason: 'Sinkende Ausgabentrends erkannt',
          confidence: trends.confidence,
          impact: 'medium'
        });
      }

      if (trends.volatility > 0.3) {
        suggestions.push({
          type: 'volatility',
          action: 'increase',
          amount: trends.averageSpending * (1 + trends.volatility),
          reason: 'Hohe Ausgabenschwankungen festgestellt',
          confidence: trends.confidence,
          impact: 'high'
        });
      }
    }

    return suggestions;
  }

  private createSeasonalSuggestions(seasonalAnalysis: {
    seasonalFactors: Map<number, number>;
    reliability: number;
  }): BudgetSuggestion[] {
    const suggestions: BudgetSuggestion[] = [];
    const currentMonth = new Date().getMonth();
    const nextMonth = (currentMonth + 1) % 12;

    const currentFactor = seasonalAnalysis.seasonalFactors.get(currentMonth) || 1;
    const nextFactor = seasonalAnalysis.seasonalFactors.get(nextMonth) || 1;

    if (seasonalAnalysis.reliability >= 70) {
      if (nextFactor > currentFactor * 1.2) {
        suggestions.push({
          type: 'seasonal',
          action: 'increase',
          amount: nextFactor,
          reason: 'Saisonaler Anstieg erwartet',
          confidence: seasonalAnalysis.reliability,
          impact: 'medium'
        });
      } else if (nextFactor < currentFactor * 0.8) {
        suggestions.push({
          type: 'seasonal',
          action: 'decrease',
          amount: nextFactor,
          reason: 'Saisonaler Rückgang erwartet',
          confidence: seasonalAnalysis.reliability,
          impact: 'medium'
        });
      }
    }

    return suggestions;
  }

  private createRecurringExpenseSuggestions(recurring: Array<{
    amount: number;
    frequency: 'weekly' | 'monthly' | 'yearly';
    confidence: number;
    description?: string;
  }>): BudgetSuggestion[] {
    return recurring.map(exp => ({
      type: 'recurring',
      action: 'adjust',
      amount: this.calculateRecurringBudget(exp),
      reason: exp.description || 'Wiederkehrende Ausgabe erkannt',
      confidence: exp.confidence,
      impact: 'high'
    }));
  }

  private calculateRecurringBudget(recurring: {
    amount: number;
    frequency: 'weekly' | 'monthly' | 'yearly';
  }): number {
    switch (recurring.frequency) {
      case 'weekly':
        return recurring.amount * 4.33; // Durchschnittliche Anzahl Wochen pro Monat
      case 'monthly':
        return recurring.amount;
      case 'yearly':
        return recurring.amount / 12;
    }
  }

  private createBenchmarkSuggestions(
    category: BudgetCategory,
    similarCategories: BudgetCategory[]
  ): BudgetSuggestion[] {
    const suggestions: BudgetSuggestion[] = [];

    // Berechne Durchschnittsbudget ähnlicher Kategorien
    const avgBudget = similarCategories.reduce((sum, cat) => sum + cat.limit, 0) / similarCategories.length;
    const difference = avgBudget - category.limit;
    const percentDiff = (difference / category.limit) * 100;

    if (Math.abs(percentDiff) >= 20) { // Nur bei signifikanten Unterschieden
      suggestions.push({
        type: 'benchmark',
        action: difference > 0 ? 'increase' : 'decrease',
        amount: avgBudget,
        reason: `Ihr Budget liegt ${Math.abs(percentDiff).toFixed(0)}% ${
          difference > 0 ? 'unter' : 'über'
        } dem Durchschnitt ähnlicher Kategorien`,
        confidence: 80,
        impact: 'medium'
      });
    }

    return suggestions;
  }

  private createGoalBasedSuggestions(
    category: BudgetCategory,
    goals: any
  ): BudgetSuggestion[] {
    const suggestions: BudgetSuggestion[] = [];

    // TODO: Implementiere zielbasierte Vorschläge basierend auf den finanziellen Zielen
    // Dies würde eine separate Implementierung der Ziel-Logik erfordern

    return suggestions;
  }

  private rankAndFilterSuggestions(suggestions: BudgetSuggestion[]): BudgetSuggestion[] {
    // Sortiere nach Konfidenz und Auswirkung
    return suggestions
      .sort((a, b) => {
        const impactScore = (impact: string) => 
          impact === 'high' ? 3 : impact === 'medium' ? 2 : 1;

        const scoreA = a.confidence * 0.7 + impactScore(a.impact) * 0.3;
        const scoreB = b.confidence * 0.7 + impactScore(b.impact) * 0.3;

        return scoreB - scoreA;
      })
      .slice(0, 5); // Beschränke auf die Top 5 Vorschläge
  }
}

export const budgetSuggestionService = BudgetSuggestionService.getInstance();