import { makeDirectoryAsync, writeAsStringAsync, deleteAsync } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Platform } from 'react-native';
import * as Sharing from 'expo-sharing';
import { categoryBudgetService, CategoryAnalysis } from './categoryBudget';
import { nutritionService, DailyNutrition, NutritionTrend } from './nutrition';

interface ExportOptions {
  includeNutrition?: boolean;
  includeBudgets?: boolean;
  format: 'csv' | 'pdf';
  startDate: string;
  endDate: string;
}

class StatisticsExportService {
  private static instance: StatisticsExportService;

  private constructor() {}

  public static getInstance(): StatisticsExportService {
    if (!StatisticsExportService.instance) {
      StatisticsExportService.instance = new StatisticsExportService();
    }
    return StatisticsExportService.instance;
  }

  private async generateCSV(
    budgetData: CategoryAnalysis[],
    nutritionData: DailyNutrition[],
    options: ExportOptions
  ): Promise<string> {
    let csv = '';

    if (options.includeBudgets) {
      csv += 'Budget-Übersicht\n';
      csv += 'Kategorie,Budget,Ausgegeben,Verbleibend,Prozent\n';
      budgetData.forEach(analysis => {
        csv += `${analysis.category},${analysis.budget},${analysis.spent},${analysis.remaining},${analysis.percentage}\n`;
      });
      csv += '\n';
    }

    if (options.includeNutrition) {
      csv += 'Ernährungsübersicht\n';
      csv += 'Datum,Kalorien,Fett (g),Kohlenhydrate (g),Proteine (g)\n';
      nutritionData.forEach(day => {
        csv += `${day.date},${day.totalEnergy},${day.totalFat},${day.totalCarbohydrates},${day.totalProteins}\n`;
      });
    }

    return csv;
  }

  public async exportStatistics(options: ExportOptions): Promise<void> {
    try {
      const budgetData = options.includeBudgets 
        ? await categoryBudgetService.getAllAnalyses()
        : [];

      const nutritionData: DailyNutrition[] = [];
      if (options.includeNutrition) {
        let currentDate = new Date(options.startDate);
        const endDate = new Date(options.endDate);
        
        while (currentDate <= endDate) {
          const dateStr = currentDate.toISOString().split('T')[0];
          const dayData = await nutritionService.getDailyNutrition(dateStr);
          nutritionData.push(dayData);
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }

      let content = '';
      let mimeType = '';
      let filename = '';

      if (options.format === 'csv') {
        content = await this.generateCSV(budgetData, nutritionData, options);
        mimeType = 'text/csv';
        filename = `statistics_${new Date().toISOString().split('T')[0]}.csv`;
      } else {
        // PDF-Generierung würde hier implementiert werden
        throw new Error('PDF-Export noch nicht implementiert');
      }

      try {
        // Frage nach Berechtigung
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          throw new Error('Berechtigung zum Speichern der Datei wurde verweigert');
        }

        // Erstelle temporäres Verzeichnis
        await makeDirectoryAsync('exports', { intermediates: true });

        const tempUri = 'exports/' + filename;

        // Schreibe die Datei
        await writeAsStringAsync(tempUri, content);

        // Speichere in der Medienbibliothek
        const asset = await MediaLibrary.createAssetAsync(tempUri);
        const album = await MediaLibrary.getAlbumAsync('ShoppingScanner');
        if (album === null) {
          await MediaLibrary.createAlbumAsync('ShoppingScanner', asset, false);
        } else {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        }

        // Lösche temporäre Datei
        await deleteAsync(tempUri);

        // Teile die Datei
        const shareUri = asset.uri;

        // Prüfe ob Sharing verfügbar ist
        if (!(await Sharing.isAvailableAsync())) {
          throw new Error('Teilen ist auf diesem Gerät nicht verfügbar');
        }

        await Sharing.shareAsync(shareUri, {
          mimeType,
          dialogTitle: 'Statistiken exportieren',
          UTI: 'public.comma-separated-values-text' // für iOS
        });

      } catch (error) {
        console.error('Fehler beim Exportieren der Statistiken:', error);
        throw error;
      }
    } catch (error) {
      console.error('Fehler beim Exportieren der Statistiken:', error);
      throw error;
    }
  }
}

export const statisticsExportService = StatisticsExportService.getInstance();