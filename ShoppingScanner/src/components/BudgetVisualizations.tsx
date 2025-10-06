import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, useTheme, Surface } from 'react-native-paper';
import { LineChart, ProgressChart } from 'react-native-chart-kit';
import { CategoryAnalysis } from '../services/categoryBudget';

interface BudgetProgressProps {
  analysis: CategoryAnalysis;
}

export const BudgetProgress: React.FC<BudgetProgressProps> = ({ analysis }) => {
  const theme = useTheme();
  const progress = Math.min(analysis.percentage / 100, 1);

  return (
    <Surface style={styles.container}>
      <Text style={styles.categoryTitle}>{analysis.category}</Text>
      <View style={styles.progressContainer}>
        <ProgressChart
          data={{
            labels: ["Ausgegeben"],
            data: [progress]
          }}
          width={Dimensions.get("window").width - 64}
          height={120}
          strokeWidth={16}
          radius={32}
          chartConfig={{
            backgroundColor: theme.colors.surface,
            backgroundGradientFrom: theme.colors.surface,
            backgroundGradientTo: theme.colors.surface,
            color: (opacity = 1) => 
              progress > 1 
                ? theme.colors.error
                : progress > 0.8 
                  ? '#FFA000' // Orange als Warnfarbe 
                  : theme.colors.primary,
          }}
          hideLegend
        />
      </View>
      <View style={styles.detailsContainer}>
        <View style={styles.detail}>
          <Text>Budget:</Text>
          <Text style={styles.amount}>€{analysis.budget.toFixed(2)}</Text>
        </View>
        <View style={styles.detail}>
          <Text>Ausgegeben:</Text>
          <Text style={styles.amount}>€{analysis.spent.toFixed(2)}</Text>
        </View>
        <View style={styles.detail}>
          <Text>Verbleibend:</Text>
          <Text 
            style={[
              styles.amount,
              { color: analysis.remaining < 0 ? theme.colors.error : '#4CAF50' }
            ]}
          >
            €{analysis.remaining.toFixed(2)}
          </Text>
        </View>
      </View>
    </Surface>
  );
};

interface BudgetChartProps {
  analyses: CategoryAnalysis[];
}

export const BudgetChart: React.FC<BudgetChartProps> = ({ analyses }) => {
  const theme = useTheme();
  
  const chartData = {
    labels: analyses.map(a => a.category),
    datasets: [
      {
        data: analyses.map(a => a.spent),
        color: (opacity = 1) => theme.colors.primary,
        strokeWidth: 2
      },
      {
        data: analyses.map(a => a.budget),
        color: (opacity = 1) => `${theme.colors.secondary}88`,
        strokeWidth: 2
      }
    ]
  };

  return (
    <Surface style={styles.chartContainer}>
      <Text style={styles.chartTitle}>Ausgaben pro Kategorie</Text>
      <LineChart
        data={chartData}
        width={Dimensions.get("window").width - 32}
        height={220}
        chartConfig={{
          backgroundColor: theme.colors.surface,
          backgroundGradientFrom: theme.colors.surface,
          backgroundGradientTo: theme.colors.surface,
          decimalPlaces: 2,
          color: (opacity = 1) => theme.colors.onSurface,
          labelColor: (opacity = 1) => theme.colors.onSurface,
          style: {
            borderRadius: 16
          },
          propsForDots: {
            r: "6",
            strokeWidth: "2",
            stroke: theme.colors.surface
          }
        }}
        bezier
        style={styles.chart}
      />
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.colors.primary }]} />
          <Text>Ausgaben</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.colors.secondary }]} />
          <Text>Budget</Text>
        </View>
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    margin: 8,
    borderRadius: 8,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  progressContainer: {
    alignItems: 'center',
  },
  detailsContainer: {
    marginTop: 16,
  },
  detail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  amount: {
    fontWeight: 'bold',
  },
  chartContainer: {
    padding: 16,
    margin: 8,
    borderRadius: 8,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4,
  },
});