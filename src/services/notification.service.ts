import notifee, { 
  AndroidImportance, 
  AndroidNotificationSetting, 
  AuthorizationStatus,
  NotificationSettings
} from '@notifee/react-native';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BudgetNotification } from '../types/budget';

interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
}

class NotificationService {
  private static instance: NotificationService;
  private notificationSettings: NotificationSettings | null = null;

  private constructor() {
    this.initialize();
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private async initialize(): Promise<void> {
    try {
      // Initialisiere notifee und hole Berechtigungen
      await this.requestPermissions();
      
      // Hole aktuelle Einstellungen
      this.notificationSettings = await notifee.getNotificationSettings();

      // Erstelle Benachrichtigungskanäle für Android
      if (Platform.OS === 'android') {
        await this.createNotificationChannels();
      }
    } catch (error) {
      console.error('Fehler bei der Initialisierung des NotificationService:', error);
    }
  }

  private async requestPermissions(): Promise<void> {
    try {
      const settings = await notifee.requestPermission();

      if (settings.authorizationStatus === AuthorizationStatus.DENIED) {
        console.log('Benutzer hat Benachrichtigungen abgelehnt');
      } else if (settings.authorizationStatus === AuthorizationStatus.AUTHORIZED) {
        console.log('Benutzer hat Benachrichtigungen erlaubt');
      }
    } catch (error) {
      console.error('Fehler beim Anfordern der Berechtigungen:', error);
    }
  }

  private async createNotificationChannels(): Promise<void> {
    try {
      // Kanal für Budget-Warnungen
      await notifee.createChannel({
        id: 'budget_warnings',
        name: 'Budget Warnungen',
        description: 'Benachrichtigungen über Budget-Limits und Warnungen',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
        vibrationPattern: [300, 500],
        lights: true,
        lightColor: '#FF0000',
      });

      // Kanal für kritische Budget-Alarme
      await notifee.createChannel({
        id: 'budget_critical',
        name: 'Kritische Budget-Alarme',
        description: 'Dringende Benachrichtigungen bei kritischen Budget-Überschreitungen',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
        vibrationPattern: [0, 500, 200, 500],
        lights: true,
        lightColor: '#FF0000',
      });
    } catch (error) {
      console.error('Fehler beim Erstellen der Benachrichtigungskanäle:', error);
    }
  }

  async sendPushNotification(payload: PushNotificationPayload): Promise<void> {
    try {
      // Prüfe ob Benachrichtigungen aktiv sind
      if (!await this.areNotificationsEnabled()) {
        console.log('Benachrichtigungen sind deaktiviert');
        return;
      }

      // Bestimme den Benachrichtigungskanal basierend auf dem Typ
      const channelId = this.getChannelId(payload.data?.type || 'warning');

      await notifee.displayNotification({
        title: payload.title,
        body: payload.body,
        data: payload.data,
        android: {
          channelId,
          importance: AndroidImportance.HIGH,
          pressAction: {
            id: 'default',
          },
        },
        ios: {
          // iOS spezifische Konfiguration
          categoryId: 'budget',
          sound: 'default',
        },
      });

      // Speichere die Benachrichtigung für spätere Referenz
      await this.saveNotificationHistory({
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        ...payload,
      });
    } catch (error) {
      console.error('Fehler beim Senden der Push-Benachrichtigung:', error);
      throw error;
    }
  }

  async sendInAppNotification(notification: BudgetNotification): Promise<void> {
    try {
      // Implementiere In-App-Benachrichtigungen
      // Dies könnte über einen Event-Bus, Redux oder einen anderen State-Management-Mechanismus erfolgen
      console.log('In-App-Benachrichtigung:', notification);
    } catch (error) {
      console.error('Fehler beim Senden der In-App-Benachrichtigung:', error);
      throw error;
    }
  }

  private async areNotificationsEnabled(): Promise<boolean> {
    try {
      const settings = await notifee.getNotificationSettings();
      
      if (Platform.OS === 'ios') {
        return settings.authorizationStatus === AuthorizationStatus.AUTHORIZED;
      } else {
        // Für Android
        return settings.android?.alarm === AndroidNotificationSetting.ENABLED;
      }
    } catch (error) {
      console.error('Fehler beim Prüfen der Benachrichtigungseinstellungen:', error);
      return false;
    }
  }

  private getChannelId(type: string): string {
    switch (type.toLowerCase()) {
      case 'critical':
        return 'budget_critical';
      case 'warning':
      default:
        return 'budget_warnings';
    }
  }

  private async saveNotificationHistory(notification: any): Promise<void> {
    try {
      const history = await this.getNotificationHistory();
      history.unshift(notification);
      
      // Begrenze die Historie auf die letzten 100 Benachrichtigungen
      const trimmedHistory = history.slice(0, 100);
      
      await AsyncStorage.setItem(
        'notification_history',
        JSON.stringify(trimmedHistory)
      );
    } catch (error) {
      console.error('Fehler beim Speichern der Benachrichtigungshistorie:', error);
    }
  }

  private async getNotificationHistory(): Promise<any[]> {
    try {
      const history = await AsyncStorage.getItem('notification_history');
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Fehler beim Laden der Benachrichtigungshistorie:', error);
      return [];
    }
  }

  // Weitere Hilfsmethoden
  async clearNotificationHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem('notification_history');
    } catch (error) {
      console.error('Fehler beim Löschen der Benachrichtigungshistorie:', error);
    }
  }

  async getNotificationSettings(): Promise<NotificationSettings | null> {
    return this.notificationSettings;
  }
}

export const notificationService = NotificationService.getInstance();