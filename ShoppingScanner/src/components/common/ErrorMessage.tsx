import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => (
  <View style={styles.container}>
    <MaterialCommunityIcons
      name="alert-circle"
      size={32}
      color={theme.colors.error}
    />
    <Text style={styles.message}>{message}</Text>
    {onRetry && (
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <MaterialCommunityIcons
          name="refresh"
          size={20}
          color={theme.colors.primary}
        />
        <Text style={styles.retryText}>Erneut versuchen</Text>
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: theme.colors.card,
    borderRadius: 8,
    margin: 16,
    alignItems: 'center',
  },
  message: {
    marginTop: 8,
    color: theme.colors.text,
    textAlign: 'center',
    fontSize: 16,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 8,
  },
  retryText: {
    marginLeft: 8,
    color: theme.colors.primary,
    fontSize: 16,
  },
});