import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { BudgetAdjustment } from '../../types/budget';

interface Props {
  adjustments: BudgetAdjustment[];
  loading?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
};

const calculatePercentageChange = (oldLimit: number, newLimit: number): number => {
  return ((newLimit - oldLimit) / oldLimit) * 100;
};

const BudgetAdjustmentHistoryItem: React.FC<{ adjustment: BudgetAdjustment }> = ({
  adjustment
}) => {
  const percentageChange = calculatePercentageChange(
    adjustment.oldLimit,
    adjustment.newLimit
  );
  const isIncrease = percentageChange > 0;

  return (
    <View style={styles.itemContainer}>
      <View style={styles.itemHeader}>
        <Icon
          name={isIncrease ? 'trending-up' : 'trending-down'}
          size={24}
          color={isIncrease ? '#4CAF50' : '#F44336'}
          style={styles.icon}
        />
        <Text style={styles.date}>{formatDate(adjustment.date)}</Text>
      </View>

      <View style={styles.amountContainer}>
        <View style={styles.limitChange}>
          <Text style={styles.oldLimit}>
            {formatAmount(adjustment.oldLimit)}
          </Text>
          <Icon name="arrow-right" size={16} color="#666" style={styles.arrow} />
          <Text style={styles.newLimit}>
            {formatAmount(adjustment.newLimit)}
          </Text>
        </View>
        <Text
          style={[
            styles.percentageChange,
            { color: isIncrease ? '#4CAF50' : '#F44336' }
          ]}
        >
          {isIncrease ? '+' : ''}
          {percentageChange.toFixed(1)}%
        </Text>
      </View>

      <Text style={styles.reason}>{adjustment.reason}</Text>

      {adjustment.confidence && (
        <View style={styles.confidenceContainer}>
          <Text style={styles.confidenceLabel}>Konfidenz:</Text>
          <View style={styles.confidenceBar}>
            <View
              style={[
                styles.confidenceFill,
                { width: `${adjustment.confidence}%` }
              ]}
            />
          </View>
          <Text style={styles.confidenceValue}>{adjustment.confidence}%</Text>
        </View>
      )}
    </View>
  );
};

export const BudgetAdjustmentHistory: React.FC<Props> = ({
  adjustments,
  loading,
  onRefresh,
  refreshing
}) => {
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <FlatList
      data={adjustments}
      keyExtractor={(item, index) => `${item.date}-${index}`}
      renderItem={({ item }) => (
        <BudgetAdjustmentHistoryItem adjustment={item} />
      )}
      contentContainerStyle={styles.listContainer}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing || false} onRefresh={onRefresh} />
        ) : undefined
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Keine Anpassungen in der Historie vorhanden.
          </Text>
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    padding: 16,
    flexGrow: 1
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
    color: '#666',
    fontSize: 16,
    textAlign: 'center'
  },
  itemContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  icon: {
    marginRight: 8
  },
  date: {
    color: '#666',
    fontSize: 14
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  limitChange: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  oldLimit: {
    fontSize: 16,
    color: '#666',
    textDecorationLine: 'line-through'
  },
  arrow: {
    marginHorizontal: 8
  },
  newLimit: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333'
  },
  percentageChange: {
    fontSize: 14,
    fontWeight: '600'
  },
  reason: {
    color: '#666',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  confidenceLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 8
  },
  confidenceBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginRight: 8
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2
  },
  confidenceValue: {
    fontSize: 12,
    color: '#666',
    minWidth: 40
  }
});