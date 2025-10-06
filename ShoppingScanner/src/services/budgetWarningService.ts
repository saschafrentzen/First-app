import * as Notifications from 'expo-notifications';
import { 
  BudgetWarning,
  BudgetWarningSettings,
  BudgetPrediction,
  BudgetAdjustmentSuggestion
} from '../types/budgetWarning';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CategoryBudget } from '../types/storage';

const BUDGET_WARNINGS_KEY = '@budget_warnings';
const BUDGET_SETTINGS_KEY = '@budget_warning_settings';
const HISTORICAL_DATA_KEY = '@budget_historical_data';

class BudgetWarningService {
  private static instance: BudgetWarningService;
  private warnings: BudgetWarning[] = [];
  private settings: BudgetWarningSettings = {
    enabled: true,
    thresholds: [
      { percentage: 80, notificationType: 'in-app' },
      { percentage: 90, notificationType: 'both' },
      { percentage: 100, notificationType: 'both' }
    ],
    notifyOnTrends: true,
    autoAdjust: false
  };

  private constructor() {
    this.loadSettings();
    this.loadWarnings();
    this.setupNotifications();
  }

  static getInstance(): BudgetWarningService {
    if (!BudgetWarningService.instance) {
      BudgetWarningService.instance = new BudgetWarningService();
    }
    return BudgetWarningService.instance;
  }

