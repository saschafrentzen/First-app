import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { BudgetSuggestion } from '../../types/budget';
import { AnimatedMount } from '../Animations/AnimatedMount';

interface Props {
  suggestion: BudgetSuggestion;
  onAccept: () => void;
  onDismiss: () => void;
}

const getIconName = (type: BudgetSuggestion['type']): string => {
  switch (type) {
    case 'trend':
      return 'trending-up';
    case 'seasonal':
      return 'calendar-month';
    case 'recurring':
      return 'repeat';
    case 'benchmark':
      return 'chart-bar';
    case 'goal':
      return 'flag';
    default:
      return 'information';
  }
};

const getImpactColor = (impact: BudgetSuggestion['impact']): string => {
  switch (impact) {
    case 'high':
      return '#FF4444';
    case 'medium':
      return '#FFA000';
    case 'low':
      return '#4CAF50';
    default:
      return '#757575';
  }
};

const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
};

export const BudgetSuggestionCard = React.memo(({ suggestion, onAccept, onDismiss }: Props) => {
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

  return (
    <AnimatedMount animation="fadeInRight">
      <Animated.View style={[styles.container, {
        transform: [{ scale: scaleAnim }]
      }]}>
        <View style={styles.header}>
          <View style={styles.typeContainer}>
            <Icon
              name={getIconName(suggestion.type)}
              size={24}
              color="#333"
              style={styles.icon}
            />
            <Text style={styles.type}>
              {suggestion.type.charAt(0).toUpperCase() + suggestion.type.slice(1)}
            </Text>
          </View>
          <View
            style={[
              styles.impactIndicator,
              { backgroundColor: getImpactColor(suggestion.impact) }
            ]}
          >
            <Text style={styles.impactText}>{suggestion.impact}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.reason}>{suggestion.reason}</Text>
          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>Vorgeschlagener Betrag:</Text>
            <Text style={styles.amount}>{formatAmount(suggestion.amount)}</Text>
          </View>
          <View style={styles.confidenceContainer}>
            <Text style={styles.confidenceLabel}>Konfidenz:</Text>
            <View style={styles.confidenceBar}>
              <View
                style={[
                  styles.confidenceFill,
                  { width: `${suggestion.confidence}%` }
                ]}
              />
            </View>
            <Text style={styles.confidenceValue}>{suggestion.confidence}%</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.dismissButton]}
            onPress={onDismiss}
          >
            <Text style={styles.dismissButtonText}>Ablehnen</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.acceptButton]}
            onPress={onAccept}
          >
            <Text style={styles.acceptButtonText}>Übernehmen</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </AnimatedMount>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  icon: {
    marginRight: 8
  },
  type: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333'
  },
  impactIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  impactText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase'
  },
  content: {
    marginBottom: 16
  },
  reason: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20
  },
  amountContainer: {
    marginBottom: 12
  },
  amountLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4
  },
  amount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333'
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
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    marginRight: 8
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3
  },
  confidenceValue: {
    fontSize: 12,
    color: '#666',
    minWidth: 40
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 8
  },
  dismissButton: {
    backgroundColor: '#f5f5f5'
  },
  dismissButtonText: {
    color: '#666'
  },
  acceptButton: {
    backgroundColor: '#4CAF50'
  },
  acceptButtonText: {
    color: '#fff'
  }
});