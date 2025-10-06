import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { List, FAB } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { ShoppingList } from '../types/storage';
import { OfflineStorage } from '../services/offlineStorage';

export const ListsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'Lists'>>();
  const [lists, setLists] = useState<ShoppingList[]>([]);

  useEffect(() => {
    loadLists();
  }, []);

  useEffect(() => {
    if (route.params?.newList) {
      loadLists();
    }
  }, [route.params?.newList]);

  const loadLists = async () => {
    try {
      const storedLists = await OfflineStorage.getLists();
      setLists(storedLists);
    } catch (error) {
      console.error('Fehler beim Laden der Listen:', error);
    }
  };

  const renderItem = ({ item }: { item: ShoppingList }) => (
    <List.Item
      title={item.name}
      description={`${item.items.length} Produkte`}
      left={props => <List.Icon {...props} icon="format-list-bulleted" />}
      onPress={() => navigation.navigate('ListDetails', { listId: item.id })}
    />
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={lists}
        renderItem={renderItem}
        keyExtractor={item => item.id}
      />
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('CreateList')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});