import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { File, Paths } from 'expo-file-system';
import { gdprService } from './GDPRService';

export interface ProcessingActivity {
  id: string;
  category: string;
  purpose: string;
  dataCategories: string[];
  legalBasis: string;
  retention: number; // in days
  recipients?: string[];
  thirdCountryTransfers?: {
    country: string;
    safeguards: string[];
  }[];
  securityMeasures: string[];
  lastUpdated: string;
}

export interface ProcessingRegister {
  organizationInfo: {
    name: string;
    address: string;
    dpo?: string;
    contact: string;
  };
  activities: ProcessingActivity[];
  lastUpdated: string;
  version: string;
}

class ProcessingRegisterService {
  private static instance: ProcessingRegisterService;
  private register: ProcessingRegister;
  private readonly STORAGE_KEY = 'processing_register';
  
  private constructor() {
    // Initialize with default organization info
    this.register = {
      organizationInfo: {
        name: 'ShoppingScanner App',
        address: 'Musterstraße 1, 12345 Musterstadt',
        contact: 'privacy@shoppingscanner.app'
      },
      activities: [],
      lastUpdated: new Date().toISOString(),
      version: '1.0.0'
    };
  }

  public static getInstance(): ProcessingRegisterService {
    if (!ProcessingRegisterService.instance) {
      ProcessingRegisterService.instance = new ProcessingRegisterService();
    }
    return ProcessingRegisterService.instance;
  }

  /**
   * Initialisiert das Verarbeitungsverzeichnis
   */
  public async initialize(): Promise<void> {
    await this.loadRegister();
    await this.initializeDefaultActivities();
  }

  /**
   * Fügt eine neue Verarbeitungsaktivität hinzu
   */
  public async addProcessingActivity(activity: Omit<ProcessingActivity, 'id' | 'lastUpdated'>): Promise<string> {
    try {
      const newActivity: ProcessingActivity = {
        ...activity,
        id: `proc_${Date.now()}`,
        lastUpdated: new Date().toISOString()
      };

      this.register.activities.push(newActivity);
      this.register.lastUpdated = new Date().toISOString();
      await this.saveRegister();

      // Log in GDPR service
      await gdprService.logProcessingActivity({
        processId: newActivity.id,
        purpose: newActivity.purpose,
        dataCategories: newActivity.dataCategories,
        retention: newActivity.retention,
        legalBasis: newActivity.legalBasis as any,
        recipients: newActivity.recipients,
        thirdCountryTransfers: newActivity.thirdCountryTransfers?.map(t => t.country),
        securityMeasures: newActivity.securityMeasures
      });

      return newActivity.id;
    } catch (error) {
      console.error('Error adding processing activity:', error);
      throw new Error('Fehler beim Hinzufügen der Verarbeitungsaktivität');
    }
  }

  /**
   * Aktualisiert eine bestehende Verarbeitungsaktivität
   */
  public async updateProcessingActivity(id: string, updates: Partial<ProcessingActivity>): Promise<void> {
    try {
      const index = this.register.activities.findIndex(a => a.id === id);
      if (index === -1) throw new Error('Verarbeitungsaktivität nicht gefunden');

      this.register.activities[index] = {
        ...this.register.activities[index],
        ...updates,
        lastUpdated: new Date().toISOString()
      };

      this.register.lastUpdated = new Date().toISOString();
      await this.saveRegister();

      // Log update in GDPR service
      const activity = this.register.activities[index];
      await gdprService.logProcessingActivity({
        processId: activity.id,
        purpose: activity.purpose,
        dataCategories: activity.dataCategories,
        retention: activity.retention,
        legalBasis: activity.legalBasis as any,
        recipients: activity.recipients,
        thirdCountryTransfers: activity.thirdCountryTransfers?.map(t => t.country),
        securityMeasures: activity.securityMeasures
      });
    } catch (error) {
      console.error('Error updating processing activity:', error);
      throw new Error('Fehler beim Aktualisieren der Verarbeitungsaktivität');
    }
  }

