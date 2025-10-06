import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Button, Text, TextInput, Surface, IconButton, Portal, Dialog } from 'react-native-paper';
import { ShoppingList, ShoppingItem, createShoppingList, updateShoppingList } from '../services/database';

interface ListManagementScreenProps {
  navigation: any;
}

const ListManagementScreen = ({ navigation }: ListManagementScreenProps) => {
  const [listName, setListName] = useState('');
  const [budget, setBudget] = useState('');
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [currentList, setCurrentList] = useState<ShoppingList | null>(null);

  const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCreateList = async () => {
    if (!listName) return;

    const newList: Omit<ShoppingList, 'id' | 'userId'> = {
      name: listName,
      budget: budget ? parseFloat(budget) : undefined,
      items: [],
      totalAmount: 0,
      createdAt: new Date(),
    };

    try {
      const createdList = await createShoppingList(newList);
      setCurrentList(createdList);
      setDialogVisible(false);
    } catch (error) {
      console.error('Error creating list:', error);
    }
  };

  const handleAddItem = (item: ShoppingItem) => {
    setItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(i => i.name === item.name);
      
      if (existingItemIndex >= 0) {
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + 1,
        };
        return updatedItems;
      }

      return [...prevItems, item];
    });
  };

  const handleUpdateQuantity = (index: number, increment: boolean) => {
    setItems(prevItems => {
      const updatedItems = [...prevItems];
      const item = updatedItems[index];
      
      if (increment || item.quantity > 1) {
        updatedItems[index] = {
          ...item,
          quantity: increment ? item.quantity + 1 : item.quantity - 1,
        };
      }
      
      return updatedItems;
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems(prevItems => prevItems.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (currentList?.id) {
      updateShoppingList(currentList.id, {
        items,
        totalAmount,
      });
    }
  }, [items, totalAmount]);

  const renderItem = ({ item, index }: { item: ShoppingItem; index: number }) => (
    <Surface style={styles.itemContainer}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text>€{(item.price * item.quantity).toFixed(2)}</Text>
      </View>
      <View style={styles.itemActions}>
        <IconButton icon="minus" onPress={() => handleUpdateQuantity(index, false)} />
        <Text>{item.quantity}</Text>
        <IconButton icon="plus" onPress={() => handleUpdateQuantity(index, true)} />
        <IconButton icon="delete" onPress={() => handleRemoveItem(index)} />
      </View>
    </Surface>
  );

  return (
    <View style={styles.container}>
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>Create New Shopping List</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="List Name"
              value={listName}
              onChangeText={setListName}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Budget (optional)"
              value={budget}
              onChangeText={setBudget}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleCreateList}>Create</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {currentList ? (
        <>
          <Surface style={styles.header}>
            <Text style={styles.title}>{currentList.name}</Text>
            {currentList.budget && (
              <Text style={[
                styles.budget,
                totalAmount > currentList.budget ? styles.overBudget : null
              ]}>
                Budget: €{currentList.budget.toFixed(2)}
              </Text>
            )}
            <Text style={styles.total}>Total: €{totalAmount.toFixed(2)}</Text>
          </Surface>

          <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={(item, index) => `${item.name}-${index}`}
            style={styles.list}
          />

          <Button
            mode="contained"
            onPress={() => navigation.navigate('Scanner', { onAddItem: handleAddItem })}
            style={styles.scanButton}
          >
            Scan Item
          </Button>
        </>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No active shopping list</Text>
          <Button
            mode="contained"
            onPress={() => setDialogVisible(true)}
            style={styles.createButton}
          >
            Create New List
          </Button>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    padding: 15,
    marginBottom: 20,
    borderRadius: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  budget: {
    fontSize: 18,
    marginBottom: 5,
  },
  overBudget: {
    color: 'red',
  },
  total: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  list: {
    flex: 1,
  },
  itemContainer: {
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
  },
  itemInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  itemName: {
    fontSize: 16,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  input: {
    marginBottom: 10,
  },
  scanButton: {
    marginTop: 10,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 18,
    marginBottom: 20,
  },
  createButton: {
    width: 200,
  },
});

export default ListManagementScreen;