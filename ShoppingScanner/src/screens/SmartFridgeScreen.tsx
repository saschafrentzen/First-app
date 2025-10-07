import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Text, FAB, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { smartFridgeService } from '../services/SmartFridgeService';
import { FridgeInventoryItem, SmartFridgeConfig, SmartFridgeStats } from '../types/smartHome';
import { 
  FridgeHeader,
  FridgeInventoryList,
  FridgeStats,
  ConnectFridgeModal 
} from '../components/smart-fridge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const SmartFridgeScreen = () => {
  const theme = useTheme();
  const isFocused = useIsFocused();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  
  const [connectedFridge, setConnectedFridge] = useState<SmartFridgeConfig | null>(null);
  const [inventory, setInventory] = useState<FridgeInventoryItem[]>([]);
  const [stats, setStats] = useState<SmartFridgeStats | null>(null);

  // Lade Kühlschrank-Daten
  useEffect(() => {
    if (isFocused) {
      loadFridgeData();
    }
  }, [isFocused]);

  const loadFridgeData = async () => {
    try {
      setIsLoading(true);
      // TODO: Aktiven Kühlschrank aus AsyncStorage laden
      const fridgeId = 'demo_fridge'; // Temporär
      
      if (!fridgeId) {
        setIsLoading(false);
        return;
      }

      // Lade Daten parallel
      const [inventoryData, statsData] = await Promise.all([
        smartFridgeService.getInventory(fridgeId),
        smartFridgeService.getFridgeStats(fridgeId)
      ]);

      setInventory(inventoryData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading fridge data:', error);
      Alert.alert(
        'Fehler',
        'Die Kühlschrank-Daten konnten nicht geladen werden.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadFridgeData();
    setIsRefreshing(false);
  };

  const handleConnectFridge = async (manufacturer: string, ipAddress: string) => {
    try {
      setIsLoading(true);
      const result = await smartFridgeService.connectFridge(
        manufacturer as SmartFridgeConfig['manufacturer'],
        ipAddress
      );

      if (result.success && result.fridgeId) {
        // TODO: Speichere aktiven Kühlschrank in AsyncStorage
        await loadFridgeData();
        setShowConnectModal(false);
      } else {
        Alert.alert('Fehler', result.error || 'Verbindung fehlgeschlagen');
      }
    } catch (error) {
      console.error('Error connecting fridge:', error);
      Alert.alert('Fehler', 'Die Verbindung konnte nicht hergestellt werden.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateItem = async (item: FridgeInventoryItem) => {
    try {
      setIsLoading(true);
      if (!connectedFridge?.id) return;

      const success = await smartFridgeService.updateInventoryItem(
        connectedFridge.id,
        item
      );

      if (success) {
        await loadFridgeData();
      } else {
        Alert.alert('Fehler', 'Der Artikel konnte nicht aktualisiert werden.');
      }
    } catch (error) {
      console.error('Error updating item:', error);
      Alert.alert('Fehler', 'Der Artikel konnte nicht aktualisiert werden.');
    } finally {
      setIsLoading(false);
    }
  };

  // Render Loading State
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Render No Fridge Connected State
  if (!connectedFridge) {
    return (
      <View style={styles.centerContainer}>
        <Icon 
          name="fridge-off" 
          size={64} 
          color={theme.colors.primary} 
        />
        <Text style={styles.noFridgeText}>
          Kein Kühlschrank verbunden
        </Text>
        <FAB
          icon="plus"
          label="Kühlschrank verbinden"
          onPress={() => setShowConnectModal(true)}
          style={styles.fab}
        />
        <ConnectFridgeModal
          visible={showConnectModal}
          onDismiss={() => setShowConnectModal(false)}
          onConnect={handleConnectFridge}
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
          />
        }
      >
        <FridgeHeader fridge={connectedFridge} />
        
        {stats && (
          <FridgeStats stats={stats} />
        )}

        <FridgeInventoryList
          items={inventory}
          onUpdateItem={handleUpdateItem}
        />
      </ScrollView>

      <FAB
        icon="refresh"
        label="Aktualisieren"
        onPress={handleRefresh}
        style={styles.fab}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  noFridgeText: {
    fontSize: 18,
    marginTop: 16,
    marginBottom: 32,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});