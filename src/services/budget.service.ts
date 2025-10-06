import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  BudgetCategory,
  BudgetAlert,
  BudgetStatus,
  BudgetSettings,
  BudgetNotification,
  BudgetForecast,
  BudgetAdjustment,
  BudgetAdjustmentHistory,
  BudgetCheckFrequency,
  NotificationChannel,
  BudgetSuggestion
} from '../types/budget';
import { notificationService } from './notification.service';
import { budgetAdjustmentService } from './budget-adjustment.service';

class BudgetService {
  private static instance: BudgetService;
  private categories: Map<string, BudgetCategory> = new Map();
  private settings: BudgetSettings | null = null;
  private notifications: Map<string, BudgetNotification> = new Map();
  private checkInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.loadData();
    this.initializeCheckInterval();
  }

  static getInstance(): BudgetService {
    if (!BudgetService.instance) {
      BudgetService.instance = new BudgetService();
    }
    return BudgetService.instance;
  }

  // Budget-Kategorien Management
  async addCategory(category: Omit<BudgetCategory, 'id'>): Promise<BudgetCategory> {
    const newCategory: BudgetCategory = {
      ...category,
      id: `category_${Date.now()}`,
      spent: 0,
      alerts: this.settings?.defaultAlerts || []
    };

    this.categories.set(newCategory.id, newCategory);
    await this.saveCategories();
    return newCategory;
  }

  async updateCategory(id: string, updates: Partial<BudgetCategory>): Promise<BudgetCategory> {
    const category = this.categories.get(id);
    if (!category) throw new Error('Kategorie nicht gefunden');

    const updatedCategory = { ...category, ...updates };
    this.categories.set(id, updatedCategory);
    await this.saveCategories();
    return updatedCategory;
  }

  // Budget-Vorschläge
  async applyBudgetSuggestion(categoryId: string, suggestion: BudgetSuggestion): Promise<BudgetCategory> {
    const category = this.categories.get(categoryId);
    if (!category) throw new Error('Kategorie nicht gefunden');

    const adjustment: BudgetAdjustment = {
      categoryId,
      oldLimit: category.limit,
      newLimit: suggestion.amount,
      reason: suggestion.reason,
      date: new Date().toISOString(),
      confidence: suggestion.confidence
    };

    // Speichere die Anpassung in der Historie
    await budgetAdjustmentService.saveAdjustment(adjustment);

    // Aktualisiere das Budget
    const updatedCategory = await this.updateCategory(categoryId, {
      limit: suggestion.amount
    });

    // Speichere die Anpassung in der lokalen Historie
    await this.saveBudgetAdjustmentHistory(categoryId, {
      timestamp: new Date().toISOString(),
      oldLimit: adjustment.oldLimit,
      newLimit: adjustment.newLimit,
      reason: adjustment.reason
    });

    // Benachrichtigung senden
    const percentageChange = ((adjustment.newLimit - adjustment.oldLimit) / adjustment.oldLimit) * 100;
    await notificationService.sendPushNotification({
      title: 'Budget Anpassung',
      body: `Budget für ${category.name} wurde um ${Math.abs(percentageChange).toFixed(1)}% ${percentageChange >= 0 ? 'erhöht' : 'reduziert'}.`,
      data: {
        notificationId: `budget_adj_${Date.now()}`,
        categoryId,
        alertId: 'budget_adjustment',
        type: 'info',
        budgetLimit: adjustment.newLimit,
        currentSpent: category.spent,
        threshold: 0,
        percentageSpent: (category.spent / adjustment.newLimit) * 100
      }
    });
    return updatedCategory;
  }

  // Persistenz
  private async loadData(): Promise<void> {
    await Promise.all([
      this.loadCategories(),
      this.loadSettings(),
      this.loadNotifications()
    ]);
  }

  private async loadCategories(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('budget_categories');
      if (data) {
        const categories = JSON.parse(data);
        this.categories = new Map(Object.entries(categories));
      }
    } catch (error) {
      console.error('Fehler beim Laden der Budget-Kategorien:', error);
    }
  }

  private async saveCategories(): Promise<void> {
    try {
      const data = Object.fromEntries(this.categories);
      await AsyncStorage.setItem('budget_categories', JSON.stringify(data));
    } catch (error) {
      console.error('Fehler beim Speichern der Budget-Kategorien:', error);
    }
  }

  private async loadSettings(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('budget_settings');
      if (data) {
        this.settings = JSON.parse(data);
      } else {
        // Default settings
        this.settings = {
          checkFrequency: 'daily',
          quietHours: {
            enabled: true,
            start: '22:00',
            end: '07:00'
          },
          defaultAlerts: [
            {
              id: 'default_warning',
              type: 'warning',
              threshold: 80,
              message: 'Sie haben {percentage}% Ihres Budgets verbraucht.',
              enabled: true,
              notificationChannels: ['push', 'inApp']
            },
            {
              id: 'default_critical',
              type: 'critical',
              threshold: 95,
              message: 'Achtung: {percentage}% des Budgets verbraucht!',
              enabled: true,
              notificationChannels: ['push', 'inApp', 'email']
            }
          ],
          globalNotificationChannels: ['push', 'inApp']
        };
        await this.saveSettings();
      }
    } catch (error) {
      console.error('Fehler beim Laden der Budget-Einstellungen:', error);
    }
  }

  private async saveSettings(): Promise<void> {
    try {
      if (this.settings) {
        await AsyncStorage.setItem('budget_settings', JSON.stringify(this.settings));
      }
    } catch (error) {
      console.error('Fehler beim Speichern der Budget-Einstellungen:', error);
    }
  }

  private async loadNotifications(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('budget_notifications');
      if (data) {
        const notifications = JSON.parse(data);
        this.notifications = new Map(Object.entries(notifications));
      }
    } catch (error) {
      console.error('Fehler beim Laden der Budget-Benachrichtigungen:', error);
    }
  }

  // Budget-Status und Prüfungen
  private async checkBudgets(): Promise<void> {
    if (!await this.shouldCheck()) return;

    for (const category of this.categories.values()) {
      const status = await this.calculateBudgetStatus(category);
      await this.checkAlerts(category, status);
    }
  }

  private async shouldCheck(): Promise<boolean> {
    if (!this.settings) return false;
    
    const now = new Date();
    const hour = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    // Prüfe Ruhezeiten
    if (this.settings.quietHours.enabled) {
      const start = this.settings.quietHours.start;
      const end = this.settings.quietHours.end;
      if (currentTime >= start || currentTime <= end) {
        return false;
      }
    }

    return true;
  }

  private async calculateBudgetStatus(category: BudgetCategory): Promise<BudgetStatus> {
    const now = new Date();
    const { startDate, endDate } = this.getPeriodDates(category.period, now);

    const activeAlerts = category.alerts.filter(alert => 
      alert.enabled && ((category.spent / category.limit) * 100) >= alert.threshold
    );

    const status: BudgetStatus = {
      categoryId: category.id,
      period: category.period,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      limit: category.limit,
      spent: category.spent,
      remaining: category.limit - category.spent,
      percentageSpent: (category.spent / category.limit) * 100,
      projectedOverspend: await this.calculateProjectedOverspend(category),
      lastChecked: now.toISOString(),
      activeAlerts
    };

    return status;
  }

  private async checkAlerts(category: BudgetCategory, status: BudgetStatus): Promise<void> {
    for (const alert of category.alerts) {
      if (!alert.enabled) continue;

      const threshold = alert.threshold;
      const percentageSpent = (status.spent / status.limit) * 100;

      if (percentageSpent >= threshold) {
        const notificationId = `alert_${category.id}_${alert.id}_${Date.now()}`;
        const message = alert.message.replace('{percentage}', percentageSpent.toFixed(1));

        await notificationService.sendPushNotification({
          title: alert.type === 'critical' ? 'Budget Warnung!' : 'Budget Hinweis',
          body: message,
          data: {
            notificationId,
            categoryId: category.id,
            alertId: alert.id,
            type: alert.type,
            budgetLimit: status.limit,
            currentSpent: status.spent,
            threshold: alert.threshold,
            percentageSpent
          }
        });
      }
    }
  }

  private async calculateProjectedOverspend(category: BudgetCategory): Promise<number | null> {
    try {
      const spendingHistory = await this.getHistoricalSpending(category.id);
      if (spendingHistory.length < 3) return null;

      // Berechne durchschnittliche tägliche Ausgaben
      const totalSpent = spendingHistory.reduce((sum, item) => sum + item.amount, 0);
      const daysInHistory = spendingHistory.length;
      const averageDailySpend = totalSpent / daysInHistory;

      // Bestimme verbleibende Tage in der Periode
      const now = new Date();
      const { endDate } = this.getPeriodDates(category.period, now);
      const remainingDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Projiziere Gesamtausgaben
      const projectedTotal = category.spent + (averageDailySpend * remainingDays);
      
      return projectedTotal > category.limit ? projectedTotal - category.limit : 0;
    } catch (error) {
      console.error('Fehler bei der Berechnung der projizierten Überschreitung:', error);
      return null;
    }
  }

  private getPeriodDates(period: string, date: Date): { startDate: Date; endDate: Date } {
    const startDate = new Date(date);
    const endDate = new Date(date);

    switch (period) {
      case 'weekly':
        startDate.setDate(date.getDate() - date.getDay());
        endDate.setDate(startDate.getDate() + 6);
        break;
      case 'monthly':
        startDate.setDate(1);
        endDate.setMonth(date.getMonth() + 1);
        endDate.setDate(0);
        break;
      case 'yearly':
        startDate.setMonth(0, 1);
        endDate.setMonth(11, 31);
        break;
    }

    return { startDate, endDate };
  }

  private async getHistoricalSpending(categoryId: string): Promise<Array<{ amount: number; date: string }>> {
    try {
      const data = await AsyncStorage.getItem(`spending_history_${categoryId}`);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Fehler beim Laden der Ausgabenhistorie:', error);
      return [];
    }
  }

  private async saveBudgetAdjustmentHistory(categoryId: string, adjustment: BudgetAdjustmentHistory): Promise<void> {
    try {
      const key = `budget_adjustments_${categoryId}`;
      const existingData = await AsyncStorage.getItem(key);
      const adjustments = existingData ? JSON.parse(existingData) : [];
      
      adjustments.push(adjustment);
      
      await AsyncStorage.setItem(key, JSON.stringify(adjustments));
    } catch (error) {
      console.error('Fehler beim Speichern der Budget-Anpassungshistorie:', error);
    }
  }

  async getBudgetAdjustmentHistory(categoryId: string): Promise<BudgetAdjustmentHistory[]> {
    try {
      const key = `budget_adjustments_${categoryId}`;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Fehler beim Laden der Budget-Anpassungshistorie:', error);
      return [];
    }
  }

  private initializeCheckInterval(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Prüfe Budgets alle 15 Minuten
    this.checkInterval = setInterval(() => this.checkBudgets(), 15 * 60 * 1000);
  }

  // Öffentliche Hilfsmethoden
  getCategories(): Map<string, BudgetCategory> {
    return this.categories;
  }

  getNotifications(): Map<string, BudgetNotification> {
    return this.notifications;
  }

  async getCategoryStatus(categoryId: string): Promise<BudgetStatus | null> {
    const category = this.categories.get(categoryId);
    if (!category) return null;
    return this.calculateBudgetStatus(category);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }
}

export const budgetService = BudgetService.getInstance();