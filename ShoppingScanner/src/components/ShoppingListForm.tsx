import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  TextInput,
  Button,
  List,
  Text,
  IconButton,
  Surface,
  useTheme,
} from 'react-native-paper';
import { ShoppingList, ShoppingItem } from '../types/storage';
import { OfflineStorage } from '../services/offlineStorage';

interface ShoppingListFormProps {
  onListCreated?: (list: ShoppingList) => void;
}

export const ShoppingListForm: React.FC<ShoppingListFormProps> = ({ onListCreated }) => {
  const theme = useTheme();
  const [listName, setListName] = useState('');
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddItem = () => {
    if (!newItemName.trim()) {
      Alert.alert('Fehler', 'Bitte geben Sie einen Produktnamen ein.');
      return;
    }

    const quantity = parseInt(newItemQuantity, 10);
    if (isNaN(quantity) || quantity < 1) {
      Alert.alert('Fehler', 'Bitte geben Sie eine gültige Menge ein (mindestens 1).');
      return;
    }

    const newItem: ShoppingItem = {
      id: Date.now().toString(),
      name: newItemName.trim(),
      quantity: quantity,
      price: 0, // Kann später aktualisiert werden
      addedAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };

    setItems([...items, newItem]);
    setNewItemName('');
    setNewItemQuantity('1');
  };

  const handleRemoveItem = (itemId: string) => {
    setItems(items.filter(item => item.id !== itemId));
  };

  const handleUpdateQuantity = (itemId: string, newQuantity: string) => {
    const quantity = parseInt(newQuantity, 10);
    if (isNaN(quantity) || quantity < 1) return;

    setItems(items.map(item => 
      item.id === itemId 
        ? { ...item, quantity, lastModified: new Date().toISOString() }
        : item
    ));
  };

  const handleSubmit = async () => {
    if (!listName.trim()) {
      Alert.alert('Fehler', 'Bitte geben Sie einen Namen für die Einkaufsliste ein.');
      return;
    }

    if (items.length === 0) {
      Alert.alert('Fehler', 'Bitte fügen Sie mindestens ein Produkt hinzu.');
      return;
    }

      try {
      setIsSubmitting(true);
      const newList: ShoppingList = {
        id: Date.now().toString(),
        name: listName.trim(),
        items: items,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      };

      await OfflineStorage.saveList(newList);      Alert.alert(
        'Erfolg',
        'Die Einkaufsliste wurde erfolgreich erstellt.',
        [
          {
            text: 'OK',
            onPress: () => {
              setListName('');
              setItems([]);
              onListCreated?.(newList);
            },
          },
        ],
      );
    } catch (error) {
      Alert.alert(
        'Fehler',
        'Beim Speichern der Einkaufsliste ist ein Fehler aufgetreten.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        <Surface style={styles.form}>
          <TextInput
            label="Name der Einkaufsliste"
            value={listName}
            onChangeText={setListName}
            style={styles.input}
          />

          <View style={styles.addItemContainer}>
            <TextInput
              label="Produkt"
              value={newItemName}
              onChangeText={setNewItemName}
              style={[styles.input, styles.productInput]}
            />
            <TextInput
              label="Menge"
              value={newItemQuantity}
              onChangeText={setNewItemQuantity}
              keyboardType="numeric"
              style={[styles.input, styles.quantityInput]}
            />
            <IconButton
              icon="plus"
              mode="contained"
              onPress={handleAddItem}
              style={styles.addButton}
            />
          </View>

          <List.Section>
            <List.Subheader>Produkte</List.Subheader>
            {items.map((item) => (
              <Surface key={item.id} style={styles.itemContainer}>
                <View style={styles.itemContent}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <View style={styles.itemControls}>
                    <TextInput
                      value={item.quantity.toString()}
                      onChangeText={(value) => handleUpdateQuantity(item.id, value)}
                      keyboardType="numeric"
                      style={styles.quantityControl}
                    />
                    <IconButton
                      icon="delete"
                      mode="contained"
                      onPress={() => handleRemoveItem(item.id)}
                      style={styles.deleteButton}
                    />
                  </View>
                </View>
              </Surface>
            ))}
          </List.Section>

          <Button
            mode="contained"
            onPress={handleSubmit}
            disabled={isSubmitting}
            style={styles.submitButton}
          >
            {isSubmitting ? 'Wird gespeichert...' : 'Einkaufsliste erstellen'}
          </Button>
        </Surface>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 16,
    elevation: 4,
    margin: 8,
    borderRadius: 8,
  },
  input: {
    marginBottom: 12,
  },
  addItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  productInput: {
    flex: 2,
    marginRight: 8,
  },
  quantityInput: {
    flex: 1,
    marginRight: 8,
  },
  addButton: {
    margin: 0,
  },
  itemContainer: {
    marginVertical: 4,
    padding: 8,
    borderRadius: 4,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemName: {
    flex: 1,
    marginRight: 8,
  },
  itemControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityControl: {
    width: 60,
    height: 40,
    marginRight: 8,
  },
  deleteButton: {
    margin: 0,
  },
  submitButton: {
    marginTop: 16,
  },
});