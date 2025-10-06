import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  BudgetCategory,
  BudgetAlert,
  BudgetStatus,
  BudgetSettings,
  BudgetNotification,
  BudgetForecast,
  BudgetCheckFrequency,
  NotificationChannel 
} from '../types/budget';
import { notificationService } from './notification.service';

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

  // Budget-Einstellungen
  async updateSettings(updates: Partial<BudgetSettings>): Promise<BudgetSettings> {
    this.settings = { ...this.settings!, ...updates };
    await this.saveSettings();
    this.initializeCheckInterval();
    return this.settings;
  }

  // Budget-Status und Prüfungen
  async checkBudgets(): Promise<void> {
    if (!await this.shouldCheck()) return;

    for (const category of this.categories.values()) {
      const status = await this.calculateBudgetStatus(category);
      await this.checkAlerts(category, status);
    }
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

      if (status.percentageSpent >= alert.threshold) {
        await this.createNotification(category, alert, status);
      }
    }
  }

  private async createNotification(
    category: BudgetCategory,
    alert: BudgetAlert,
    status: BudgetStatus
  ): Promise<void> {
    const notification: BudgetNotification = {
      id: `notification_${Date.now()}`,
      categoryId: category.id,
      alertId: alert.id,
      timestamp: new Date().toISOString(),
      type: alert.type,
      message: this.formatAlertMessage(alert, status),
      data: {
        budgetLimit: status.limit,
        currentSpent: status.spent,
        threshold: alert.threshold,
        percentageSpent: status.percentageSpent
      },
      status: 'pending'
    };

    this.notifications.set(notification.id, notification);
    await this.saveNotifications();

    // Sende Benachrichtigungen über alle aktivierten Kanäle
    for (const channel of alert.notificationChannels) {
      await this.sendNotification(notification, channel);
    }
  }

  private async sendNotification(
    notification: BudgetNotification,
    channel: NotificationChannel
  ): Promise<void> {
    try {
      switch (channel) {
        case 'push':
          await notificationService.sendPushNotification({
            title: `Budget-Warnung: ${notification.type.toUpperCase()}`,
            body: notification.message,
            data: notification.data
          });
          break;
        case 'inApp':
          await notificationService.sendInAppNotification(notification);
          break;
        case 'email':
          // E-Mail-Benachrichtigung implementieren
          break;
      }

      notification.status = 'sent';
      await this.saveNotifications();
    } catch (error) {
      console.error(`Fehler beim Senden der ${channel}-Benachrichtigung:`, error);
    }
  }

  // Öffentliche Zugriffsmethoden
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

  // Hilfsmethoden
  private async shouldCheck(): Promise<boolean> {
    if (!this.settings) return false;

    const now = new Date();
    const lastCheck = await this.getLastCheckTime();

    if (!lastCheck) return true;

    switch (this.settings.checkFrequency) {
      case 'daily':
        return (now.getTime() - lastCheck.getTime()) >= 24 * 60 * 60 * 1000;
      case 'weekly':
        return (now.getTime() - lastCheck.getTime()) >= 7 * 24 * 60 * 60 * 1000;
      case 'monthly':
        return now.getMonth() !== lastCheck.getMonth();
      case 'onTransaction':
        return true;
      default:
        return false;
    }
  }

  private getPeriodDates(period: BudgetCategory['period'], date: Date): { startDate: Date, endDate: Date } {
    const startDate = new Date(date);
    const endDate = new Date(date);

    switch (period) {
      case 'daily':
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'weekly':
        startDate.setDate(date.getDate() - date.getDay());
        endDate.setDate(startDate.getDate() + 6);
        break;
      case 'monthly':
        startDate.setDate(1);
        endDate.setMonth(startDate.getMonth() + 1, 0);
        break;
      case 'yearly':
        startDate.setMonth(0, 1);
        endDate.setMonth(11, 31);
        break;
    }

    return { startDate, endDate };
  }

  private formatAlertMessage(alert: BudgetAlert, status: BudgetStatus): string {
    return alert.message
      .replace('{percentage}', status.percentageSpent.toFixed(1))
      .replace('{spent}', status.spent.toFixed(2))
      .replace('{remaining}', status.remaining.toFixed(2))
      .replace('{limit}', status.limit.toFixed(2));
  }

  private async calculateProjectedOverspend(category: BudgetCategory): Promise<number | null> {
    // Implementiere Prognoselogik basierend auf historischen Daten
    return null;
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
        // Initialisiere Standardeinstellungen
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
      await AsyncStorage.setItem('budget_settings', JSON.stringify(this.settings));
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

  private async saveNotifications(): Promise<void> {
    try {
      const data = Object.fromEntries(this.notifications);
      await AsyncStorage.setItem('budget_notifications', JSON.stringify(data));
    } catch (error) {
      console.error('Fehler beim Speichern der Budget-Benachrichtigungen:', error);
    }
  }

  private async getLastCheckTime(): Promise<Date | null> {
    try {
      const lastCheck = await AsyncStorage.getItem('last_budget_check');
      return lastCheck ? new Date(JSON.parse(lastCheck)) : null;
    } catch {
      return null;
    }
  }

  private initializeCheckInterval(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Prüfe Budgets alle 15 Minuten
    this.checkInterval = setInterval(() => this.checkBudgets(), 15 * 60 * 1000);
  }
}

export const budgetService = BudgetService.getInstance();