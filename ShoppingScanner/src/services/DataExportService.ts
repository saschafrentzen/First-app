import { gdprService } from './GDPRService';
import * as FileSystem from 'expo-file-system';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PersonalDataCategory {
  name: string;
  description: string;
  items: PersonalDataItem[];
}

export interface PersonalDataItem {
  key: string;
  value: any;
  source: string;
  lastModified: string;
  purpose: string;
}

class DataExportService {
  private static instance: DataExportService;
  private readonly DATA_CATEGORIES = [
    {
      name: 'Profildaten',
      keys: ['user_profile', 'personal_settings'],
      description: 'Ihre persönlichen Profilinformationen'
    },
    {
      name: 'Einkaufsdaten',
      keys: ['shopping_lists', 'purchase_history'],
      description: 'Ihre Einkaufslisten und -historie'
    },
    {
      name: 'Standortdaten',
      keys: ['location_history', 'favorite_stores'],
      description: 'Gespeicherte Standorte und Geschäfte'
    },
    {
      name: 'Analysedaten',
      keys: ['shopping_analytics', 'usage_statistics'],
      description: 'Nutzungsstatistiken und Analysen'
    }
  ];

  private constructor() {}

  public static getInstance(): DataExportService {
    if (!DataExportService.instance) {
      DataExportService.instance = new DataExportService();
    }
    return DataExportService.instance;
  }

  /**
   * Exportiert alle personenbezogenen Daten im JSON-Format
   */
  public async exportPersonalData(): Promise<string> {
    try {
      const data = await this.collectAllPersonalData();
      const exportData = {
        metadata: {
          timestamp: new Date().toISOString(),
          version: '1.0',
          format: 'JSON'
        },
        categories: data
      };

      const fileName = `personal_data_export_${Date.now()}.json`;
      const file = new File(Paths.document, fileName);
      file.create();
      await FileSystem.writeAsStringAsync(file.uri, JSON.stringify(exportData, null, 2));

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'application/json',
          dialogTitle: 'Ihre persönlichen Daten',
          UTI: 'public.json'
        });
      }

      return file.uri;
    } catch (error) {
      console.error('Error exporting personal data:', error);
      throw new Error('Fehler beim Exportieren der persönlichen Daten');
    }
  }

  /**
   * Sammelt alle personenbezogenen Daten aus verschiedenen Quellen
   */
  private async collectAllPersonalData(): Promise<PersonalDataCategory[]> {
    try {
      const categories: PersonalDataCategory[] = [];

      for (const category of this.DATA_CATEGORIES) {
        const items = await this.collectCategoryData(category.keys);
        if (items.length > 0) {
          categories.push({
            name: category.name,
            description: category.description,
            items
          });
        }
      }

      return categories;
    } catch (error) {
      console.error('Error collecting personal data:', error);
      throw new Error('Fehler beim Sammeln der persönlichen Daten');
    }
  }

  /**
   * Sammelt Daten für eine bestimmte Kategorie
   */
  private async collectCategoryData(keys: string[]): Promise<PersonalDataItem[]> {
    const items: PersonalDataItem[] = [];

    for (const key of keys) {
      try {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          const parsed = JSON.parse(value);
          items.push({
            key,
            value: parsed,
            source: 'AsyncStorage',
            lastModified: new Date().toISOString(),
            purpose: this.getDataPurpose(key)
          });
        }
      } catch (error) {
        console.warn(`Error collecting data for key ${key}:`, error);
      }
    }

    return items;
  }

  /**
   * Bestimmt den Verwendungszweck der Daten
   */
  private getDataPurpose(key: string): string {
    // Mapping von Schlüsseln zu Verwendungszwecken
    const purposeMap: { [key: string]: string } = {
      user_profile: 'Bereitstellung personalisierter Funktionen',
      personal_settings: 'Speicherung Ihrer Präferenzen',
      shopping_lists: 'Verwaltung Ihrer Einkaufslisten',
      purchase_history: 'Analyse Ihres Einkaufsverhaltens',
      location_history: 'Standortbasierte Dienste',
      favorite_stores: 'Speicherung Ihrer bevorzugten Geschäfte',
      shopping_analytics: 'Verbesserung der Einkaufsempfehlungen',
      usage_statistics: 'Verbesserung der App-Funktionalität'
    };

    return purposeMap[key] || 'Nicht spezifiziert';
  }

  /**
   * Exportiert Daten in verschiedenen Formaten
   */
  public async exportDataInFormat(format: 'json' | 'csv' | 'pdf'): Promise<string> {
    const data = await this.collectAllPersonalData();
    let content: string;
    let mimeType: string;
    let extension: string;

    switch (format) {
      case 'csv':
        content = this.convertToCSV(data);
        mimeType = 'text/csv';
        extension = 'csv';
        break;
      case 'pdf':
        throw new Error('PDF-Export noch nicht implementiert');
      default:
        content = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
        extension = 'json';
    }

    const fileName = `personal_data_export_${Date.now()}.${extension}`;
    const file = new File(Paths.document, fileName);
    file.create();
    await FileSystem.writeAsStringAsync(file.uri, content);

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri, {
        mimeType,
        dialogTitle: 'Ihre persönlichen Daten',
        UTI: this.getUTIForFormat(format)
      });
    }

    return file.uri;
  }

  /**
   * Konvertiert Daten in CSV-Format
   */
  private convertToCSV(data: PersonalDataCategory[]): string {
    const rows: string[] = ['Kategorie,Schlüssel,Wert,Quelle,Letzte Änderung,Zweck'];

    data.forEach(category => {
      category.items.forEach(item => {
        rows.push([
          category.name,
          item.key,
          JSON.stringify(item.value).replace(/,/g, ';'),
          item.source,
          item.lastModified,
          item.purpose
        ].join(','));
      });
    });

    return rows.join('\n');
  }

  /**
   * Bestimmt den UTI (Uniform Type Identifier) für verschiedene Dateiformate
   */
  private getUTIForFormat(format: string): string {
    const utiMap: { [key: string]: string } = {
      json: 'public.json',
      csv: 'public.comma-separated-values-text',
      pdf: 'com.adobe.pdf'
    };

    return utiMap[format] || 'public.data';
  }
}

export const dataExportService = DataExportService.getInstance();