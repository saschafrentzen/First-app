import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl
} from 'react-native';
import { AnimatedProgressBar, SegmentedProgressBar } from '../components/Progress/ProgressBar';
import { BudgetCategory } from '../types/budget';
import { BudgetInsightsSection } from '../components/Budget/BudgetInsightsSection';

interface Props {
  category: BudgetCategory;
  onRefresh?: () => Promise<void>;
  refreshing?: boolean;
  onBudgetUpdated: () => void;
}

export const BudgetDetailsScreen: React.FC<Props> = ({
  category,
  onRefresh,
  refreshing = false,
  onBudgetUpdated
}) => {
  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        ) : undefined
      }
    >
      {/* Budget-Übersicht */}
      <View style={styles.overviewSection}>
        <Text style={styles.categoryName}>{category.name}</Text>
        <Text style={styles.budgetAmount}>
          {new Intl.NumberFormat('de-DE', {
            style: 'currency',
            currency: 'EUR'
          }).format(category.limit)}
        </Text>
        <View style={styles.spentContainer}>
          <Text style={styles.spentLabel}>Ausgegeben:</Text>
          <Text style={styles.spentAmount}>
            {new Intl.NumberFormat('de-DE', {
              style: 'currency',
              currency: 'EUR'
            }).format(category.spent)}
          </Text>
        </View>
        <View style={styles.progressSection}>
          <View style={styles.progressContainer}>
            <AnimatedProgressBar
              progress={(category.spent / category.limit) * 100}
              fillColor={category.spent > category.limit ? '#F44336' : '#4CAF50'}
              height={8}
              animated={true}
              duration={1000}
            />
            <Text style={styles.progressText}>
              {((category.spent / category.limit) * 100).toFixed(1)}%
            </Text>
          </View>
          
          <View style={styles.monthlyProgress}>
            <Text style={styles.monthlyProgressTitle}>Monatlicher Verlauf</Text>
            <SegmentedProgressBar
              current={new Date().getDate()}
              total={30}
              segments={10}
              height={4}
              gap={4}
              activeColor={category.spent > category.limit ? '#F44336' : '#4CAF50'}
            />
          </View>
        </View>
      </View>

      {/* Budget Insights */}
      <BudgetInsightsSection
        category={category}
        onBudgetUpdated={onBudgetUpdated}
      />

      {/* Weitere Abschnitte können hier hinzugefügt werden */}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  overviewSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8
  },
  categoryName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8
  },
  budgetAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#4CAF50',
    marginBottom: 16
  },
  spentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  spentLabel: {
    fontSize: 14,
    color: '#666'
  },
  spentAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333'
  },
  progressSection: {
    marginTop: 16
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginRight: 8,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    borderRadius: 4
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    minWidth: 50
  },
  monthlyProgress: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0'
  },
  monthlyProgressTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12
  }
});