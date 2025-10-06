import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  Animated,
  Easing
} from 'react-native';
import { AnimatedMount } from '../Animations/AnimatedMount';
import { BudgetCategory, BudgetSuggestion } from '../../types/budget';
import { BudgetSuggestionsModal } from '../BudgetSuggestions/BudgetSuggestionsModal';
import { BudgetAdjustmentHistoryModal } from '../BudgetAdjustments/BudgetAdjustmentHistoryModal';
import { budgetSuggestionService } from '../../services/budget-suggestion.service';
import { budgetService } from '../../services/budget.service';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface Props {
  category: BudgetCategory;
  onBudgetUpdated: () => void;
}

export const BudgetInsightsSection: React.FC<Props> = ({
  category,
  onBudgetUpdated
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasSuggestions, setHasSuggestions] = useState<boolean | null>(null);
  const { width } = useWindowDimensions();

  const checkForSuggestions = useCallback(async () => {
    try {
      setLoading(true);
      const suggestions = await budgetSuggestionService.generateSuggestions(category);
      setHasSuggestions(suggestions.length > 0);
    } catch (error) {
      console.error('Fehler beim Prüfen auf Vorschläge:', error);
      setHasSuggestions(false);
    } finally {
      setLoading(false);
    }
  }, [category]);

  // Prüfe auf Vorschläge, wenn die Komponente geladen wird
  React.useEffect(() => {
    checkForSuggestions();
  }, [checkForSuggestions]);

  const handleSuggestionApplied = async (suggestion: BudgetSuggestion) => {
    try {
      await budgetService.applyBudgetSuggestion(category.id, suggestion);
      onBudgetUpdated();
      // Prüfe erneut auf weitere Vorschläge
      checkForSuggestions();
    } catch (error) {
      console.error('Fehler beim Anwenden des Vorschlags:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>
          Analysiere Budget-Daten...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Budget-Einblicke</Text>
      
      <AnimatedMount animation="slideUp" delay={300}>
        <View style={styles.cardContainer}>
          <AnimatedMount animation="fadeInRight" delay={400}>
            <TouchableOpacity
              style={[styles.card, { width: (width - 48) / 2 }]}
              onPress={() => setShowSuggestions(true)}
            >
          <Icon
            name={hasSuggestions ? "lightbulb-on" : "lightbulb-outline"}
            size={24}
            color={hasSuggestions ? "#FFA000" : "#666"}
            style={styles.cardIcon}
          />
          <Text style={styles.cardTitle}>Vorschläge</Text>
          <Text style={styles.cardSubtitle}>
            {hasSuggestions
              ? "Neue Vorschläge verfügbar"
              : "Keine neuen Vorschläge"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, { width: (width - 48) / 2 }]}
          onPress={() => setShowHistory(true)}
        >
          <Icon
            name="history"
            size={24}
            color="#666"
            style={styles.cardIcon}
          />
          <Text style={styles.cardTitle}>Verlauf</Text>
          <Text style={styles.cardSubtitle}>
            Anpassungshistorie anzeigen
          </Text>
            </TouchableOpacity>
          </AnimatedMount>
        </View>
      </AnimatedMount>      {/* Modals */}
      <BudgetSuggestionsModal
        category={category}
        visible={showSuggestions}
        onClose={() => setShowSuggestions(false)}
        onSuggestionApplied={handleSuggestionApplied}
      />

      <BudgetAdjustmentHistoryModal
        category={category}
        visible={showHistory}
        onClose={() => setShowHistory(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16
  },
  loadingText: {
    color: '#666',
    textAlign: 'center',
    marginVertical: 16
  },
  cardContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  cardIcon: {
    marginBottom: 8
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#666'
  }
});