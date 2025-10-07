import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SmartFridgeStats } from '../../types/smartHome';

interface Props {
  stats: SmartFridgeStats;
}

export const FridgeStats = ({ stats }: Props) => {
  const theme = useTheme();

  const StatItem = ({ 
    icon, 
    label, 
    value, 
    color = theme.colors.primary 
  }: { 
    icon: string;
    label: string;
    value: string | number;
    color?: string;
  }) => (
    <View style={styles.statItem}>
      <Icon name={icon} size={24} color={color} style={styles.statIcon} />
      <View>
        <Text variant="bodyMedium">{value}</Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {label}
        </Text>
      </View>
    </View>
  );

  return (
    <Card style={styles.container}>
      <Card.Content>
        <Text variant="titleMedium" style={styles.title}>
          Statistiken
        </Text>

        <View style={styles.grid}>
          <StatItem
            icon="food"
            label="Artikel gesamt"
            value={stats.totalItems}
          />

          <StatItem
            icon="clock-alert"
            label="Bald ablaufend"
            value={stats.expiringItems}
            color={theme.colors.error}
          />

          <StatItem
            icon="door"
            label="Tür geöffnet"
            value={`${stats.doorOpenCount}x`}
          />

          <StatItem
            icon="thermometer"
            label="Ø Temperatur"
            value={`${stats.averageTemperature.toFixed(1)}°C`}
          />

          <StatItem
            icon="lightning-bolt"
            label="Verbrauch"
            value={`${stats.powerConsumption.toFixed(1)} kWh`}
          />

          <StatItem
            icon="chart-pie"
            label="Kategorien"
            value={Object.keys(stats.itemCategories).length}
          />
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
  },
  title: {
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 16,
  },
  statIcon: {
    marginRight: 8,
  },
});