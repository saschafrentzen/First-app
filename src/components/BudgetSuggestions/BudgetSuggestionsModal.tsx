import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { Modal } from '../Modal';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { BudgetCategory, BudgetSuggestion } from '../../types/budget';
import { BudgetSuggestionsList } from './BudgetSuggestionsList';

interface Props {
  category: BudgetCategory;
  visible: boolean;
  onClose: () => void;
  onSuggestionApplied: (suggestion: BudgetSuggestion) => Promise<void>;
}

export const BudgetSuggestionsModal: React.FC<Props> = ({
  category,
  visible,
  onClose,
  onSuggestionApplied
}) => {
  const handleSuggestionAccepted = async (suggestion: BudgetSuggestion) => {
    try {
      // TODO: Implementiere die Logik zum Anwenden der Vorschläge
      // z.B. Aktualisiere das Budget über den BudgetService
      
      await onSuggestionApplied(suggestion);
    } catch (error) {
      console.error('Fehler beim Anwenden des Budget-Vorschlags:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      animationType="slide"
      contentStyle={styles.container}
    >
        <View style={styles.header}>
          <Text style={styles.title}>Budget-Vorschläge</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Icon name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <View style={styles.categoryInfo}>
          <Text style={styles.categoryName}>{category.name}</Text>
          <Text style={styles.categoryBudget}>
            Aktuelles Budget: {new Intl.NumberFormat('de-DE', {
              style: 'currency',
              currency: 'EUR'
            }).format(category.limit)}
          </Text>
        </View>

        <View style={styles.content}>
          <BudgetSuggestionsList
            category={category}
            onSuggestionAccepted={handleSuggestionAccepted}
          />
        </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 0
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333'
  },
  closeButton: {
    padding: 8
  },
  categoryInfo: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4
  },
  categoryBudget: {
    fontSize: 14,
    color: '#666'
  },
  content: {
    flex: 1
  }
});