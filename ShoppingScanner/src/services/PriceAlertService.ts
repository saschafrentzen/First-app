import AsyncStorage from '@react-native-async-storage/async-storage';
import { PriceAlert, CreatePriceAlertDTO, UpdatePriceAlertDTO, AlertType } from '../models/PriceAlert';
import { PriceHistory, PriceHistoryStats } from '../models/PriceHistory';
import { notificationService } from './NotificationService';

class PriceAlertService {
  private readonly ALERTS_STORAGE_KEY = '@price_alerts';
  private readonly PRICE_HISTORY_KEY = '@price_history';

  // Price Alerts CRUD Operations
  async createAlert(userId: string, data: CreatePriceAlertDTO): Promise<PriceAlert> {
    try {
      const alerts = await this.getAllAlerts(userId);
      const newAlert: PriceAlert = {
        id: Math.random().toString(36).substr(2, 9),
        userId,
        currentPrice: 0, // Wird beim nächsten Preis-Check aktualisiert
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data
      };
      
      alerts.push(newAlert);
      await AsyncStorage.setItem(this.ALERTS_STORAGE_KEY, JSON.stringify(alerts));
      return newAlert;
    } catch (error) {
      console.error('Error creating price alert:', error);
      throw new Error('Failed to create price alert');
    }
  }

  async updateAlert(userId: string, alertId: string, data: UpdatePriceAlertDTO): Promise<PriceAlert> {
    try {
      const alerts = await this.getAllAlerts(userId);
      const index = alerts.findIndex(alert => alert.id === alertId);
      
      if (index === -1) {
        throw new Error('Alert not found');
      }

      alerts[index] = {
        ...alerts[index],
        ...data,
        updatedAt: new Date()
      };

      await AsyncStorage.setItem(this.ALERTS_STORAGE_KEY, JSON.stringify(alerts));
      return alerts[index];
    } catch (error) {
      console.error('Error updating price alert:', error);
      throw new Error('Failed to update price alert');
    }
  }

  async deleteAlert(userId: string, alertId: string): Promise<void> {
    try {
      const alerts = await this.getAllAlerts(userId);
      const filteredAlerts = alerts.filter(alert => alert.id !== alertId);
      await AsyncStorage.setItem(this.ALERTS_STORAGE_KEY, JSON.stringify(filteredAlerts));
    } catch (error) {
      console.error('Error deleting price alert:', error);
      throw new Error('Failed to delete price alert');
    }
  }

  async getAllAlerts(userId: string): Promise<PriceAlert[]> {
    try {
      const alertsJson = await AsyncStorage.getItem(this.ALERTS_STORAGE_KEY);
      const alerts: PriceAlert[] = alertsJson ? JSON.parse(alertsJson) : [];
      return alerts.filter(alert => alert.userId === userId);
    } catch (error) {
      console.error('Error getting price alerts:', error);
      return [];
    }
  }

  // Price History Management
  async addPriceToHistory(data: PriceHistory): Promise<void> {
    try {
      const history = await this.getPriceHistory(data.productId);
      history.push({
        ...data,
        timestamp: new Date()
      });
      
      await AsyncStorage.setItem(
        `${this.PRICE_HISTORY_KEY}_${data.productId}`,
        JSON.stringify(history)
      );

      // Überprüfe Preisalarme nach der Aktualisierung
      await this.checkPriceAlerts(data.productId, data.price);
    } catch (error) {
      console.error('Error adding price to history:', error);
      throw new Error('Failed to add price to history');
    }
  }

  async getPriceHistory(productId: string): Promise<PriceHistory[]> {
    try {
      const historyJson = await AsyncStorage.getItem(
        `${this.PRICE_HISTORY_KEY}_${productId}`
      );
      return historyJson ? JSON.parse(historyJson) : [];
    } catch (error) {
      console.error('Error getting price history:', error);
      return [];
    }
  }

  async getPriceStats(productId: string): Promise<PriceHistoryStats> {
    try {
      const history = await this.getPriceHistory(productId);
      
      if (history.length === 0) {
        throw new Error('No price history available');
      }

      const prices = history.map(h => h.price);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentPrices = history
        .filter(h => new Date(h.timestamp) >= thirtyDaysAgo)
        .map(h => h.price);

      const oldestRecentPrice = recentPrices[0] || prices[0];
      const newestPrice = prices[prices.length - 1];
      const priceChange = ((newestPrice - oldestRecentPrice) / oldestRecentPrice) * 100;

      return {
        lowestPrice: Math.min(...prices),
        highestPrice: Math.max(...prices),
        averagePrice: prices.reduce((a, b) => a + b, 0) / prices.length,
        priceChange30Days: priceChange,
        priceHistory: history
      };
    } catch (error) {
      console.error('Error calculating price stats:', error);
      throw new Error('Failed to calculate price statistics');
    }
  }

  // Price Alert Checking
  private async checkPriceAlerts(productId: string, currentPrice: number): Promise<void> {
    try {
      const allAlerts = await AsyncStorage.getItem(this.ALERTS_STORAGE_KEY);
      if (!allAlerts) return;

      const alerts: PriceAlert[] = JSON.parse(allAlerts);
      const relevantAlerts = alerts.filter(
        alert => alert.productId === productId && alert.isActive
      );

      for (const alert of relevantAlerts) {
        const shouldNotify = 
          (alert.alertType === AlertType.ABOVE && currentPrice > alert.targetPrice) ||
          (alert.alertType === AlertType.BELOW && currentPrice < alert.targetPrice);

        if (shouldNotify) {
          this.notifyUser(alert, currentPrice);
          // Deaktiviere den Alarm nach der Benachrichtigung
          await this.updateAlert(alert.userId, alert.id, { isActive: false });
        }
      }
    } catch (error) {
      console.error('Error checking price alerts:', error);
    }
  }

  private async notifyUser(alert: PriceAlert, currentPrice: number): Promise<void> {
    const hasPermission = await notificationService.requestPermission();
    if (!hasPermission) {
      console.warn('Push notification permission not granted');
      return;
    }

    await notificationService.showPriceAlert(
      alert.productId, // Wir verwenden hier die ID als Namen, da wir keinen Produktnamen haben
      currentPrice,
      alert.targetPrice,
      alert.alertType === AlertType.ABOVE
    );
  }
}

export const priceAlertService = new PriceAlertService();