  private async setupNotifications() {
    await Notifications.requestPermissionsAsync();
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true
      }),
    });
  }

  private async loadSettings() {
    try {
      const settingsString = await AsyncStorage.getItem(BUDGET_SETTINGS_KEY);
      if (settingsString) {
        this.settings = JSON.parse(settingsString);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Budget-Warnungseinstellungen:', error);
    }
  }

  private async saveSettings() {
    try {
      await AsyncStorage.setItem(BUDGET_SETTINGS_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Fehler beim Speichern der Budget-Warnungseinstellungen:', error);
    }
  }

  private async loadWarnings() {
    try {
      const warningsString = await AsyncStorage.getItem(BUDGET_WARNINGS_KEY);
      if (warningsString) {
        this.warnings = JSON.parse(warningsString);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Budget-Warnungen:', error);
    }
  }

  private async saveWarnings() {
    try {
      await AsyncStorage.setItem(BUDGET_WARNINGS_KEY, JSON.stringify(this.warnings));
    } catch (error) {
      console.error('Fehler beim Speichern der Budget-Warnungen:', error);
    }
  }

  async checkBudgetStatus(categoryId: string, currentAmount: number, budget: CategoryBudget) {
    if (!this.settings.enabled) return;

    const percentage = (currentAmount / budget.budget) * 100;
    
    // Überprüfe Schwellenwerte
    for (const threshold of this.settings.thresholds) {
      if (percentage >= threshold.percentage) {
        await this.createWarning({
          id: Date.now().toString(),
          categoryId,
          type: 'threshold',
          severity: this.getSeverityForPercentage(percentage),
          message: `Budget zu ${percentage.toFixed(0)}% aufgebraucht`,
          currentAmount,
          budgetAmount: budget.budget,
          percentage,
          createdAt: new Date(),
          acknowledged: false
        });
      }
    }

    // Prognose erstellen und prüfen
    const prediction = await this.predictFutureExpenses(categoryId);
    if (prediction && prediction.predictedAmount > budget.budget) {
      await this.createWarning({
        id: Date.now().toString(),
        categoryId,
        type: 'prediction',
        severity: 'high',
        message: 'Budgetüberschreitung basierend auf Prognose wahrscheinlich',
        currentAmount,
        budgetAmount: budget.budget,
        percentage,
        createdAt: new Date(),
        acknowledged: false,
        prediction
      });
    }

    // Automatische Anpassungen prüfen
    if (this.settings.autoAdjust) {
      const suggestion = await this.calculateBudgetAdjustment(categoryId, budget);
      if (suggestion) {
        await this.createWarning({
          id: Date.now().toString(),
          categoryId,
          type: 'trend',
          severity: 'medium',
          message: 'Vorschlag zur Budgetanpassung verfügbar',
          currentAmount,
          budgetAmount: budget.budget,
          percentage,
          createdAt: new Date(),
          acknowledged: false,
          suggestion
        });
      }
    }
  }

  private getSeverityForPercentage(percentage: number): 'low' | 'medium' | 'high' {
    if (percentage >= 100) return 'high';
    if (percentage >= 90) return 'medium';
    return 'low';
  }

  private async createWarning(warning: BudgetWarning) {
    this.warnings.push(warning);
    await this.saveWarnings();

    // Benachrichtigung senden basierend auf den Einstellungen
    const threshold = this.settings.thresholds.find(t => t.percentage <= warning.percentage);
    if (threshold) {
      if (['both', 'push'].includes(threshold.notificationType)) {
        await this.sendPushNotification(warning);
      }
    }
  }

  private async sendPushNotification(warning: BudgetWarning) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Budget-Warnung',
        body: warning.message,
        data: { warningId: warning.id }
      },
      trigger: null // Sofort senden
    });
  }

  async predictFutureExpenses(categoryId: string): Promise<BudgetPrediction | null> {
    try {
      const historicalData = await this.getHistoricalData(categoryId);
      if (!historicalData || historicalData.length < 3) return null;

      // Einfache lineare Regression für die Vorhersage
      const prediction = this.calculateLinearRegression(historicalData);
      
      return {
        predictedAmount: prediction.predictedAmount,
        confidence: prediction.confidence,
        trend: prediction.trend,
        factors: prediction.factors
      };
    } catch (error) {
      console.error('Fehler bei der Ausgabenvorhersage:', error);
      return null;
    }
  }

  private async getHistoricalData(categoryId: string) {
    try {
      const data = await AsyncStorage.getItem(`${HISTORICAL_DATA_KEY}_${categoryId}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Fehler beim Laden historischer Daten:', error);
      return null;
    }
  }

  private calculateLinearRegression(historicalData: any[]): {
    predictedAmount: number;
    confidence: number;
    trend: 'increasing' | 'stable' | 'decreasing';
    factors: { description: string; impact: number; }[];
  } {
    // Implementierung der linearen Regression
    // Dies ist eine vereinfachte Version - in der Praxis würden Sie
    // hier fortgeschrittenere statistische Methoden verwenden
    const n = historicalData.length;
    const xValues = Array.from({ length: n }, (_, i) => i);
    const yValues = historicalData.map(d => d.amount);

    const sumX = xValues.reduce((a, b) => a + b, 0);
    const sumY = yValues.reduce((a, b) => a + b, 0);
    const sumXY = xValues.reduce((a, b, i) => a + b * yValues[i], 0);
    const sumXX = xValues.reduce((a, b) => a + b * b, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const predictedAmount = slope * n + intercept;
    
    // Bestimme den Trend
    const trend: 'increasing' | 'stable' | 'decreasing' = 
      slope > 0.1 ? 'increasing' : 
      slope < -0.1 ? 'decreasing' : 
      'stable';

    // Berechne die Konfidenz basierend auf der Streuung der Daten
    const avgAmount = sumY / n;
    const variance = yValues.reduce((a, b) => a + Math.pow(b - avgAmount, 2), 0) / n;
    const confidence = Math.max(0, Math.min(1, 1 - (variance / (avgAmount * avgAmount))));

    return {
      predictedAmount,
      confidence,
      trend,
      factors: [
        {
          description: 'Historischer Trend',
          impact: slope / avgAmount
        },
        {
          description: 'Saisonale Schwankungen',
          impact: variance / (avgAmount * avgAmount)
        }
      ]
    };
  }

  async calculateBudgetAdjustment(
    categoryId: string, 
    currentBudget: CategoryBudget
  ): Promise<BudgetAdjustmentSuggestion | null> {
    const prediction = await this.predictFutureExpenses(categoryId);
    if (!prediction) return null;

    const currentAmount = currentBudget.budget;
    const suggestedAmount = Math.ceil(prediction.predictedAmount * 1.1); // 10% Puffer

    if (Math.abs(suggestedAmount - currentAmount) / currentAmount < 0.1) {
      return null; // Keine Anpassung bei weniger als 10% Unterschied
    }

    return {
      currentBudget: currentAmount,
      suggestedBudget: suggestedAmount,
      reason: `Basierend auf ${prediction.trend} Trend und historischen Daten`,
      confidence: prediction.confidence
    };
  }

  // Getter und Setter für Einstellungen und Warnungen
  async getWarnings(): Promise<BudgetWarning[]> {
    return this.warnings;
  }

  async acknowledgeWarning(warningId: string): Promise<void> {
    const warning = this.warnings.find(w => w.id === warningId);
    if (warning) {
      warning.acknowledged = true;
      await this.saveWarnings();
    }
  }

  async updateSettings(newSettings: Partial<BudgetWarningSettings>): Promise<void> {
    this.settings = { ...this.settings, ...newSettings };
    await this.saveSettings();
  }

  async getSettings(): Promise<BudgetWarningSettings> {
    return this.settings;
  }
}

export const budgetWarningService = BudgetWarningService.getInstance();