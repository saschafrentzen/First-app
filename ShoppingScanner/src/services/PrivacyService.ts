import AsyncStorage from '@react-native-async-storage/async-storage';
import { secureStorage } from './SecureStorage';
import { biometricService } from './BiometricService';

export interface PrivacySettings {
  // Grundlegende Datenschutzeinstellungen
  dataCollection: boolean;
  analyticsEnabled: boolean;
  locationTracking: boolean;
  
  // Datenspeicherung
  storageEncryption: boolean;
  autoDeleteDays: number | null;
  
  // Datenweitergabe
  thirdPartySharing: boolean;
  marketingCommunication: boolean;
  
  // Sicherheit
  biometricAuth: boolean;
  passwordProtection: boolean;
  
  // Berechtigungen
  cameraAccess: boolean;
  locationAccess: boolean;
  notificationAccess: boolean;
  
  // DSGVO-spezifische Einstellungen
  gdprConsent: boolean;
  dataExportEnabled: boolean;
  rightToBeForgotten: boolean;
}

export interface DataCategory {
  id: string;
  name: string;
  description: string;
  retention: number; // Aufbewahrungsdauer in Tagen
  required: boolean;
}

export interface PrivacyInfo {
  lastUpdated: string;
  version: string;
  dataCategories: DataCategory[];
}

class PrivacyService {
  private static instance: PrivacyService;
  private settings: PrivacySettings;
  private readonly STORAGE_KEY = 'privacy_settings';
  private readonly INFO_KEY = 'privacy_info';

  private constructor() {
    // Standardeinstellungen
    this.settings = {
      dataCollection: false,
      analyticsEnabled: false,
      locationTracking: false,
      storageEncryption: true,
      autoDeleteDays: 90,
      thirdPartySharing: false,
      marketingCommunication: false,
      biometricAuth: false,
      passwordProtection: false,
      cameraAccess: false,
      locationAccess: false,
      notificationAccess: false,
      gdprConsent: false,
      dataExportEnabled: true,
      rightToBeForgotten: true
    };
  }

  public static getInstance(): PrivacyService {
    if (!PrivacyService.instance) {
      PrivacyService.instance = new PrivacyService();
    }
    return PrivacyService.instance;
  }

  /**
   * Initialisiert den PrivacyService
   */
  public async initialize(): Promise<void> {
    await this.loadSettings();
    // Synchronisiere biometrische Authentifizierung
    this.settings.biometricAuth = biometricService.getSettings().enabled;
  }

  /**
   * Aktualisiert die Datenschutzeinstellungen
   */
  public async updateSettings(newSettings: Partial<PrivacySettings>): Promise<void> {
    this.settings = {
      ...this.settings,
      ...newSettings
    };
    await this.saveSettings();

    // Wende Einstellungen an
    if (newSettings.biometricAuth !== undefined) {
      await biometricService.updateSettings({ enabled: newSettings.biometricAuth });
    }
  }

  /**
   * Gibt die aktuellen Datenschutzeinstellungen zurück
   */
  public getSettings(): PrivacySettings {
    return { ...this.settings };
  }

  /**
   * Prüft, ob bestimmte Datenzugriffe erlaubt sind
   */
  public isAccessAllowed(category: keyof PrivacySettings): boolean {
    const value = this.settings[category];
    return typeof value === 'boolean' ? value : false;
  }

  /**
   * Führt eine DSGVO-konforme Datenlöschung durch
   */
  public async deleteUserData(): Promise<void> {
    try {
      // Lösche alle lokalen Daten
      await AsyncStorage.clear();
      
      // Lösche sichere Daten
      // Lösche wichtige sichere Daten
      const secureKeys = ['user_key', 'auth_token', 'biometric_key']; // Liste der bekannten Schlüssel
      for (const key of secureKeys) {
        await secureStorage.removeItem(key);
      }

      // Setze Einstellungen zurück
      this.settings = {
        ...this.settings,
        dataCollection: false,
        analyticsEnabled: false,
        locationTracking: false
      };
      await this.saveSettings();
    } catch (error) {
      console.error('Error deleting user data:', error);
      throw new Error('Fehler beim Löschen der Benutzerdaten');
    }
  }

  /**
   * Exportiert alle Benutzerdaten im DSGVO-konformen Format
   */
  public async exportUserData(): Promise<string> {
    try {
      const userData: any = {};
      
      // Sammle Daten aus AsyncStorage
      const allKeys = await AsyncStorage.getAllKeys();
      for (const key of allKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          userData[key] = value;
        }
      }

      // Füge Metadaten hinzu
      const exportData = {
        timestamp: new Date().toISOString(),
        settings: this.settings,
        userData: userData,
        privacyInfo: await this.getPrivacyInfo()
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting user data:', error);
      throw new Error('Fehler beim Exportieren der Benutzerdaten');
    }
  }

  /**
   * Prüft, ob Daten aufgrund der Aufbewahrungsfrist gelöscht werden müssen
   */
  public async checkDataRetention(): Promise<void> {
    if (!this.settings.autoDeleteDays) return;

    try {
      const info = await this.getPrivacyInfo();
      const now = new Date();
      
      for (const category of info.dataCategories) {
        if (category.retention > 0) {
          const expiryDate = new Date(now.getTime() - (category.retention * 24 * 60 * 60 * 1000));
          // Implementiere hier die kategoriesspezifische Datenlöschung
        }
      }
    } catch (error) {
      console.error('Error checking data retention:', error);
    }
  }

  private async loadSettings(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.settings = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading privacy settings:', error);
    }
  }

  private async saveSettings(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify(this.settings)
      );
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      throw error;
    }
  }

  private async getPrivacyInfo(): Promise<PrivacyInfo> {
    try {
      const stored = await AsyncStorage.getItem(this.INFO_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      
      // Standardinformationen
      return {
        lastUpdated: new Date().toISOString(),
        version: '1.0',
        dataCategories: [
          {
            id: 'personal',
            name: 'Persönliche Daten',
            description: 'Name, E-Mail, etc.',
            retention: 365,
            required: true
          },
          {
            id: 'shopping',
            name: 'Einkaufsdaten',
            description: 'Einkaufslisten und Historien',
            retention: 90,
            required: false
          },
          {
            id: 'location',
            name: 'Standortdaten',
            description: 'GPS-Daten für Geschäfte',
            retention: 30,
            required: false
          }
        ]
      };
    } catch (error) {
      console.error('Error getting privacy info:', error);
      throw error;
    }
  }
}

export const privacyService = PrivacyService.getInstance();