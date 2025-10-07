import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Button, Switch, Text, List } from 'react-native-paper';
import { useBiometricAuth } from '../hooks/useBiometricAuth';
import * as LocalAuthentication from 'expo-local-authentication';

export const BiometricSettingsScreen: React.FC = () => {
  const {
    isAvailable,
    isEnabled,
    isLoading,
    error,
    authenticate,
    enableBiometrics,
    disableBiometrics,
  } = useBiometricAuth();

  const [supportedTypes, setSupportedTypes] = useState<
    LocalAuthentication.AuthenticationType[]
  >([]);

  React.useEffect(() => {
    checkSupportedTypes();
  }, []);

  const checkSupportedTypes = async () => {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    setSupportedTypes(types);
  };

  const handleToggleBiometrics = async () => {
    try {
      if (!isEnabled) {
        const success = await enableBiometrics();
        if (success) {
          Alert.alert(
            'Erfolg',
            'Biometrische Authentifizierung wurde aktiviert.'
          );
        }
      } else {
        await authenticate('Bestätigen Sie die Deaktivierung');
        await disableBiometrics();
        Alert.alert(
          'Erfolg',
          'Biometrische Authentifizierung wurde deaktiviert.'
        );
      }
    } catch (err) {
      Alert.alert('Fehler', 'Die Aktion konnte nicht ausgeführt werden.');
    }
  };

  const getBiometricTypeName = (type: LocalAuthentication.AuthenticationType) => {
    switch (type) {
      case LocalAuthentication.AuthenticationType.FINGERPRINT:
        return 'Fingerabdruck';
      case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
        return 'Gesichtserkennung';
      case LocalAuthentication.AuthenticationType.IRIS:
        return 'Iris-Scan';
      default:
        return 'Andere';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!isAvailable) {
    return (
      <View style={styles.container}>
        <Text style={styles.warningText}>
          Biometrische Authentifizierung ist auf diesem Gerät nicht verfügbar.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>Biometrische Authentifizierung</Text>
        <View style={styles.row}>
          <Text>Aktivieren</Text>
          <Switch value={isEnabled} onValueChange={handleToggleBiometrics} />
        </View>
        <Text style={styles.description}>
          Schützen Sie Ihre App mit biometrischer Authentifizierung.
        </Text>
      </View>

      {isEnabled && (
        <>
          <View style={styles.section}>
            <Text style={styles.subtitle}>Verfügbare Methoden</Text>
            <List.Section>
              {supportedTypes.map((type) => (
                <List.Item
                  key={type}
                  title={getBiometricTypeName(type)}
                  left={(props) => <List.Icon {...props} icon="check" />}
                />
              ))}
            </List.Section>
          </View>

          <View style={styles.section}>
            <Button
              mode="contained"
              onPress={() => authenticate('Test der Authentifizierung')}
              style={styles.button}
            >
              Authentifizierung testen
            </Button>
          </View>
        </>
      )}

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
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
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
  button: {
    marginTop: 8,
  },
  warningText: {
    color: '#f44336',
    textAlign: 'center',
    padding: 16,
  },
  errorText: {
    color: '#f44336',
    marginTop: 8,
  },
});