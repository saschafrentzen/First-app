import React, { useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { List, Text, Card, IconButton, Menu, useTheme, Portal, Dialog, Button } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { FridgeInventoryItem, FridgeItemCategory } from '../../types/smartHome';

// Hilfsfunktionen für Kategorie-Icons und -Labels
const getCategoryIcon = (category: FridgeItemCategory): string => {
  const iconMap: Record<FridgeItemCategory, string> = {
    beverages: 'bottle-soda',
    dairy: 'cheese',
    meat: 'food-steak',
    vegetables: 'food-apple',
    fruits: 'fruit-cherries',
    condiments: 'sauce',
    leftovers: 'food-variant',
    other: 'food'
  };
  return iconMap[category] || 'food';
};

const getCategoryLabel = (category: FridgeItemCategory): string => {
  const labelMap: Record<FridgeItemCategory, string> = {
    beverages: 'Getränke',
    dairy: 'Milchprodukte',
    meat: 'Fleisch & Fisch',
    vegetables: 'Gemüse',
    fruits: 'Obst',
    condiments: 'Gewürze & Soßen',
    leftovers: 'Reste',
    other: 'Sonstiges'
  };
  return labelMap[category] || 'Sonstiges';
};

interface Props {
  items: FridgeInventoryItem[];
  onUpdateItem: (item: FridgeInventoryItem) => void;
}

export const FridgeInventoryList = ({ items, onUpdateItem }: Props) => {
  const theme = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FridgeInventoryItem | null>(null);
  const [confirmDialog, setConfirmDialog] = useState(false);

  const handleItemAction = (item: FridgeInventoryItem, action: 'increment' | 'decrement' | 'remove') => {
    switch (action) {
      case 'increment':
        onUpdateItem({
          ...item,
          quantity: item.quantity + 1,
        });
        break;
      case 'decrement':
        if (item.quantity > 0) {
          onUpdateItem({
            ...item,
            quantity: item.quantity - 1,
          });
        }
        break;
      case 'remove':
        setSelectedItem(item);
        setConfirmDialog(true);
        break;
    }
    setMenuVisible(false);
  };

  const getExpiryColor = (expiryDate: string) => {
    const days = Math.floor(
      (new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)
    );

    if (days < 0) return theme.colors.error;
    if (days < 3) return '#FFA000'; // Warnung in Amber, falls warning nicht im Theme definiert
    if (days < 7) return theme.colors.tertiary;
    return theme.colors.onSurface;
  };

  const renderItem = ({ item }: { item: FridgeInventoryItem }) => (
    <List.Item
      title={item.name}
      description={() => (
        <View>
          <Text variant="bodySmall">
            Menge: {item.quantity} {item.unit}
          </Text>
          <Text
            variant="bodySmall"
            style={{ color: getExpiryColor(item.expiryDate) }}
          >
            Haltbar bis: {new Date(item.expiryDate).toLocaleDateString()}
          </Text>
        </View>
      )}
      left={props => (
        <List.Icon
          {...props}
          icon={() => (
            <Icon
              name={item.category === 'beverages' ? 'bottle-soda' : getCategoryIcon(item.category)}
              size={24}
              color={theme.colors.primary}
            />
          )}
        />
      )}
      right={props => (
        <View style={styles.actions}>
          <IconButton
            icon="minus"
            size={20}
            onPress={() => handleItemAction(item, 'decrement')}
          />
          <Text>{item.quantity}</Text>
          <IconButton
            icon="plus"
            size={20}
            onPress={() => handleItemAction(item, 'increment')}
          />
          <Menu
            visible={menuVisible && selectedItem?.id === item.id}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <IconButton
                icon="dots-vertical"
                size={20}
                onPress={() => {
                  setSelectedItem(item);
                  setMenuVisible(true);
                }}
              />
            }
          >
            <Menu.Item
              onPress={() => handleItemAction(item, 'remove')}
              title="Entfernen"
              leadingIcon="delete"
            />
          </Menu>
        </View>
      )}
    />
  );

  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<FridgeItemCategory, FridgeInventoryItem[]>);

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.title}>
            Inventar
          </Text>
          
          {Object.entries(groupedItems).map(([category, items]) => (
            <View key={category}>
              <Text variant="titleSmall" style={styles.categoryTitle}>
                {getCategoryLabel(category as FridgeItemCategory)}
              </Text>
              <FlatList
                data={items}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                scrollEnabled={false}
              />
            </View>
          ))}

          {items.length === 0 && (
            <Text style={styles.emptyText}>
              Keine Artikel im Kühlschrank
            </Text>
          )}
        </Card.Content>
      </Card>

      <Portal>
        <Dialog
          visible={confirmDialog}
          onDismiss={() => setConfirmDialog(false)}
        >
          <Dialog.Title>Artikel entfernen</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Möchten Sie {selectedItem?.name} wirklich aus dem Inventar entfernen?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmDialog(false)}>Abbrechen</Button>
            <Button
              onPress={() => {
                if (selectedItem) {
                  onUpdateItem({
                    ...selectedItem,
                    quantity: 0,
                  });
                }
                setConfirmDialog(false);
              }}
            >
              Entfernen
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    margin: 16,
  },
  title: {
    marginBottom: 16,
  },
  categoryTitle: {
    marginTop: 16,
    marginBottom: 8,
    opacity: 0.7,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 16,
    opacity: 0.7,
  },
});