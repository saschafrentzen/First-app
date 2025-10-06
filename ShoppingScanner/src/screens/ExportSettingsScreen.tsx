import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Text, List, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { exportService } from '../services/exportService';
import {
  ExportSettings,
  ExportFormat,
  CloudProvider,
  BackupFrequency
} from '../types/export';

export const ExportSettingsScreen: React.FC = () => {
  const [settings, setSettings] = useState<ExportSettings | null>(null);
  const [cloudConfigs, setCloudConfigs] = useState<Record<CloudProvider, boolean>>({
    'google-drive': false,
    'dropbox': false,
    'onedrive': false
  });
  const { theme } = useTheme();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const loadedSettings = await exportService.getSettings();
      setSettings(loadedSettings);

      // Lade Cloud-Konfigurationen
      const configs = await Promise.all([
        exportService.getCloudConfig('google-drive'),
        exportService.getCloudConfig('dropbox'),
        exportService.getCloudConfig('onedrive')
      ]);

      setCloudConfigs({
        'google-drive': configs[0].enabled,
        'dropbox': configs[1].enabled,
        'onedrive': configs[2].enabled
      });
    } catch (error) {
      Alert.alert('Fehler', 'Einstellungen konnten nicht geladen werden.');
    }
  };

  const handleSettingChange = async (key: keyof ExportSettings, value: any) => {
    if (!settings) return;

    try {
      const newSettings = { ...settings, [key]: value };
      await exportService.updateSettings(newSettings);
      setSettings(newSettings);
    } catch (error) {
      Alert.alert('Fehler', 'Einstellung konnte nicht gespeichert werden.');
    }
  };

  const handleCloudConfigChange = async (provider: CloudProvider, enabled: boolean) => {
    try {
      await exportService.configureCloudProvider(provider, { enabled });
      setCloudConfigs(prev => ({
        ...prev,
        [provider]: enabled
      }));
    } catch (error) {
      Alert.alert('Fehler', 'Cloud-Konfiguration konnte nicht aktualisiert werden.');
    }
  };

  const handleCreateBackup = async () => {
    try {
      Alert.alert(
        'Backup erstellen',
        'Möchten Sie jetzt ein Backup erstellen?',
        [
          {
            text: 'Abbrechen',
            style: 'cancel'
          },
          {
            text: 'Backup erstellen',
            onPress: async () => {
              try {
                const metadata = await exportService.createBackup();
                Alert.alert(
                  'Erfolg',
                  `Backup wurde erstellt: ${metadata.id}`
                );
              } catch (error) {
                Alert.alert('Fehler', 'Backup konnte nicht erstellt werden.');
              }
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Fehler', 'Backup konnte nicht erstellt werden.');
    }
  };

  if (!settings) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text>Lädt...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView>
        <List.Section>
          <List.Subheader style={{ color: theme.text }}>
            Export-Einstellungen
          </List.Subheader>

          <List.Item
            title="Standardformat"
            description={settings.defaultFormat.toUpperCase()}
            left={props => (
              <List.Icon {...props} icon="file-export" color={theme.primary} />
            )}
            onPress={() => {
              // Implementiere Format-Auswahl
            }}
          />

          <Divider />

          <List.Item
            title="Automatisches Backup"
            left={props => (
              <List.Icon {...props} icon="backup-restore" color={theme.primary} />
            )}
            right={() => (
              <Switch
                value={settings.autoBackup}
                onValueChange={value => handleSettingChange('autoBackup', value)}
              />
            )}
          />

          {settings.autoBackup && (
            <>
              <List.Item
                title="Backup-Frequenz"
                description={settings.backupFrequency}
                left={props => (
                  <List.Icon {...props} icon="clock-outline" color={theme.primary} />
                )}
                onPress={() => {
                  // Implementiere Frequenz-Auswahl
                }}
              />

              <List.Item
                title="Anzahl Backups"
                description={`${settings.backupRetention} Backups behalten`}
                left={props => (
                  <List.Icon {...props} icon="history" color={theme.primary} />
                )}
                onPress={() => {
                  // Implementiere Retention-Einstellung
                }}
              />
            </>
          )}

          <Divider />

          <List.Item
            title="Bilder einschließen"
            left={props => (
              <List.Icon {...props} icon="image" color={theme.primary} />
            )}
            right={() => (
              <Switch
                value={settings.includeImages}
                onValueChange={value => handleSettingChange('includeImages', value)}
              />
            )}
          />

          <List.Item
            title="Backups verschlüsseln"
            left={props => (
              <List.Icon {...props} icon="shield-lock" color={theme.primary} />
            )}
            right={() => (
              <Switch
                value={settings.encryptBackups}
                onValueChange={value => handleSettingChange('encryptBackups', value)}
              />
            )}
          />

          <List.Item
            title="Komprimierung"
            left={props => (
              <List.Icon {...props} icon="zip-box" color={theme.primary} />
            )}
            right={() => (
              <Switch
                value={settings.compressionEnabled}
                onValueChange={value => handleSettingChange('compressionEnabled', value)}
              />
            )}
          />
        </List.Section>

        <List.Section>
          <List.Subheader style={{ color: theme.text }}>
            Cloud-Integration
          </List.Subheader>

          <List.Item
            title="Google Drive"
            left={props => (
              <List.Icon {...props} icon="google-drive" color={theme.primary} />
            )}
            right={() => (
              <Switch
                value={cloudConfigs['google-drive']}
                onValueChange={value => handleCloudConfigChange('google-drive', value)}
              />
            )}
          />

          <List.Item
            title="Dropbox"
            left={props => (
              <List.Icon {...props} icon="dropbox" color={theme.primary} />
            )}
            right={() => (
              <Switch
                value={cloudConfigs['dropbox']}
                onValueChange={value => handleCloudConfigChange('dropbox', value)}
              />
            )}
          />

          <List.Item
            title="OneDrive"
            left={props => (
              <List.Icon {...props} icon="microsoft-onedrive" color={theme.primary} />
            )}
            right={() => (
              <Switch
                value={cloudConfigs['onedrive']}
                onValueChange={value => handleCloudConfigChange('onedrive', value)}
              />
            )}
          />
        </List.Section>

        <TouchableOpacity
          style={[styles.backupButton, { backgroundColor: theme.primary }]}
          onPress={handleCreateBackup}
        >
          <MaterialCommunityIcons
            name="backup-restore"
            size={24}
            color={theme.textInverted}
          />
          <Text style={[styles.backupButtonText, { color: theme.textInverted }]}>
            Backup jetzt erstellen
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    margin: 16,
    borderRadius: 8,
  },
  backupButtonText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
});