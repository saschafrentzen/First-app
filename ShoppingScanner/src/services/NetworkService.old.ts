import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

class NetworkService {
  private static instance: NetworkService;

  private constructor() {}

  public static getInstance(): NetworkService {
    if (!NetworkService.instance) {
      NetworkService.instance = new NetworkService();
    }
    return NetworkService.instance;
  }

  export const networkService = NetworkService.getInstance();

  /**
   * Führt einen Ping zu einer IP-Adresse durch
   */
  public async ping(ipAddress: string): Promise<{ success: boolean; latency?: number }> {
    try {
      // Prüfe erst Netzwerkverbindung
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        throw new Error('Keine Netzwerkverbindung');
      }

      // Setze Timeout für den Request
      const timeout = 5000;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Versuche HTTP-Request (viele Smart Home Geräte haben einen Web Server)
      const start = Date.now();
      const response = await fetch(`http://${ipAddress}`, {
        method: 'HEAD',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const latency = Date.now() - start;

      return {
        success: response.ok,
        latency
      };
    } catch (error) {
      // Bei Timeout oder anderen Fehlern
      return { success: false };
    }
  }
}

// Exportiere eine Singleton-Instanz
const networkService = NetworkService.getInstance();
export { networkService };

export const networkService = NetworkService.getInstance();