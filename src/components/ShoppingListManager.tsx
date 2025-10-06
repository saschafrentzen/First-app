import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  Button, 
  StyleSheet, 
  ActivityIndicator, 
  RefreshControl,
  ScrollView,
  Alert
} from 'react-native';
import { OfflineStorageService } from '../services/offlineStorage';
import type { ShoppingList } from '../types/storage';

export const ShoppingListManager: React.FC = () => {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const offlineStorage = OfflineStorageService.getInstance();

  useEffect(() => {
    loadLists();
    checkOnlineStatus();
  }, []);

  const checkOnlineStatus = async () => {
    const online = await offlineStorage.isOnline();
    setIsOnline(online);
  };

  const loadLists = async () => {
    try {
      setIsLoading(true);
      const savedLists = await offlineStorage.getShoppingLists();
      setLists(savedLists);
    } catch (error) {
      Alert.alert(
        'Fehler',
        'Beim Laden der Listen ist ein Fehler aufgetreten.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      await syncWithServer();
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const createExampleList = async () => {
    try {
      setIsLoading(true);
      const list: ShoppingList = {
        id: Date.now().toString(),
        name: 'Meine Einkaufsliste',
        items: [],
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      };
      
      await offlineStorage.saveShoppingList(list);
      await loadLists();
    } catch (error) {
      Alert.alert(
        'Fehler',
        'Die Liste konnte nicht erstellt werden.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const deleteList = async (listId: string) => {
    Alert.alert(
      'Liste löschen',
      'Möchten Sie diese Liste wirklich löschen?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await offlineStorage.deleteShoppingList(listId);
              await loadLists();
            } catch (error) {
              Alert.alert(
                'Fehler',
                'Die Liste konnte nicht gelöscht werden.',
                [{ text: 'OK' }]
              );
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const syncWithServer = async () => {
    if (!isOnline) {
      setSyncStatus('Offline - Synchronisation nicht möglich');
      return;
    }

    try {
      setSyncStatus('Synchronisiere...');
      const syncResult = await offlineStorage.syncWithServer();
      setSyncStatus(
        syncResult.success 
          ? `Synchronisation erfolgreich: ${syncResult.syncedChanges} Änderungen`
          : `Fehler bei der Synchronisation: ${syncResult.error}`
      );
      await loadLists();
    } catch (error) {
      setSyncStatus('Synchronisation fehlgeschlagen');
      Alert.alert(
        'Synchronisationsfehler',
        'Die Daten konnten nicht mit dem Server synchronisiert werden.',
        [{ text: 'OK' }]
      );
    }
  };

  const NetworkStatus = () => (
    <View style={[styles.networkStatus, { backgroundColor: isOnline ? '#4CAF50' : '#F44336' }]}>
      <Text style={styles.networkStatusText}>
        {isOnline ? 'Online' : 'Offline'}
      </Text>
    </View>
  );

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Laden...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <NetworkStatus />
      <Text style={styles.title}>Einkaufslisten</Text>
      
      <Button 
        title="Beispielliste erstellen"
        onPress={createExampleList}
      />
      
      <Button 
        title="Mit Server synchronisieren"
        onPress={syncWithServer}
        disabled={!isOnline}
      />
      
      {syncStatus ? (
        <Text style={[
          styles.syncStatus,
          { backgroundColor: syncStatus.includes('erfolgreich') ? '#E8F5E9' : '#FFEBEE' }
        ]}>
          {syncStatus}
        </Text>
      ) : null}
      
      <ScrollView 
        style={styles.listsContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
          />
        }
      >
        {lists.map((list: ShoppingList) => (
          <View key={list.id} style={styles.listItem}>
            <View style={styles.listHeader}>
              <Text style={styles.listName}>{list.name}</Text>
              <Button
                title="Löschen"
                onPress={() => deleteList(list.id)}
                color="#F44336"
              />
            </View>
            <Text style={styles.listInfo}>
              Artikel: {list.items.length} | 
              Erstellt: {new Date(list.createdAt).toLocaleDateString()}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  networkStatus: {
    padding: 4,
    alignItems: 'center',
    marginBottom: 8,
    borderRadius: 4,
  },
  networkStatusText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  syncStatus: {
    marginVertical: 8,
    padding: 8,
    borderRadius: 4,
  },
  listsContainer: {
    marginTop: 16,
  },
  listItem: {
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  listName: {
    fontSize: 18,
    fontWeight: '600',
  },
  listInfo: {
    marginTop: 4,
    color: '#666',
  },
});