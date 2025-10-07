import notifee, {
  AndroidImportance,
  AndroidVisibility,
  AuthorizationStatus,
  Notification,
  NotificationAndroid,
  InitialNotification,
  TimestampTrigger,
  TriggerType
} from '@notifee/react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

interface ScheduledPriceAlert {
  alertId: string;
  productId: string;
  productName: string;
  maxPrice: number;
  minPrice?: number;
  frequency: 'immediately' | 'daily' | 'weekly';
  lastCheck?: string;
  nextCheck?: string;
  notificationId?: string;
}

class NotificationService {
  private static instance: NotificationService;
  private channelId: string | undefined;
  private readonly priceAlertsCollection = 'price_alerts';
  private readonly usersCollection = 'users';

  private constructor() {
    this.createNotificationChannel();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private async createNotificationChannel() {
    this.channelId = await notifee.createChannel({
      id: 'price-alerts',
      name: 'Preisalarme',
      description: 'Benachrichtigungen über Preisänderungen',
      lights: false,
      vibration: true,
      importance: AndroidImportance.HIGH,
      visibility: AndroidVisibility.PUBLIC,
    });
  }

  public async requestPermission(): Promise<boolean> {
    const settings = await notifee.requestPermission();
    return settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED;
  }

  public async showPriceAlert(
    productName: string,
    currentPrice: number,
    targetPrice: number,
    isAboveTarget: boolean
  ): Promise<void> {
    if (!this.channelId) {
      await this.createNotificationChannel();
    }

    const priceDirection = isAboveTarget ? 'über' : 'unter';
    const formattedCurrentPrice = currentPrice.toFixed(2);
    const formattedTargetPrice = targetPrice.toFixed(2);

    const notification: Notification = {
      title: `🔔 Preisalarm für ${productName}`,
      body: `Der Preis ist jetzt ${priceDirection} deinem Zielpreis!\nAktuell: ${formattedCurrentPrice}€\nZiel: ${formattedTargetPrice}€`,
      android: {
        channelId: this.channelId!,
        pressAction: {
          id: 'price-alert',
          launchActivity: 'default',
        },
        importance: AndroidImportance.HIGH,
        smallIcon: 'ic_notification',
        largeIcon: 'ic_launcher',
        visibility: AndroidVisibility.PUBLIC,
        actions: [
          {
            title: 'Anzeigen',
            pressAction: {
              id: 'show-product',
            },
          },
          {
            title: 'Später',
            pressAction: {
              id: 'dismiss',
            },
          },
        ],
      },
    };

    try {
      await notifee.displayNotification(notification);
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  public async cancelAllNotifications(): Promise<void> {
    await notifee.cancelAllNotifications();
  }

  public async cancelNotification(notificationId: string): Promise<void> {
    await notifee.cancelNotification(notificationId);
  }

  /**
   * Registriert das Gerät für Push-Benachrichtigungen
   */
  public async registerDevice(): Promise<void> {
    const settings = await this.requestPermission();
    if (!settings) return;

    const user = auth().currentUser;
    if (!user) return;

    // Registriere Gerät in Firestore für Push-Benachrichtigungen
    await firestore()
      .collection(this.usersCollection)
      .doc(user.uid)
      .set(
        {
          deviceRegistered: true,
          deviceRegisteredAt: new Date().toISOString(),
          lastActive: new Date().toISOString(),
        },
        { merge: true }
      );
  }

  /**
   * Richtet Benachrichtigungen für einen Preisalarm ein
   */
  public async setupPriceAlertNotifications(
    alert: ScheduledPriceAlert
  ): Promise<void> {
    // Lösche bestehende Benachrichtigungen für diesen Alert
    if (alert.notificationId) {
      await this.cancelNotification(alert.notificationId);
    }

    let trigger: TimestampTrigger | undefined;

    switch (alert.frequency) {
      case 'daily': {
        // Täglich um 10:00 Uhr
        const date = new Date();
        date.setHours(10, 0, 0, 0);
        if (date.getTime() < Date.now()) {
          date.setDate(date.getDate() + 1);
        }

        trigger = {
          type: TriggerType.TIMESTAMP,
          timestamp: date.getTime(),
          repeatFrequency: 1000 * 60 * 60 * 24, // 24 Stunden
        };
        break;
      }

      case 'weekly': {
        // Wöchentlich am Montag um 10:00 Uhr
        const date = new Date();
        date.setHours(10, 0, 0, 0);
        // Setze auf nächsten Montag
        const daysUntilMonday = (8 - date.getDay()) % 7;
        date.setDate(date.getDate() + daysUntilMonday);

        trigger = {
          type: TriggerType.TIMESTAMP,
          timestamp: date.getTime(),
          repeatFrequency: 1000 * 60 * 60 * 24 * 7, // 7 Tage
        };
        break;
      }

      case 'immediately':
      default:
        // Keine geplante Benachrichtigung für sofortige Alarme
        return;
    }

    const notification: Notification = {
      title: 'Preisalarm Check',
      body: `Wir suchen nach Angeboten für ${alert.productName} ${alert.maxPrice ? `unter ${alert.maxPrice}€` : ''}`,
      android: {
        channelId: this.channelId!,
        pressAction: {
          id: 'price-alert-check',
          launchActivity: 'default',
        },
        importance: AndroidImportance.HIGH,
        smallIcon: 'ic_notification',
        actions: [
          {
            title: 'Jetzt checken',
            pressAction: {
              id: 'check-now',
            },
          },
          {
            title: 'Später',
            pressAction: {
              id: 'dismiss',
            },
          },
        ],
      },
      data: {
        alertId: alert.alertId,
        productId: alert.productId,
        type: 'price-alert-check',
      },
    };

    try {
      const notificationId = await notifee.createTriggerNotification(
        notification,
        trigger
      );

      // Aktualisiere den Alert in Firestore mit der Notification ID
      await firestore()
        .collection(this.priceAlertsCollection)
        .doc(alert.alertId)
        .update({
          notificationId,
          nextCheck: new Date(trigger?.timestamp || Date.now()).toISOString(),
        });

    } catch (error) {
      console.error('Error setting up price alert notification:', error);
    }
  }

  /**
   * Sendet eine Benachrichtigung über einen gefundenen günstigen Preis
   */
  public async sendPriceFoundNotification(
    alertId: string,
    productName: string,
    price: number,
    storeName: string,
    storeAddress: string
  ): Promise<void> {
    const notification: Notification = {
      title: '💰 Günstiger Preis gefunden!',
      body: `${productName} ist bei ${storeName} für ${price.toFixed(2)}€ verfügbar!\n${storeAddress}`,
      android: {
        channelId: this.channelId!,
        pressAction: {
          id: 'price-found',
          launchActivity: 'default',
        },
        importance: AndroidImportance.HIGH,
        smallIcon: 'ic_notification',
        largeIcon: 'ic_launcher',
        actions: [
          {
            title: 'Route anzeigen',
            pressAction: {
              id: 'show-route',
            },
          },
          {
            title: 'Später',
            pressAction: {
              id: 'dismiss',
            },
          },
        ],
      },
      data: {
        alertId,
        type: 'price-found',
        price: price.toString(),
        storeName,
        storeAddress,
      },
    };

    try {
      await notifee.displayNotification(notification);
    } catch (error) {
      console.error('Error sending price found notification:', error);
    }
  }

  public async getInitialNotification(): Promise<InitialNotification | null> {
    return await notifee.getInitialNotification();
  }
}

export const notificationService = NotificationService.getInstance();