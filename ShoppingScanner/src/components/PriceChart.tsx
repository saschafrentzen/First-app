import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { PriceHistory, PriceHistoryStats } from '../models/PriceHistory';
import { priceAlertService } from '../services/PriceAlertService';
import { formatCurrency } from '../utils/formatters';

interface PriceChartProps {
  productId: string;
  width?: number;
  height?: number;
}

export const PriceChart: React.FC<PriceChartProps> = ({ 
  productId,
  width = Dimensions.get('window').width - 32,
  height = 220
}) => {
  const [stats, setStats] = useState<PriceHistoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPriceStats();
  }, [productId]);

  const loadPriceStats = async () => {
    try {
      setLoading(true);
      const priceStats = await priceAlertService.getPriceStats(productId);
      setStats(priceStats);
      setError(null);
    } catch (err) {
      setError('Keine Preisdaten verfügbar');
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Lade Preisverlauf...</Text>
      </View>
    );
  }

  if (error || !stats) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  const chartData = {
    labels: stats.priceHistory
      .map(h => new Date(h.timestamp).toLocaleDateString())
      .slice(-7), // Zeige nur die letzten 7 Datenpunkte
    datasets: [{
      data: stats.priceHistory.map(h => h.price).slice(-7)
    }]
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Niedrigster Preis</Text>
          <Text style={styles.statValue}>{formatCurrency(stats.lowestPrice)}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Höchster Preis</Text>
          <Text style={styles.statValue}>{formatCurrency(stats.highestPrice)}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Durchschnittspreis</Text>
          <Text style={styles.statValue}>{formatCurrency(stats.averagePrice)}</Text>
        </View>
      </View>

      <View style={styles.changeContainer}>
        <Text style={styles.changeLabel}>30-Tage Preisänderung:</Text>
        <Text style={[
          styles.changeValue,
          { color: stats.priceChange30Days > 0 ? '#d32f2f' : '#388e3c' }
        ]}>
          {stats.priceChange30Days > 0 ? '+' : ''}
          {stats.priceChange30Days.toFixed(1)}%
        </Text>
      </View>

      <LineChart
        data={chartData}
        width={width}
        height={height}
        chartConfig={{
          backgroundColor: '#ffffff',
          backgroundGradientFrom: '#ffffff',
          backgroundGradientTo: '#ffffff',
          decimalPlaces: 2,
          color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
          style: {
            borderRadius: 16
          }
        }}
        style={styles.chart}
        bezier
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  statBox: {
    flex: 1,
    padding: 10,
    marginHorizontal: 5,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    alignItems: 'center'
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000'
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20
  },
  changeLabel: {
    fontSize: 14,
    color: '#666666',
    marginRight: 8
  },
  changeValue: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16
  },
  errorText: {
    color: '#d32f2f',
    textAlign: 'center'
  }
});