  /**
   * Exportiert das Verarbeitungsverzeichnis
   */
  public async exportRegister(): Promise<string> {
    try {
      const fileName = `processing_register_${Date.now()}.json`;
      const file = new File(Paths.document, fileName);
      file.create();
      await FileSystem.writeAsStringAsync(file.uri, JSON.stringify(this.register, null, 2));

      return file.uri;
    } catch (error) {
      console.error('Error exporting processing register:', error);
      throw new Error('Fehler beim Exportieren des Verarbeitungsverzeichnisses');
    }
  }

  /**
   * Sucht nach Verarbeitungsaktivitäten
   */
  public async searchActivities(query: {
    category?: string;
    purpose?: string;
    legalBasis?: string;
  }): Promise<ProcessingActivity[]> {
    return this.register.activities.filter(activity => {
      return (!query.category || activity.category === query.category) &&
             (!query.purpose || activity.purpose.includes(query.purpose)) &&
             (!query.legalBasis || activity.legalBasis === query.legalBasis);
    });
  }

  /**
   * Generiert einen Bericht über Verarbeitungsaktivitäten
   */
  public async generateActivityReport(): Promise<string> {
    try {
      const report = {
        timestamp: new Date().toISOString(),
        organizationInfo: this.register.organizationInfo,
        summary: {
          totalActivities: this.register.activities.length,
          byCategory: this.groupActivitiesByCategory(),
          byLegalBasis: this.groupActivitiesByLegalBasis()
        },
        details: this.register.activities
      };

      const fileName = `processing_report_${Date.now()}.json`;
      const file = new File(Paths.document, fileName);
      file.create();
      await FileSystem.writeAsStringAsync(file.uri, JSON.stringify(report, null, 2));

      return file.uri;
    } catch (error) {
      console.error('Error generating activity report:', error);
      throw new Error('Fehler beim Erstellen des Aktivitätsberichts');
    }
  }

  // Private Hilfsmethoden

  private async loadRegister(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.register = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading processing register:', error);
    }
  }

  private async saveRegister(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.register));
    } catch (error) {
      console.error('Error saving processing register:', error);
      throw new Error('Fehler beim Speichern des Verarbeitungsverzeichnisses');
    }
  }

  private async initializeDefaultActivities(): Promise<void> {
    if (this.register.activities.length > 0) return;

    const defaultActivities: Omit<ProcessingActivity, 'id' | 'lastUpdated'>[] = [
      {
        category: 'user_management',
        purpose: 'Benutzerverwaltung und Authentifizierung',
        dataCategories: ['email', 'password_hash', 'profile_data'],
        legalBasis: 'contract',
        retention: 365, // 1 Jahr
        securityMeasures: [
          'Verschlüsselung',
          'Zugriffskontrollen',
          'Regelmäßige Sicherheitsüberprüfungen'
        ]
      },
      {
        category: 'shopping_lists',
        purpose: 'Verwaltung von Einkaufslisten',
        dataCategories: ['shopping_data', 'product_preferences'],
        legalBasis: 'consent',
        retention: 730, // 2 Jahre
        securityMeasures: [
          'Datenverschlüsselung',
          'Backup-Systeme'
        ]
      },
      {
        category: 'analytics',
        purpose: 'Nutzungsanalyse zur Verbesserung der App',
        dataCategories: ['usage_data', 'device_info'],
        legalBasis: 'legitimate_interests',
        retention: 90, // 90 Tage
        securityMeasures: [
          'Datenaggregation',
          'Pseudonymisierung'
        ],
        recipients: ['Analytics Service Provider']
      }
    ];

    for (const activity of defaultActivities) {
      await this.addProcessingActivity(activity);
    }
  }

  private groupActivitiesByCategory(): Record<string, number> {
    return this.register.activities.reduce((acc, activity) => {
      acc[activity.category] = (acc[activity.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private groupActivitiesByLegalBasis(): Record<string, number> {
    return this.register.activities.reduce((acc, activity) => {
      acc[activity.legalBasis] = (acc[activity.legalBasis] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}

export const processingRegisterService = ProcessingRegisterService.getInstance();