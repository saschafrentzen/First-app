import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl
} from 'react-native';
import { PriceChart } from '../components/PriceChart';
import { PriceAlertSettings } from '../components/PriceAlertSettings';
import { priceAlertService } from '../services/PriceAlertService';
import { PriceAlert } from '../models/PriceAlert';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  PriceTracking: {
    productId: string;
    userId: string;
    currentPrice: number;
  };
};

type PriceTrackingScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'PriceTracking'
>;

type PriceTrackingScreenRouteProp = RouteProp<
  RootStackParamList,
  'PriceTracking'
>;

interface PriceTrackingScreenProps {
  navigation: PriceTrackingScreenNavigationProp;
  route: PriceTrackingScreenRouteProp;
}

export const PriceTrackingScreen: React.FC<PriceTrackingScreenProps> = ({
  route,
  navigation
}) => {
  const { productId, userId, currentPrice } = route.params;
  const [refreshing, setRefreshing] = useState(false);
  const [existingAlerts, setExistingAlerts] = useState<PriceAlert[]>([]);

  useEffect(() => {
    loadExistingAlerts();
  }, []);

  const loadExistingAlerts = async () => {
    try {
      const alerts = await priceAlertService.getAllAlerts(userId);
      const productAlerts = alerts.filter(
        alert => alert.productId === productId && alert.isActive
      );
      setExistingAlerts(productAlerts);
    } catch (error) {
      console.error('Error loading alerts:', error);
      Alert.alert('Fehler', 'Preisalarme konnten nicht geladen werden.');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadExistingAlerts();
    } finally {
      setRefreshing(false);
    }
  };

  const handleAlertCreated = () => {
    loadExistingAlerts();
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.chartContainer}>
        <PriceChart productId={productId} />
      </View>

      <View style={styles.settingsContainer}>
        <PriceAlertSettings
          productId={productId}
          userId={userId}
          currentPrice={currentPrice}
          onAlertCreated={handleAlertCreated}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  chartContainer: {
    marginBottom: 16
  },
  settingsContainer: {
    marginHorizontal: 16,
    marginBottom: 16
  }
});