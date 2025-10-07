import AsyncStorage from '@react-native-async-storage/async-storage';
import { secureStorage } from './SecureStorage';
import { privacyService } from './PrivacyService';
import * as FileSystem from 'expo-file-system';
import { File, Paths } from 'expo-file-system';

export interface ConsentRecord {
  consentId: string;
  purpose: string;
  granted: boolean;
  timestamp: string;
  version: string;
  dataCategories: string[];
}

export interface DataProcessingRecord {
  processId: string;
  purpose: string;
  dataCategories: string[];
  retention: number; // Aufbewahrungsdauer in Tagen
  legalBasis: 'consent' | 'contract' | 'legal_obligation' | 'vital_interests' | 'public_task' | 'legitimate_interests';
  recipients?: string[];
  thirdCountryTransfers?: string[];
  securityMeasures: string[];
}

export interface DataSubjectRequest {
  requestId: string;
  type: 'access' | 'rectification' | 'erasure' | 'restrict' | 'portability' | 'object';
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  timestamp: string;
  completionDate?: string;
  requestData?: any;
}

export interface GDPRSettings {
  dataRetentionPeriod: number;
  automaticDeletion: boolean;
  consentRequired: boolean;
  processingActivities: DataProcessingRecord[];
  currentPrivacyPolicyVersion: string;
}

class GDPRService {
  private static instance: GDPRService;
  private settings: GDPRSettings;
  private readonly STORAGE_KEY = 'gdpr_settings';
  private readonly CONSENT_KEY = 'gdpr_consents';
  private readonly REQUEST_KEY = 'gdpr_requests';

  private constructor() {
    this.settings = {
      dataRetentionPeriod: 365, // 1 Jahr
      automaticDeletion: true,
      consentRequired: true,
      processingActivities: [],
      currentPrivacyPolicyVersion: '1.0.0'
    };
  }

  public static getInstance(): GDPRService {
    if (!GDPRService.instance) {
      GDPRService.instance = new GDPRService();
    }
    return GDPRService.instance;
  }

  /**
   * Initialisiert den GDPRService
   */
  public async initialize(): Promise<void> {
    await this.loadSettings();
    await this.checkDataRetention();
  }

  /**
   * Verwaltet Benutzereinwilligungen
   */
  public async manageConsent(consentData: Partial<ConsentRecord>): Promise<void> {
    try {
      const consents = await this.getConsents();
      const existingIndex = consents.findIndex(c => c.consentId === consentData.consentId);
      
      const newConsent: ConsentRecord = {
        ...consents[existingIndex] || {},
        ...consentData,
        timestamp: new Date().toISOString(),
        version: this.settings.currentPrivacyPolicyVersion
      } as ConsentRecord;

      if (existingIndex >= 0) {
        consents[existingIndex] = newConsent;
      } else {
        consents.push(newConsent);
      }

      await AsyncStorage.setItem(this.CONSENT_KEY, JSON.stringify(consents));
    } catch (error) {
      console.error('Error managing consent:', error);
      throw new Error('Fehler bei der Einwilligungsverwaltung');
    }
  }

  /**
   * Erstellt einen Datenauskunftsreport
   */
  public async createDataReport(): Promise<string> {
    try {
      const data = await this.collectPersonalData();
      const report = {
        timestamp: new Date().toISOString(),
        subject: await this.getUserIdentifier(),
        data,
        processingActivities: this.settings.processingActivities,
        consents: await this.getConsents()
      };

      const fileName = `data_report_${Date.now()}.json`;
      const file = new File(Paths.document, fileName);
      file.create();
      await FileSystem.writeAsStringAsync(file.uri, JSON.stringify(report, null, 2));

      return file.uri;
    } catch (error) {
      console.error('Error creating data report:', error);
      throw new Error('Fehler beim Erstellen des Datenauskunftsreports');
    }
  }

  /**
   * Führt eine DSGVO-konforme Datenlöschung durch
   */
  public async erasePersonalData(): Promise<void> {
    try {
      // Dokumentiere Löschungsanfrage
      await this.logDataSubjectRequest({
        requestId: `erasure_${Date.now()}`,
        type: 'erasure',
        status: 'in_progress',
        timestamp: new Date().toISOString()
      });

      // Lösche personenbezogene Daten
      await this.deletePersonalData();

      // Aktualisiere Löschungsanfrage
      await this.updateRequestStatus(`erasure_${Date.now()}`, 'completed');
    } catch (error) {
      console.error('Error erasing personal data:', error);
      throw new Error('Fehler bei der Datenlöschung');
    }
  }

