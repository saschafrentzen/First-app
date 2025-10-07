import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Share,
  ActivityIndicator,
} from 'react-native';
import { 
  Button, 
  Switch, 
  Text, 
  List, 
  Divider, 
  Portal, 
  Dialog 
} from 'react-native-paper';
import { usePrivacySettings } from '../hooks/usePrivacySettings';

export const PrivacySettingsScreen: React.FC = () => {
  const {
    settings,
    isLoading,
    error,
    updateSettings,
    exportData,
    deleteData
  } = usePrivacySettings();

  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  const handleSettingToggle = async (
    setting: keyof typeof settings,
    value: boolean
  ) => {
    try {
      await updateSettings({ [setting]: value });
    } catch (error) {
      Alert.alert('Fehler', 'Einstellung konnte nicht geändert werden.');
    }
  };

  const handleExportData = async () => {
    try {
      const data = await exportData();
      await Share.share({
        message: data,
        title: 'Meine Daten'
      });
    } catch (error) {
      Alert.alert('Fehler', 'Daten konnten nicht exportiert werden.');
    }
  };

  const handleDeleteData = async () => {
    try {
      await deleteData();
      setDeleteDialogVisible(false);
      Alert.alert('Erfolg', 'Alle Daten wurden erfolgreich gelöscht.');
    } catch (error) {
      Alert.alert('Fehler', 'Daten konnten nicht gelöscht werden.');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>Datensammlung</Text>
        <List.Item
          title="Analytik"
          description="Nutzungsdaten zur Verbesserung der App"
          right={() => (
            <Switch
              value={settings.analyticsEnabled}
              onValueChange={(value) =>
                handleSettingToggle('analyticsEnabled', value)
              }
            />
          )}
        />
        <List.Item
          title="Standort-Tracking"
          description="Standortdaten für lokale Angebote"
          right={() => (
            <Switch
              value={settings.locationTracking}
              onValueChange={(value) =>
                handleSettingToggle('locationTracking', value)
              }
            />
          )}
        />
      </View>

      <Divider />

      <View style={styles.section}>
        <Text style={styles.title}>Datenspeicherung</Text>
        <List.Item
          title="Verschlüsselung"
          description="Ende-zu-Ende-Verschlüsselung aller Daten"
          right={() => (
            <Switch
              value={settings.storageEncryption}
              onValueChange={(value) =>
                handleSettingToggle('storageEncryption', value)
              }
            />
          )}
        />
        <List.Item
          title="Biometrische Authentifizierung"
          description="Zugriff mit Fingerabdruck oder Face ID"
          right={() => (
            <Switch
              value={settings.biometricAuth}
              onValueChange={(value) =>
                handleSettingToggle('biometricAuth', value)
              }
            />
          )}
        />
      </View>

      <Divider />

      <View style={styles.section}>
        <Text style={styles.title}>Berechtigungen</Text>
        <List.Item
          title="Kamera"
          description="Zugriff auf die Gerätekamera"
          right={() => (
            <Switch
              value={settings.cameraAccess}
              onValueChange={(value) =>
                handleSettingToggle('cameraAccess', value)
              }
            />
          )}
        />
        <List.Item
          title="Standort"
          description="Zugriff auf den Gerätestandort"
          right={() => (
            <Switch
              value={settings.locationAccess}
              onValueChange={(value) =>
                handleSettingToggle('locationAccess', value)
              }
            />
          )}
        />
        <List.Item
          title="Benachrichtigungen"
          description="Push-Benachrichtigungen erlauben"
          right={() => (
            <Switch
              value={settings.notificationAccess}
              onValueChange={(value) =>
                handleSettingToggle('notificationAccess', value)
              }
            />
          )}
        />
      </View>

      <Divider />

      <View style={styles.section}>
        <Text style={styles.title}>Datenschutz-Rechte</Text>
        <Button
          mode="contained"
          onPress={handleExportData}
          style={styles.button}
        >
          Meine Daten exportieren
        </Button>
        <Button
          mode="outlined"
          onPress={() => setDeleteDialogVisible(true)}
          style={[styles.button, styles.deleteButton]}
          textColor="#f44336"
        >
          Alle Daten löschen
        </Button>
      </View>

      <Portal>
        <Dialog
          visible={deleteDialogVisible}
          onDismiss={() => setDeleteDialogVisible(false)}
        >
          <Dialog.Title>Daten löschen</Dialog.Title>
          <Dialog.Content>
            <Text>
              Möchten Sie wirklich alle Ihre Daten löschen? Dieser Vorgang kann
              nicht rückgängig gemacht werden.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>
              Abbrechen
            </Button>
            <Button onPress={handleDeleteData} textColor="#f44336">
              Löschen
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {error && (
        <View style={styles.section}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  deleteButton: {
    borderColor: '#f44336',
  },
  errorText: {
    color: '#f44336',
    marginTop: 8,
  },
});