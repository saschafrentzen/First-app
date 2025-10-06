import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { notificationService } from '../services/NotificationService';

export const useNotificationPermission = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    try {
      const permission = await notificationService.requestPermission();
      setHasPermission(permission);
    } catch (error) {
      console.error('Error checking notification permission:', error);
      setHasPermission(false);
    } finally {
      setIsLoading(false);
    }
  };

  const requestPermission = async () => {
    try {
      setIsLoading(true);
      const granted = await notificationService.requestPermission();
      setHasPermission(granted);

      if (!granted) {
        Alert.alert(
          'Benachrichtigungen deaktiviert',
          'Bitte aktiviere Benachrichtigungen in deinen Geräteeinstellungen, um Preisalarme zu erhalten.',
          [
            { text: 'Später', style: 'cancel' },
            { 
              text: 'Einstellungen',
              onPress: () => {
                // Hier könnte man die Geräteeinstellungen öffnen
                // Dies erfordert zusätzliche Pakete wie react-native-permissions
              }
            }
          ]
        );
      }

      return granted;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      setHasPermission(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    hasPermission,
    isLoading,
    requestPermission,
    checkPermission
  };
};