  /**
   * Protokolliert Datenverarbeitungsaktivitäten
   */
  public async logProcessingActivity(activity: DataProcessingRecord): Promise<void> {
    try {
      this.settings.processingActivities.push(activity);
      await this.saveSettings();
    } catch (error) {
      console.error('Error logging processing activity:', error);
      throw new Error('Fehler beim Protokollieren der Datenverarbeitung');
    }
  }

  /**
   * Verarbeitet Anfragen betroffener Personen
   */
  public async handleDataSubjectRequest(request: DataSubjectRequest): Promise<void> {
    try {
      switch (request.type) {
        case 'access':
          const reportPath = await this.createDataReport();
          request.requestData = { reportPath };
          break;
        case 'erasure':
          await this.erasePersonalData();
          break;
        case 'restrict':
          await this.restrictProcessing(request.requestData);
          break;
        // Weitere Anfragentypen hier implementieren
      }

      await this.logDataSubjectRequest(request);
    } catch (error) {
      console.error('Error handling data subject request:', error);
      throw new Error('Fehler bei der Bearbeitung der Anfrage');
    }
  }

  // Private Hilfsmethoden

  private async loadSettings(): Promise<void> {
    try {
      const storedSettings = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (storedSettings) {
        this.settings = JSON.parse(storedSettings);
      }
    } catch (error) {
      console.error('Error loading GDPR settings:', error);
    }
  }

  private async saveSettings(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Error saving GDPR settings:', error);
      throw new Error('Fehler beim Speichern der DSGVO-Einstellungen');
    }
  }

  private async getConsents(): Promise<ConsentRecord[]> {
    try {
      const consentsData = await AsyncStorage.getItem(this.CONSENT_KEY);
      return consentsData ? JSON.parse(consentsData) : [];
    } catch (error) {
      console.error('Error getting consents:', error);
      return [];
    }
  }

  private async collectPersonalData(): Promise<any> {
    // Implementiere hier die Sammlung aller personenbezogenen Daten
    // aus verschiedenen Speicherorten (AsyncStorage, SecureStore, etc.)
    return {};
  }

  private async deletePersonalData(): Promise<void> {
    // Implementiere hier die sichere Löschung aller personenbezogenen Daten
    await privacyService.deleteUserData();
  }

  private async checkDataRetention(): Promise<void> {
    if (!this.settings.automaticDeletion) return;

    try {
      const keys = await AsyncStorage.getAllKeys();
      const now = Date.now();

      for (const key of keys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          if (parsed.timestamp) {
            const age = now - new Date(parsed.timestamp).getTime();
            if (age > this.settings.dataRetentionPeriod * 24 * 60 * 60 * 1000) {
              await AsyncStorage.removeItem(key);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking data retention:', error);
    }
  }

  private async logDataSubjectRequest(request: DataSubjectRequest): Promise<void> {
    try {
      const requests = await this.getDataSubjectRequests();
      requests.push(request);
      await AsyncStorage.setItem(this.REQUEST_KEY, JSON.stringify(requests));
    } catch (error) {
      console.error('Error logging data subject request:', error);
    }
  }

  private async getDataSubjectRequests(): Promise<DataSubjectRequest[]> {
    try {
      const requestsData = await AsyncStorage.getItem(this.REQUEST_KEY);
      return requestsData ? JSON.parse(requestsData) : [];
    } catch (error) {
      console.error('Error getting data subject requests:', error);
      return [];
    }
  }

  private async updateRequestStatus(requestId: string, status: DataSubjectRequest['status']): Promise<void> {
    try {
      const requests = await this.getDataSubjectRequests();
      const requestIndex = requests.findIndex(r => r.requestId === requestId);
      if (requestIndex >= 0) {
        requests[requestIndex].status = status;
        requests[requestIndex].completionDate = new Date().toISOString();
        await AsyncStorage.setItem(this.REQUEST_KEY, JSON.stringify(requests));
      }
    } catch (error) {
      console.error('Error updating request status:', error);
    }
  }

  private async restrictProcessing(restrictions: any): Promise<void> {
    // Implementiere hier die Einschränkung der Datenverarbeitung
    // basierend auf den angegebenen Einschränkungen
  }

  private async getUserIdentifier(): Promise<string> {
    // Implementiere hier die Abrufung der Benutzerkennung
    return 'user_id';
  }
}

export const gdprService = GDPRService.getInstance();