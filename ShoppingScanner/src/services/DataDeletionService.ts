import AsyncStorage from '@react-native-async-storage/async-storage';
import { secureStorage } from './SecureStorage';
import { gdprService } from './GDPRService';
import * as FileSystem from 'expo-file-system';
import { File, Paths } from 'expo-file-system';

export interface DeletionRequest {
  requestId: string;
  userId: string;
  timestamp: string;
  categories: string[];
  reason?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  completionDate?: string;
}

export interface DeletionReport {
  requestId: string;
  timestamp: string;
  deletedItems: {
    category: string;
    itemCount: number;
    storageType: string;
  }[];
  errors?: string[];
}

class DataDeletionService {
  private static instance: DataDeletionService;
  private readonly REQUESTS_KEY = 'deletion_requests';
  private readonly REPORTS_KEY = 'deletion_reports';
  
  // Definiere Datenkategorien und ihre Speicherorte
  private readonly DATA_CATEGORIES: Record<string, { keys: string[], secure: string[] }> = {
    profile: {
      keys: ['user_profile', 'settings', 'preferences'],
      secure: ['auth_token', 'biometric_data']
    },
    activity: {
      keys: ['activity_log', 'usage_statistics', 'search_history'],
      secure: []
    },
    content: {
      keys: ['user_content', 'shopping_lists', 'favorites'],
      secure: []
    },
    location: {
      keys: ['location_history', 'saved_places'],
      secure: []
    }
  };

  private constructor() {}

  public static getInstance(): DataDeletionService {
    if (!DataDeletionService.instance) {
      DataDeletionService.instance = new DataDeletionService();
    }
    return DataDeletionService.instance;
  }

  /**
   * Erstellt eine neue Löschungsanfrage
   */
  public async createDeletionRequest(
    userId: string,
    categories: string[],
    reason?: string
  ): Promise<string> {
    try {
      const requestId = `deletion_${Date.now()}`;
      const request: DeletionRequest = {
        requestId,
        userId,
        timestamp: new Date().toISOString(),
        categories,
        reason,
        status: 'pending'
      };

      const requests = await this.getDeletionRequests();
      requests.push(request);
      await AsyncStorage.setItem(this.REQUESTS_KEY, JSON.stringify(requests));

      // Protokolliere die Anfrage im GDPR Service
      await gdprService.handleDataSubjectRequest({
        requestId,
        type: 'erasure',
        status: 'pending',
        timestamp: new Date().toISOString()
      });

      return requestId;
    } catch (error) {
      console.error('Error creating deletion request:', error);
      throw new Error('Fehler beim Erstellen der Löschungsanfrage');
    }
  }

  /**
   * Führt die Datenlöschung durch
   */
  public async executeDeletion(requestId: string): Promise<DeletionReport> {
    try {
      const request = await this.getDeletionRequest(requestId);
      if (!request) throw new Error('Löschungsanfrage nicht gefunden');

      await this.updateRequestStatus(requestId, 'in_progress');
      const report: DeletionReport = {
        requestId,
        timestamp: new Date().toISOString(),
        deletedItems: [],
        errors: []
      };

      // Lösche Daten für jede ausgewählte Kategorie
      for (const category of request.categories) {
        if (this.DATA_CATEGORIES[category]) {
          const result = await this.deleteCategoryData(category);
          report.deletedItems.push(result);
        }
      }

      await this.updateRequestStatus(requestId, 'completed');
      await this.saveReport(report);

      // Aktualisiere GDPR Service
      // Log completion in GDPR service
      await gdprService.handleDataSubjectRequest({
        requestId,
        type: 'erasure',
        status: 'completed',
        timestamp: new Date().toISOString(),
        completionDate: new Date().toISOString()
      });

      return report;
    } catch (error) {
      console.error('Error executing deletion:', error);
      await this.updateRequestStatus(requestId, 'failed');
      throw new Error('Fehler bei der Datenlöschung');
    }
  }

