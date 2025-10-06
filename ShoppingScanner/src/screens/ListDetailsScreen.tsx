import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { List, Text, ActivityIndicator } from 'react-native-paper';
import { useRoute } from '@react-navigation/native';
import { ShoppingList } from '../types/storage';
import { OfflineStorage } from '../services/offlineStorage';

export const ListDetailsScreen: React.FC = () => {
  const route = useRoute();
  const [list, setList] = useState<ShoppingList | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadList();
  }, []);

  const loadList = async () => {
    try {
      const listId = route.params?.listId;
      if (!listId) return;

      const lists = await OfflineStorage.getLists();
      const foundList = lists.find(l => l.id === listId);
      if (foundList) {
        setList(foundList);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Liste:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!list) {
    return (
      <View style={styles.container}>
        <Text>Liste nicht gefunden</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <List.Section>
        <List.Subheader>Produkte</List.Subheader>
        {list.items.map((item) => (
          <List.Item
            key={item.id}
            title={item.name}
            description={`Menge: ${item.quantity}`}
            left={props => <List.Icon {...props} icon="shopping" />}
          />
        ))}
      </List.Section>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});