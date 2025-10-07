import AsyncStorage from '@react-native-async-storage/async-storage';
import { File, Paths, writeAsStringAsync } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Buffer } from 'buffer';
import { privacyService } from './PrivacyService';
import { secureStorage } from './SecureStorage';

export interface ExportOptions {
  includeAnalytics: boolean;
  includeLocation: boolean;
  format: 'json' | 'csv';
  encrypt: boolean;
}

export interface DataDeletionOptions {
  analytics: boolean;
  location: boolean;
  shopping: boolean;
  settings: boolean;
}

class DataManagementService {
  private static instance: DataManagementService;

  private constructor() {}

  public static getInstance(): DataManagementService {
    if (!DataManagementService.instance) {
      DataManagementService.instance = new DataManagementService();
    }
    return DataManagementService.instance;
  }

  /**
   * Exportiert Benutzerdaten in verschiedenen Formaten
   */
  public async exportData(options: ExportOptions): Promise<string> {
    try {
      const data = await this.collectData(options);
      const formattedData = this.formatData(data, options.format);
      
      if (options.encrypt) {
        // Hier würde die Verschlüsselung implementiert
      }

      const fileName = `data_export_${new Date().toISOString()}.${options.format}`;
      const file = new File(Paths.document, fileName);
      file.create();
      await writeAsStringAsync(file.uri, formattedData);
      
      // Speichere in der Medienbibliothek
      await MediaLibrary.saveToLibraryAsync(file.uri);
      
      return file.uri;
    } catch (error) {
      console.error('Error exporting data:', error);
      throw new Error('Fehler beim Exportieren der Daten');
    }
  }

  /**
   * Löscht Benutzerdaten basierend auf den Optionen
   */
  public async deleteData(options: DataDeletionOptions): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const keysToDelete: string[] = [];

      for (const key of keys) {
        if (
          (options.analytics && key.startsWith('analytics_')) ||
          (options.location && key.startsWith('location_')) ||
          (options.shopping && key.startsWith('shopping_')) ||
          (options.settings && key.startsWith('settings_'))
        ) {
          keysToDelete.push(key);
        }
      }

      if (keysToDelete.length > 0) {
        await AsyncStorage.multiRemove(keysToDelete);
      }

      // Aktualisiere Privatsphäre-Einstellungen
      if (options.settings) {
        await privacyService.updateSettings({
          analyticsEnabled: false,
          locationTracking: false
        });
      }
    } catch (error) {
      console.error('Error deleting data:', error);
      throw new Error('Fehler beim Löschen der Daten');
    }
  }

  /**
   * Löscht veraltete Daten basierend auf der Aufbewahrungsfrist
   */
  public async cleanupExpiredData(): Promise<void> {
    try {
      const now = new Date();
      const keys = await AsyncStorage.getAllKeys();

      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          const data = JSON.parse(value);
          if (data.expiryDate && new Date(data.expiryDate) < now) {
            await AsyncStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning up expired data:', error);
    }
  }

  /**
   * Importiert Daten aus einer Backup-Datei
   */
  public async importData(filePath: string): Promise<void> {
    try {
      const file = new File(filePath);
      const content = await file.text();
      const data = JSON.parse(content);

      // Validiere die Daten
      if (!this.validateImportData(data)) {
        throw new Error('Ungültiges Datenformat');
      }

      // Speichere die Daten
      for (const [key, value] of Object.entries(data)) {
        await AsyncStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.error('Error importing data:', error);
      throw new Error('Fehler beim Importieren der Daten');
    }
  }

  private async collectData(options: ExportOptions): Promise<any> {
    const data: any = {};
    const keys = await AsyncStorage.getAllKeys();

    for (const key of keys) {
      if (
        (options.includeAnalytics && key.startsWith('analytics_')) ||
        (options.includeLocation && key.startsWith('location_')) ||
        (!key.startsWith('analytics_') && !key.startsWith('location_'))
      ) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          data[key] = JSON.parse(value);
        }
      }
    }

    return data;
  }

  private formatData(data: any, format: 'json' | 'csv'): string {
    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else {
      // CSV-Formatierung
      const rows: string[] = [];
      const headers = Object.keys(data[Object.keys(data)[0]] || {});
      
      rows.push(headers.join(','));
      
      for (const key of Object.keys(data)) {
        const values = headers.map(header => data[key][header] || '');
        rows.push(values.join(','));
      }
      
      return rows.join('\n');
    }
  }

  private validateImportData(data: any): boolean {
    // Implementiere hier die Datenvalidierung
    return true;
  }
}

export const dataManagementService = DataManagementService.getInstance();