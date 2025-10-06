import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ShoppingListForm } from '../components/ShoppingListForm';
import { useNavigation } from '@react-navigation/native';
import { ShoppingList } from '../types/storage';

export const CreateListScreen: React.FC = () => {
  const navigation = useNavigation();

  const handleListCreated = (list: ShoppingList) => {
    // Nach dem Erstellen der Liste zur Übersicht navigieren
    navigation.navigate('Lists', { newList: list });
  };

  return (
    <View style={styles.container}>
      <ShoppingListForm onListCreated={handleListCreated} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});