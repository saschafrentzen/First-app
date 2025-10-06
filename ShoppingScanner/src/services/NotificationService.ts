import notifee, {
  AndroidImportance,
  AndroidVisibility,
  AuthorizationStatus,
  Notification,
  NotificationAndroid,
  InitialNotification
} from '@notifee/react-native';

class NotificationService {
  private static instance: NotificationService;
  private channelId: string | undefined;

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

  public async getInitialNotification(): Promise<InitialNotification | null> {
    return await notifee.getInitialNotification();
  }
}

export const notificationService = NotificationService.getInstance();