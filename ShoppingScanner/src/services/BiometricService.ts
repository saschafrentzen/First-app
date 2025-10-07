import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

export interface BiometricSettings {
  enabled: boolean;
  requiredLevel: LocalAuthentication.SecurityLevel;
  lockTimeout: number; // Zeit in Millisekunden, nach der eine erneute Auth erforderlich ist
}

class BiometricService {
  private static instance: BiometricService;
  private settings: BiometricSettings = {
    enabled: false,
    requiredLevel: LocalAuthentication.SecurityLevel.BIOMETRIC,
    lockTimeout: 5 * 60 * 1000 // 5 Minuten
  };
  private lastAuthTime: number = 0;

  private constructor() {}

  public static getInstance(): BiometricService {
    if (!BiometricService.instance) {
      BiometricService.instance = new BiometricService();
    }
    return BiometricService.instance;
  }

  /**
   * Initialisiert den BiometricService
   */
  public async initialize(): Promise<void> {
    await this.loadSettings();
    const hasHardware = await this.checkBiometricHardware();
    if (!hasHardware) {
      this.settings.enabled = false;
      await this.saveSettings();
    }
  }

  /**
   * Prüft, ob biometrische Hardware verfügbar ist
   */
  public async checkBiometricHardware(): Promise<boolean> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return hasHardware && isEnrolled;
    } catch (error) {
      console.error('Error checking biometric hardware:', error);
      return false;
    }
  }

  /**
   * Aktiviert die biometrische Authentifizierung
   */
  public async enableBiometrics(): Promise<boolean> {
    try {
      const hasHardware = await this.checkBiometricHardware();
      if (!hasHardware) {
        throw new Error('Biometrische Hardware nicht verfügbar');
      }

      this.settings.enabled = true;
      await this.saveSettings();
      return true;
    } catch (error) {
      console.error('Error enabling biometrics:', error);
      return false;
    }
  }

  /**
   * Deaktiviert die biometrische Authentifizierung
   */
  public async disableBiometrics(): Promise<void> {
    this.settings.enabled = false;
    await this.saveSettings();
  }

  /**
   * Führt eine biometrische Authentifizierung durch
   */
  public async authenticate(reason: string = 'Bitte authentifizieren Sie sich'): Promise<boolean> {
    try {
      if (!this.settings.enabled) return true;
      
      // Prüfen, ob die letzte Authentifizierung noch gültig ist
      if (this.isAuthenticationValid()) {
        return true;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason,
        fallbackLabel: 'PIN verwenden',
        disableDeviceFallback: false,
        cancelLabel: 'Abbrechen'
      });

      if (result.success) {
        this.lastAuthTime = Date.now();
      }

      return result.success;
    } catch (error) {
      console.error('Error during authentication:', error);
      return false;
    }
  }

  /**
   * Speichert einen Wert im sicheren Speicher
   */
  public async secureStore(key: string, value: string): Promise<void> {
    try {
      const authenticated = await this.authenticate('Zugriff auf geschützte Daten');
      if (!authenticated) {
        throw new Error('Authentifizierung fehlgeschlagen');
      }

      await SecureStore.setItemAsync(key, value, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED
      });
    } catch (error) {
      console.error('Error storing secure data:', error);
      throw error;
    }
  }

  /**
   * Lädt einen Wert aus dem sicheren Speicher
   */
  public async secureRetrieve(key: string): Promise<string | null> {
    try {
      const authenticated = await this.authenticate('Zugriff auf geschützte Daten');
      if (!authenticated) {
        throw new Error('Authentifizierung fehlgeschlagen');
      }

      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('Error retrieving secure data:', error);
      return null;
    }
  }

  /**
   * Prüft die verfügbaren biometrischen Funktionen
   */
  public async getSupportedBiometrics(): Promise<LocalAuthentication.AuthenticationType[]> {
    try {
      return await LocalAuthentication.supportedAuthenticationTypesAsync();
    } catch (error) {
      console.error('Error getting supported biometrics:', error);
      return [];
    }
  }

  /**
   * Aktualisiert die Einstellungen für die biometrische Authentifizierung
   */
  public async updateSettings(newSettings: Partial<BiometricSettings>): Promise<void> {
    this.settings = {
      ...this.settings,
      ...newSettings
    };
    await this.saveSettings();
  }

  private async loadSettings(): Promise<void> {
    try {
      const stored = await SecureStore.getItemAsync('biometricSettings');
      if (stored) {
        this.settings = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading biometric settings:', error);
    }
  }

  private async saveSettings(): Promise<void> {
    try {
      await SecureStore.setItemAsync(
        'biometricSettings',
        JSON.stringify(this.settings)
      );
    } catch (error) {
      console.error('Error saving biometric settings:', error);
    }
  }

  private isAuthenticationValid(): boolean {
    if (!this.lastAuthTime) return false;
    return Date.now() - this.lastAuthTime < this.settings.lockTimeout;
  }

  /**
   * Gibt die aktuellen Einstellungen zurück
   */
  public getSettings(): BiometricSettings {
    return { ...this.settings };
  }
}

export const biometricService = BiometricService.getInstance();