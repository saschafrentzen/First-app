import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { BudgetSuggestion, BudgetCategory } from '../../types/budget';
import { BudgetSuggestionCard } from './BudgetSuggestionCard';
import { budgetSuggestionService } from '../../services/budget-suggestion.service';

interface Props {
  category: BudgetCategory;
  onSuggestionAccepted: (suggestion: BudgetSuggestion) => void;
}

export const BudgetSuggestionsList: React.FC<Props> = ({
  category,
  onSuggestionAccepted
}) => {
  const [suggestions, setSuggestions] = useState<BudgetSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSuggestions = async () => {
    try {
      const newSuggestions = await budgetSuggestionService.generateSuggestions(category);
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error('Fehler beim Laden der Budget-Vorschläge:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSuggestions();
    setRefreshing(false);
  };

  const handleAccept = (suggestion: BudgetSuggestion) => {
    onSuggestionAccepted(suggestion);
    // Entferne den akzeptierten Vorschlag aus der Liste
    setSuggestions(current => 
      current.filter(s => s !== suggestion)
    );
  };

  const handleDismiss = (suggestion: BudgetSuggestion) => {
    // Entferne den abgelehnten Vorschlag aus der Liste
    setSuggestions(current => 
      current.filter(s => s !== suggestion)
    );
  };

  useEffect(() => {
    loadSuggestions();
  }, [category]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={['#4CAF50']}
        />
      }
    >
      {suggestions.length > 0 ? (
        suggestions.map((suggestion, index) => (
          <BudgetSuggestionCard
            key={`${suggestion.type}-${index}`}
            suggestion={suggestion}
            onAccept={() => handleAccept(suggestion)}
            onDismiss={() => handleDismiss(suggestion)}
          />
        ))
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Keine Budget-Vorschläge verfügbar.{'\n'}
            Ziehen Sie nach unten, um zu aktualisieren.
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    lineHeight: 24
  }
});