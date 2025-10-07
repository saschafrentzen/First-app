import { useState, useEffect, useCallback } from 'react';
import { privacyService, PrivacySettings, DataCategory } from '../services/PrivacyService';

export interface UsePrivacySettings {
  settings: PrivacySettings;
  isLoading: boolean;
  error: string | null;
  updateSettings: (newSettings: Partial<PrivacySettings>) => Promise<void>;
  exportData: () => Promise<string>;
  deleteData: () => Promise<void>;
  dataCategories: DataCategory[];
}

export const usePrivacySettings = (): UsePrivacySettings => {
  const [settings, setSettings] = useState<PrivacySettings>(
    privacyService.getSettings()
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataCategories, setDataCategories] = useState<DataCategory[]>([]);

  useEffect(() => {
    loadPrivacySettings();
  }, []);

  const loadPrivacySettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await privacyService.initialize();
      setSettings(privacyService.getSettings());
      // Hier würden wir die Datenkategorien laden
      // setDataCategories(await privacyService.getDataCategories());
    } catch (err) {
      setError('Fehler beim Laden der Datenschutzeinstellungen');
      console.error('Error loading privacy settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = useCallback(async (
    newSettings: Partial<PrivacySettings>
  ): Promise<void> => {
    try {
      setError(null);
      await privacyService.updateSettings(newSettings);
      setSettings(privacyService.getSettings());
    } catch (err) {
      setError('Fehler beim Aktualisieren der Einstellungen');
      throw err;
    }
  }, []);

  const exportData = useCallback(async (): Promise<string> => {
    try {
      setError(null);
      return await privacyService.exportUserData();
    } catch (err) {
      setError('Fehler beim Exportieren der Daten');
      throw err;
    }
  }, []);

  const deleteData = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      await privacyService.deleteUserData();
      // Aktualisiere die Einstellungen nach der Löschung
      setSettings(privacyService.getSettings());
    } catch (err) {
      setError('Fehler beim Löschen der Daten');
      throw err;
    }
  }, []);

  return {
    settings,
    isLoading,
    error,
    updateSettings,
    exportData,
    deleteData,
    dataCategories
  };
};

// Beispiel für die Verwendung:
/*
const MyComponent: React.FC = () => {
  const { 
    settings, 
    updateSettings,
    exportData,
    deleteData,
    isLoading 
  } = usePrivacySettings();

  const handleToggleAnalytics = async () => {
    await updateSettings({ 
      analyticsEnabled: !settings.analyticsEnabled 
    });
  };

  const handleExport = async () => {
    const data = await exportData();
    // Hier können Sie die Daten speichern oder teilen
  };

  return (
    <View>
      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <>
          <Switch
            value={settings.analyticsEnabled}
            onValueChange={handleToggleAnalytics}
          />
          <Button 
            onPress={handleExport} 
            title="Daten exportieren" 
          />
        </>
      )}
    </View>
  );
};
*/