import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { File, Paths } from 'expo-file-system';
import { gdprService } from './GDPRService';

export interface ConsentVersion {
  version: string;
  date: string;
  changes: string[];
  content: string;
}

export interface ConsentCategory {
  id: string;
  name: string;
  description: string;
  required: boolean;
  purposes: string[];
  dataTypes: string[];
}

export interface ConsentRecord {
  userId: string;
  consentId: string;
  category: string;
  granted: boolean;
  timestamp: string;
  version: string;
  method: 'explicit' | 'implicit';
  deviceInfo: {
    platform: string;
    deviceId: string;
    appVersion: string;
  };
}

class ConsentManagementService {
  private static instance: ConsentManagementService;
  private readonly STORAGE_KEY = 'consent_records';
  private readonly VERSION_KEY = 'consent_versions';
  private readonly CATEGORY_KEY = 'consent_categories';
  private consentVersions: ConsentVersion[] = [];
  private consentCategories: ConsentCategory[] = [];

  private constructor() {
    this.initializeConsentCategories();
  }

  public static getInstance(): ConsentManagementService {
    if (!ConsentManagementService.instance) {
      ConsentManagementService.instance = new ConsentManagementService();
    }
    return ConsentManagementService.instance;
  }

  /**
   * Initialisiert die Einwilligungskategorien
   */
  private async initializeConsentCategories(): Promise<void> {
    this.consentCategories = [
      {
        id: 'essential',
        name: 'Wesentliche Funktionen',
        description: 'Notwendig für die grundlegende Funktionalität der App',
        required: true,
        purposes: ['app_functionality', 'security'],
        dataTypes: ['device_info', 'app_settings']
      },
      {
        id: 'analytics',
        name: 'Analyse',
        description: 'Hilft uns, die App zu verbessern',
        required: false,
        purposes: ['analytics', 'app_improvement'],
        dataTypes: ['usage_data', 'performance_data']
      },
      {
        id: 'marketing',
        name: 'Marketing',
        description: 'Personalisierte Werbung und Angebote',
        required: false,
        purposes: ['marketing', 'advertising'],
        dataTypes: ['preferences', 'behavior_data']
      },
      {
        id: 'location',
        name: 'Standort',
        description: 'Standortbasierte Dienste und Angebote',
        required: false,
        purposes: ['location_services', 'nearby_stores'],
        dataTypes: ['location_data', 'store_preferences']
      }
    ];

    await this.saveConsentCategories();
  }

  /**
   * Registriert eine neue Einwilligungsversion
   */
  public async registerConsentVersion(version: ConsentVersion): Promise<void> {
    try {
      const versions = await this.getConsentVersions();
      versions.push(version);
      await AsyncStorage.setItem(this.VERSION_KEY, JSON.stringify(versions));
      this.consentVersions = versions;
    } catch (error) {
      console.error('Error registering consent version:', error);
      throw new Error('Fehler beim Registrieren der Einwilligungsversion');
    }
  }

  /**
   * Speichert eine Einwilligung
   */
  public async recordConsent(record: Omit<ConsentRecord, 'timestamp'>): Promise<void> {
    try {
      const records = await this.getConsentRecords();
      const newRecord: ConsentRecord = {
        ...record,
        timestamp: new Date().toISOString()
      };

      // Aktualisiere bestehende Einwilligung oder füge neue hinzu
      const existingIndex = records.findIndex(
        r => r.userId === record.userId && r.consentId === record.consentId
      );

      if (existingIndex >= 0) {
        records[existingIndex] = newRecord;
      } else {
        records.push(newRecord);
      }

      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(records));

      // Protokolliere in GDPR Service
      await gdprService.manageConsent({
        consentId: record.consentId,
        purpose: record.category,
        granted: record.granted,
        version: record.version,
        dataCategories: this.getDataCategoriesForConsent(record.category)
      });

    } catch (error) {
      console.error('Error recording consent:', error);
      throw new Error('Fehler beim Speichern der Einwilligung');
    }
  }

  /**
   * Prüft den Einwilligungsstatus
   */
  public async checkConsentStatus(userId: string, categoryId: string): Promise<boolean> {
    try {
      const records = await this.getConsentRecords();
      const latestConsent = records
        .filter(r => r.userId === userId && r.category === categoryId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

      return latestConsent?.granted ?? false;
    } catch (error) {
      console.error('Error checking consent status:', error);
      return false;
    }
  }

  /**
   * Erstellt einen Einwilligungs-Audit-Trail
   */
  public async generateConsentAudit(userId: string): Promise<string> {
    try {
      const records = await this.getConsentRecords();
      const userRecords = records.filter(r => r.userId === userId);
      
      const audit = {
        userId,
        timestamp: new Date().toISOString(),
        consentHistory: userRecords.map(record => ({
          category: record.category,
          status: record.granted ? 'Erteilt' : 'Widerrufen',
          date: record.timestamp,
          version: record.version,
          method: record.method,
          deviceInfo: record.deviceInfo
        }))
      };

      const fileName = `consent_audit_${userId}_${Date.now()}.json`;
      const file = new File(Paths.document, fileName);
      file.create();
      await FileSystem.writeAsStringAsync(file.uri, JSON.stringify(audit, null, 2));

      return file.uri;
    } catch (error) {
      console.error('Error generating consent audit:', error);
      throw new Error('Fehler beim Erstellen des Einwilligungs-Audit-Trails');
    }
  }

  /**
   * Überprüft, ob Einwilligungen aktualisiert werden müssen
   */
  public async checkConsentUpdatesNeeded(userId: string): Promise<boolean> {
    try {
      const records = await this.getConsentRecords();
      const versions = await this.getConsentVersions();
      const latestVersion = versions[versions.length - 1]?.version;

      if (!latestVersion) return false;

      const userConsents = records.filter(r => r.userId === userId);
      return userConsents.some(consent => consent.version !== latestVersion);
    } catch (error) {
      console.error('Error checking consent updates:', error);
      return false;
    }
  }

  /**
   * Gibt alle Einwilligungskategorien zurück
   */
  public async getCategories(): Promise<ConsentCategory[]> {
    try {
      const categoriesData = await AsyncStorage.getItem(this.CATEGORY_KEY);
      return categoriesData ? JSON.parse(categoriesData) : this.consentCategories;
    } catch (error) {
      console.error('Error getting consent categories:', error);
      return this.consentCategories;
    }
  }

  // Private Hilfsmethoden

  private async getConsentRecords(): Promise<ConsentRecord[]> {
    try {
      const recordsData = await AsyncStorage.getItem(this.STORAGE_KEY);
      return recordsData ? JSON.parse(recordsData) : [];
    } catch (error) {
      console.error('Error getting consent records:', error);
      return [];
    }
  }

  private async getConsentVersions(): Promise<ConsentVersion[]> {
    if (this.consentVersions.length > 0) return this.consentVersions;

    try {
      const versionsData = await AsyncStorage.getItem(this.VERSION_KEY);
      this.consentVersions = versionsData ? JSON.parse(versionsData) : [];
      return this.consentVersions;
    } catch (error) {
      console.error('Error getting consent versions:', error);
      return [];
    }
  }

  private async saveConsentCategories(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.CATEGORY_KEY,
        JSON.stringify(this.consentCategories)
      );
    } catch (error) {
      console.error('Error saving consent categories:', error);
    }
  }

  private getDataCategoriesForConsent(categoryId: string): string[] {
    const category = this.consentCategories.find(c => c.id === categoryId);
    return category ? category.dataTypes : [];
  }
}

export const consentManagementService = ConsentManagementService.getInstance();