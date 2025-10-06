import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { getUserLists, ShoppingList } from '../services/database';

const HistoryScreen = () => {
  const [lists, setLists] = useState<ShoppingList[]>([]);

  useEffect(() => {
    loadLists();
  }, []);

  const loadLists = async () => {
    try {
      const userLists = await getUserLists();
      setLists(userLists);
    } catch (error) {
      console.error('Error loading lists:', error);
    }
  };

  const renderItem = ({ item }: { item: ShoppingList }) => (
    <Surface style={styles.listItem}>
      <Text style={styles.listName}>{item.name}</Text>
      <Text style={styles.listDate}>
        {new Date(item.createdAt).toLocaleDateString()}
      </Text>
      <Text style={styles.listTotal}>Total: €{item.totalAmount.toFixed(2)}</Text>
      {item.budget && (
        <Text style={[
          styles.listBudget,
          item.totalAmount > item.budget ? styles.overBudget : styles.underBudget
        ]}>
          Budget: €{item.budget.toFixed(2)}
        </Text>
      )}
      <Text style={styles.itemCount}>Items: {item.items.length}</Text>
    </Surface>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={lists}
        renderItem={renderItem}
        keyExtractor={item => item.id || ''}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  listContainer: {
    gap: 15,
  },
  listItem: {
    padding: 15,
    borderRadius: 10,
  },
  listName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  listDate: {
    color: '#666',
    marginBottom: 5,
  },
  listTotal: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
  },
  listBudget: {
    fontSize: 16,
    marginBottom: 5,
  },
  overBudget: {
    color: 'red',
  },
  underBudget: {
    color: 'green',
  },
  itemCount: {
    color: '#666',
  },
});

export default HistoryScreen;