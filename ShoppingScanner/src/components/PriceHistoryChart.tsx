import React, { useMemo } from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { PriceHistory } from '@app/types';

interface PriceHistoryChartProps {
  history: PriceHistory;
  days?: number;
  showSpecialOffers?: boolean;
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  showDots?: boolean;
}

export const PriceHistoryChart: React.FC<PriceHistoryChartProps> = ({
  history,
  days = 30,
  showSpecialOffers = false,
  height = 220,
  showLegend = true,
  showGrid = true,
  showDots = true,
}) => {
  const chartData = useMemo(() => {
    const now = new Date();
    const startDate = new Date();
    startDate.setDate(now.getDate() - days);

    // Filtere Preise nach Datum und Special Offers
    const filteredPrices = history.prices
      .filter(price => {
        const priceDate = new Date(price.date);
        return priceDate >= startDate && (showSpecialOffers || !price.isSpecialOffer);
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Gruppiere Preise nach Datum (Durchschnitt pro Tag)
    const dailyPrices = filteredPrices.reduce((acc, price) => {
      const date = price.date.split('T')[0];
      if (!acc[date]) {
        acc[date] = { sum: price.price, count: 1, isSpecial: price.isSpecialOffer };
      } else {
        acc[date].sum += price.price;
        acc[date].count += 1;
      }
      return acc;
    }, {} as { [key: string]: { sum: number; count: number; isSpecial: boolean } });

    // Erstelle die Datenpunkte für das Chart
    const labels: string[] = [];
    const regularPrices: number[] = [];
    const specialPrices: number[] = [];

    Object.entries(dailyPrices).forEach(([date, data]) => {
      const avgPrice = data.sum / data.count;
      labels.push(date.slice(-2)); // Zeige nur den Tag
      if (data.isSpecial) {
        specialPrices.push(avgPrice);
        regularPrices.push(NaN);
      } else {
        regularPrices.push(avgPrice);
        specialPrices.push(NaN);
      }
    });

    return {
      labels,
      datasets: [
        {
          data: regularPrices,
          color: (opacity = 1) => `rgba(71, 117, 234, ${opacity})`, // Blau
          strokeWidth: 2,
        },
        ...(showSpecialOffers
          ? [{
              data: specialPrices,
              color: (opacity = 1) => `rgba(249, 115, 22, ${opacity})`, // Orange
              strokeWidth: 2,
              strokeDashArray: [5, 5], // Gestrichelte Linie für Sonderangebote
            }]
          : []),
      ],
      legend: ['Regulärer Preis', 'Sonderangebot'],
    };
  }, [history.prices, days, showSpecialOffers]);

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 2,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: showDots ? '4' : '0',
      strokeWidth: '2',
    },
    propsForBackgroundLines: {
      strokeDasharray: showGrid ? '' : 'none',
    },
  };

  const screenWidth = Dimensions.get('window').width;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Preisentwicklung</Text>
        <Text style={styles.subtitle}>
          Zuverlässigkeit: {history.reliability}%
        </Text>
      </View>

      <LineChart
        data={chartData}
        width={screenWidth - 32}
        height={height}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
        withVerticalLabels
        withHorizontalLabels
        withVerticalLines={showGrid}
        withHorizontalLines={showGrid}
        withInnerLines={showGrid}
        withDots={showDots}
        fromZero
      />

      {showLegend && (
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.regularDot]} />
            <Text style={styles.legendText}>Regulärer Preis</Text>
          </View>
          {showSpecialOffers && (
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.specialDot]} />
              <Text style={styles.legendText}>Sonderangebot</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Durchschnitt</Text>
          <Text style={styles.statValue}>
            {history.averagePrice.toFixed(2)} €
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Minimum</Text>
          <Text style={styles.statValue}>
            {history.minPrice.toFixed(2)} €
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Maximum</Text>
          <Text style={styles.statValue}>
            {history.maxPrice.toFixed(2)} €
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  regularDot: {
    backgroundColor: 'rgb(71, 117, 234)',
  },
  specialDot: {
    backgroundColor: 'rgb(249, 115, 22)',
  },
  legendText: {
    fontSize: 14,
    color: '#4b5563',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
});