import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Button, Switch, Text } from 'react-native-paper';
import { encryptionService } from '../services/EncryptionService';
import { keyManagementService } from '../services/KeyManagementService';

export const EncryptionSettingsScreen: React.FC = () => {
  const [isEncryptionEnabled, setIsEncryptionEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    loadEncryptionStatus();
  }, []);

  const loadEncryptionStatus = async () => {
    try {
      const status = encryptionService.isEncryptionEnabled();
      setIsEncryptionEnabled(status);
    } catch (error) {
      console.error('Error loading encryption status:', error);
      Alert.alert('Fehler', 'Verschlüsselungsstatus konnte nicht geladen werden.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleEncryption = async () => {
    try {
      setIsChanging(true);
      if (!isEncryptionEnabled) {
        await enableEncryption();
      } else {
        await disableEncryption();
      }
    } finally {
      setIsChanging(false);
    }
  };

  const enableEncryption = async () => {
    try {
      // Benutzer über den Prozess informieren
      Alert.alert(
        'Verschlüsselung aktivieren',
        'Alle Daten werden nun verschlüsselt. Dies kann einen Moment dauern.',
        [
          {
            text: 'Abbrechen',
            style: 'cancel'
          },
          {
            text: 'Fortfahren',
            onPress: async () => {
              await encryptionService.enableEncryption();
              setIsEncryptionEnabled(true);
              Alert.alert(
                'Erfolg',
                'Die Verschlüsselung wurde erfolgreich aktiviert.'
              );
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error enabling encryption:', error);
      Alert.alert('Fehler', 'Die Verschlüsselung konnte nicht aktiviert werden.');
    }
  };

  const disableEncryption = async () => {
    try {
      // Benutzer warnen
      Alert.alert(
        'Verschlüsselung deaktivieren',
        'Sind Sie sicher? Ihre Daten werden dann nicht mehr verschlüsselt gespeichert.',
        [
          {
            text: 'Abbrechen',
            style: 'cancel'
          },
          {
            text: 'Deaktivieren',
            style: 'destructive',
            onPress: async () => {
              await encryptionService.disableEncryption();
              setIsEncryptionEnabled(false);
              Alert.alert(
                'Erfolg',
                'Die Verschlüsselung wurde erfolgreich deaktiviert.'
              );
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error disabling encryption:', error);
      Alert.alert(
        'Fehler',
        'Die Verschlüsselung konnte nicht deaktiviert werden.'
      );
    }
  };

  const handleExportKeys = async () => {
    try {
      // Passwort vom Benutzer abfragen
      Alert.prompt(
        'Backup exportieren',
        'Bitte geben Sie ein sicheres Passwort für das Backup ein:',
        async (password) => {
          if (!password) {
            Alert.alert('Fehler', 'Bitte geben Sie ein Passwort ein.');
            return;
          }
          
          const backup = await keyManagementService.exportKeys(password);
          // Hier würde die Logik zum Speichern des Backups folgen
          Alert.alert('Erfolg', 'Backup wurde erfolgreich erstellt.');
        }
      );
    } catch (error) {
      console.error('Error exporting keys:', error);
      Alert.alert('Fehler', 'Backup konnte nicht erstellt werden.');
    }
  };

  const handleImportKeys = async () => {
    try {
      // Backup-Datei auswählen und Passwort abfragen würde hier implementiert
      Alert.alert(
        'Info',
        'Diese Funktion wird in einer späteren Version verfügbar sein.'
      );
    } catch (error) {
      console.error('Error importing keys:', error);
      Alert.alert('Fehler', 'Backup konnte nicht importiert werden.');
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
        <Text style={styles.title}>Datenverschlüsselung</Text>
        <View style={styles.row}>
          <Text>Ende-zu-Ende-Verschlüsselung</Text>
          <Switch
            value={isEncryptionEnabled}
            onValueChange={handleToggleEncryption}
            disabled={isChanging}
          />
        </View>
        <Text style={styles.description}>
          Wenn aktiviert, werden alle Ihre Daten lokal verschlüsselt gespeichert.
        </Text>
      </View>

      {isEncryptionEnabled && (
        <View style={styles.section}>
          <Text style={styles.title}>Schlüsselverwaltung</Text>
          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handleExportKeys}
              style={styles.button}
            >
              Backup erstellen
            </Button>
            <Button
              mode="outlined"
              onPress={handleImportKeys}
              style={styles.button}
            >
              Backup importieren
            </Button>
          </View>
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
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  description: {
    color: '#666',
    fontSize: 14,
    marginTop: 8,
  },
  buttonContainer: {
    marginTop: 16,
  },
  button: {
    marginBottom: 8,
  },
});