  /**
   * Überprüft den Status einer Löschungsanfrage
   */
  public async checkDeletionStatus(requestId: string): Promise<DeletionRequest['status']> {
    const request = await this.getDeletionRequest(requestId);
    return request?.status || 'failed';
  }

  /**
   * Erstellt einen Löschungsbericht
   */
  public async generateDeletionCertificate(requestId: string): Promise<string> {
    try {
      const request = await this.getDeletionRequest(requestId);
      const report = await this.getReport(requestId);
      
      if (!request || !report) {
        throw new Error('Löschungsanfrage oder Bericht nicht gefunden');
      }

      const certificate = {
        certificateId: `cert_${Date.now()}`,
        requestId,
        userId: request.userId,
        deletionDate: report.timestamp,
        categories: request.categories,
        confirmation: {
          timestamp: new Date().toISOString(),
          status: 'completed',
          authority: 'ShoppingScanner App',
          legalBasis: 'GDPR Article 17 - Right to erasure'
        }
      };

      const fileName = `deletion_certificate_${requestId}.json`;
      const file = new File(Paths.document, fileName);
      file.create();
      await FileSystem.writeAsStringAsync(file.uri, JSON.stringify(certificate, null, 2));

      return file.uri;
    } catch (error) {
      console.error('Error generating deletion certificate:', error);
      throw new Error('Fehler beim Erstellen der Löschungsbestätigung');
    }
  }

  // Private Hilfsmethoden

  private async getDeletionRequests(): Promise<DeletionRequest[]> {
    try {
      const data = await AsyncStorage.getItem(this.REQUESTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting deletion requests:', error);
      return [];
    }
  }

  private async getDeletionRequest(requestId: string): Promise<DeletionRequest | null> {
    const requests = await this.getDeletionRequests();
    return requests.find(r => r.requestId === requestId) || null;
  }

  private async updateRequestStatus(
    requestId: string,
    status: DeletionRequest['status']
  ): Promise<void> {
    try {
      const requests = await this.getDeletionRequests();
      const index = requests.findIndex(r => r.requestId === requestId);
      
      if (index >= 0) {
        requests[index].status = status;
        if (status === 'completed') {
          requests[index].completionDate = new Date().toISOString();
        }
        await AsyncStorage.setItem(this.REQUESTS_KEY, JSON.stringify(requests));
      }
    } catch (error) {
      console.error('Error updating request status:', error);
    }
  }

  private async deleteCategoryData(category: string): Promise<{
    category: string;
    itemCount: number;
    storageType: string;
  }> {
    const categoryData = this.DATA_CATEGORIES[category];
    let deletedCount = 0;

    // Lösche AsyncStorage Daten
    for (const key of categoryData.keys) {
      try {
        await AsyncStorage.removeItem(key);
        deletedCount++;
      } catch (error) {
        console.warn(`Error deleting key ${key}:`, error);
      }
    }

    // Lösche SecureStore Daten
    for (const key of categoryData.secure) {
      try {
        await secureStorage.removeItem(key);
        deletedCount++;
      } catch (error) {
        console.warn(`Error deleting secure key ${key}:`, error);
      }
    }

    return {
      category,
      itemCount: deletedCount,
      storageType: 'mixed'
    };
  }

  private async saveReport(report: DeletionReport): Promise<void> {
    try {
      const reports = await this.getReports();
      reports.push(report);
      await AsyncStorage.setItem(this.REPORTS_KEY, JSON.stringify(reports));
    } catch (error) {
      console.error('Error saving report:', error);
    }
  }

  private async getReports(): Promise<DeletionReport[]> {
    try {
      const data = await AsyncStorage.getItem(this.REPORTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting reports:', error);
      return [];
    }
  }

  private async getReport(requestId: string): Promise<DeletionReport | null> {
    const reports = await this.getReports();
    return reports.find(r => r.requestId === requestId) || null;
  }
}

export const dataDeletionService = DataDeletionService.getInstance();