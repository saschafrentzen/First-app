import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useNotificationPermission } from '../hooks/useNotificationPermission';
import { AlertType, CreatePriceAlertDTO } from '../models/PriceAlert';
import { priceAlertService } from '../services/PriceAlertService';
import { formatCurrency } from '../utils/formatters';

interface PriceAlertSettingsProps {
  productId: string;
  userId: string;
  currentPrice: number;
  onAlertCreated?: () => void;
}

export const PriceAlertSettings: React.FC<PriceAlertSettingsProps> = ({
  productId,
  userId,
  currentPrice,
  onAlertCreated
}) => {
  const [targetPrice, setTargetPrice] = useState(currentPrice.toString());
  const [alertType, setAlertType] = useState<AlertType>(AlertType.BELOW);
  const { hasPermission, isLoading, requestPermission } = useNotificationPermission();

  const handleCreateAlert = async () => {
    try {
      if (!hasPermission) {
        const granted = await requestPermission();
        if (!granted) {
          return;
        }
      }

      const numericTargetPrice = parseFloat(targetPrice);
      
      if (isNaN(numericTargetPrice)) {
        Alert.alert('Fehler', 'Bitte geben Sie einen gültigen Preis ein.');
        return;
      }

      if (alertType === AlertType.ABOVE && numericTargetPrice <= currentPrice) {
        Alert.alert('Ungültiger Preis', 'Der Zielpreis muss über dem aktuellen Preis liegen.');
        return;
      }

      if (alertType === AlertType.BELOW && numericTargetPrice >= currentPrice) {
        Alert.alert('Ungültiger Preis', 'Der Zielpreis muss unter dem aktuellen Preis liegen.');
        return;
      }

      const alertData: CreatePriceAlertDTO = {
        productId,
        targetPrice: numericTargetPrice,
        alertType
      };

      await priceAlertService.createAlert(userId, alertData);
      Alert.alert(
        'Erfolg',
        'Preisalarm wurde erstellt. Sie werden benachrichtigt, wenn der Preis die Bedingung erfüllt.'
      );

      onAlertCreated?.();
    } catch (error) {
      console.error('Error creating price alert:', error);
      Alert.alert('Fehler', 'Der Preisalarm konnte nicht erstellt werden.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Preisalarm einrichten</Text>
      
      {isLoading ? (
        <ActivityIndicator size="small" color="#007AFF" />
      ) : !hasPermission && (
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>
            Bitte erlaube Benachrichtigungen, um Preisalarme zu erhalten.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>
              Benachrichtigungen erlauben
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
      <View style={styles.currentPriceContainer}>
        <Text style={styles.label}>Aktueller Preis:</Text>
        <Text style={styles.currentPrice}>{formatCurrency(currentPrice)}</Text>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Zielpreis:</Text>
        <TextInput
          style={styles.input}
          value={targetPrice}
          onChangeText={setTargetPrice}
          keyboardType="decimal-pad"
          placeholder="0.00"
        />
      </View>

      <View style={styles.switchContainer}>
        <Text style={styles.label}>
          Benachrichtigen wenn Preis {alertType === AlertType.ABOVE ? 'über' : 'unter'} Zielpreis
        </Text>
        <Switch
          value={alertType === AlertType.ABOVE}
          onValueChange={(value) =>
            setAlertType(value ? AlertType.ABOVE : AlertType.BELOW)
          }
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleCreateAlert}>
        <Text style={styles.buttonText}>Preisalarm erstellen</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#000000'
  },
  currentPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  currentPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginLeft: 8
  },
  inputContainer: {
    marginBottom: 16
  },
  label: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    padding: 8,
    fontSize: 16
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center'
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  permissionContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center'
  },
  permissionText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 12
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6
  },
  permissionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600'
  }
});