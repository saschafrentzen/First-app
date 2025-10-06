import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  Animated
} from 'react-native';
import { AnimatedProgressBar } from '../Progress/ProgressBar';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { BudgetCategory } from '../../types/budget';
import { IconName } from '../../types/icons';

interface Props {
  category: BudgetCategory;
  onPress: () => void;
}

export const BudgetCategoryCard: React.FC<Props> = React.memo(({ 
  category, 
  onPress 
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true
    }).start();
  };

  const percentageSpent = (category.spent / category.limit) * 100;
  const isOverBudget = percentageSpent > 100;

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.9}
    >
      <Animated.View
        style={[
          styles.container,
          { transform: [{ scale: scaleAnim }] }
        ]}
      >
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Icon
              name={(category.icon || 'wallet') as IconName}
              size={24}
              color={category.color || '#4CAF50'}
              style={styles.icon}
            />
            <Text style={styles.title}>{category.name}</Text>
          </View>
          <Text
            style={[
              styles.percentage,
              isOverBudget ? styles.overBudget : styles.underBudget
            ]}
          >
            {percentageSpent.toFixed(1)}%
          </Text>
        </View>

        <View style={styles.budgetContainer}>
          <View>
            <Text style={styles.label}>Budget</Text>
            <Text style={styles.amount}>
              {new Intl.NumberFormat('de-DE', {
                style: 'currency',
                currency: 'EUR'
              }).format(category.limit)}
            </Text>
          </View>
          <View style={styles.separator} />
          <View>
            <Text style={styles.label}>Ausgegeben</Text>
            <Text
              style={[
                styles.amount,
                isOverBudget ? styles.overBudget : undefined
              ]}
            >
              {new Intl.NumberFormat('de-DE', {
                style: 'currency',
                currency: 'EUR'
              }).format(category.spent)}
            </Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <AnimatedProgressBar
            progress={percentageSpent}
            fillColor={isOverBudget ? '#F44336' : '#4CAF50'}
            height={4}
            animated={true}
            duration={800}
          />
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  icon: {
    marginRight: 8
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333'
  },
  percentage: {
    fontSize: 14,
    fontWeight: '600'
  },
  budgetContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  separator: {
    width: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 16
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333'
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden'
  },
  progressBar: {
    flex: 1,
    borderRadius: 2
  },
  progressFill: {
    height: '100%',
    borderRadius: 2
  },
  overBudget: {
    color: '#F44336'
  },
  underBudget: {
    color: '#4CAF50'
  }
});