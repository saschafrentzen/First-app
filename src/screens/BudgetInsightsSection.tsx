import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { BudgetCategory } from '../types/budget';

interface Props {
  category: BudgetCategory;
  onBudgetUpdated: () => void;
}

export const BudgetInsightsSection: React.FC<Props> = ({
  category,
  onBudgetUpdated
}) => {
    type InsightType = 'warning' | 'info' | 'success';

  interface Insight {
    type: InsightType;
    title: string;
    message: string;
    action?: {
      label: string;
      onPress: () => void;
    };
  }

  const insights = React.useMemo(() => {
    const insights: Insight[] = [];

    // Überprüfe, ob das Budget überschritten wurde
    if (category.spent > category.limit) {
      insights.push({
        type: 'warning',
        title: 'Budget überschritten',
        message: 'Sie haben Ihr Budget für diese Kategorie überschritten.',
        action: {
          label: 'Budget anpassen',
          onPress: () => {
            // Implementiere die Logik zum Anpassen des Budgets
            onBudgetUpdated();
          }
        }
      });
    }

    // Überprüfe, ob das Budget bald erreicht wird
    const remainingBudget = category.limit - category.spent;
    const remainingPercentage = (remainingBudget / category.limit) * 100;
    if (remainingPercentage > 0 && remainingPercentage < 20) {
      insights.push({
        type: 'info',
        title: 'Budget wird knapp',
        message: `Sie haben noch ${new Intl.NumberFormat('de-DE', {
          style: 'currency',
          currency: 'EUR'
        }).format(remainingBudget)} in dieser Kategorie übrig.`
      });
    }

    // Füge weitere Insights hinzu
    return insights;
  }, [category, onBudgetUpdated]);

  if (insights.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {insights.map((insight, index) => (
        <View
          key={index}
          style={[
            styles.insightCard,
            { backgroundColor: getBackgroundColor(insight.type) }
          ]}
        >
          <View style={styles.insightContent}>
            <Text style={styles.insightTitle}>{insight.title}</Text>
            <Text style={styles.insightMessage}>{insight.message}</Text>
          </View>
          {insight.action && (
            <TouchableOpacity
              style={styles.insightAction}
              onPress={insight.action.onPress}
            >
              <Text style={styles.actionText}>{insight.action.label}</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );
};

const getBackgroundColor = (type: 'warning' | 'info' | 'success') => {
  switch (type) {
    case 'warning':
      return '#FFF3E0';
    case 'info':
      return '#E3F2FD';
    case 'success':
      return '#E8F5E9';
    default:
      return '#FFFFFF';
  }
};

const styles = StyleSheet.create({
  container: {
    padding: 16
  },
  insightCard: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 8
  },
  insightContent: {
    marginBottom: 8
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4
  },
  insightMessage: {
    fontSize: 14,
    color: '#666666'
  },
  insightAction: {
    alignSelf: 'flex-start'
  },
  actionText: {
    color: '#2196F3',
    fontWeight: '600',
    fontSize: 14
  }
});