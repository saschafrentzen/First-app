import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, useTheme, Surface } from 'react-native-paper';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { DailyNutrition, NutritionTrend } from '../services/nutrition';

interface NutritionSummaryProps {
  dailyNutrition: DailyNutrition;
}

export const NutritionSummary: React.FC<NutritionSummaryProps> = ({ dailyNutrition }) => {
  const theme = useTheme();

  return (
    <Surface style={styles.container}>
      <Text style={styles.title}>Tagesübersicht</Text>
      <View style={styles.nutrientGrid}>
        <View style={styles.nutrientItem}>
          <Text style={styles.nutrientLabel}>Kalorien</Text>
          <Text style={styles.nutrientValue}>{Math.round(dailyNutrition.totalEnergy)} kcal</Text>
        </View>
        <View style={styles.nutrientItem}>
          <Text style={styles.nutrientLabel}>Fett</Text>
          <Text style={styles.nutrientValue}>{dailyNutrition.totalFat.toFixed(1)}g</Text>
        </View>
        <View style={styles.nutrientItem}>
          <Text style={styles.nutrientLabel}>Kohlenhydrate</Text>
          <Text style={styles.nutrientValue}>{dailyNutrition.totalCarbohydrates.toFixed(1)}g</Text>
        </View>
        <View style={styles.nutrientItem}>
          <Text style={styles.nutrientLabel}>Proteine</Text>
          <Text style={styles.nutrientValue}>{dailyNutrition.totalProteins.toFixed(1)}g</Text>
        </View>
      </View>
      
      <BarChart
        data={{
          labels: ['Fett', 'KH', 'Protein'],
          datasets: [{
            data: [
              dailyNutrition.totalFat,
              dailyNutrition.totalCarbohydrates,
              dailyNutrition.totalProteins
            ]
          }]
        }}
        width={Dimensions.get('window').width - 64}
        height={200}
        yAxisLabel=""
        yAxisSuffix="g"
        chartConfig={{
          backgroundColor: theme.colors.surface,
          backgroundGradientFrom: theme.colors.surface,
          backgroundGradientTo: theme.colors.surface,
          decimalPlaces: 1,
          color: (opacity = 1) => theme.colors.primary,
          style: {
            borderRadius: 16
          },
        }}
        style={styles.chart}
      />
    </Surface>
  );
};

interface NutritionTrendChartProps {
  trend: NutritionTrend;
}

export const NutritionTrendChart: React.FC<NutritionTrendChartProps> = ({ trend }) => {
  const theme = useTheme();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getDate()}.${date.getMonth() + 1}`;
  };

  return (
    <Surface style={styles.container}>
      <Text style={styles.title}>
        {trend.period === 'week' ? '7-Tage-Trend' : '30-Tage-Trend'}
      </Text>
      
      <LineChart
        data={{
          labels: trend.data.map(d => formatDate(d.date)),
          datasets: [
            {
              data: trend.data.map(d => d.energy),
              color: (opacity = 1) => theme.colors.primary,
              strokeWidth: 2
            }
          ]
        }}
        width={Dimensions.get('window').width - 32}
        height={220}
        chartConfig={{
          backgroundColor: theme.colors.surface,
          backgroundGradientFrom: theme.colors.surface,
          backgroundGradientTo: theme.colors.surface,
          decimalPlaces: 0,
          color: (opacity = 1) => theme.colors.onSurface,
          labelColor: (opacity = 1) => theme.colors.onSurface,
          style: {
            borderRadius: 16
          },
          propsForDots: {
            r: "4",
            strokeWidth: "2",
            stroke: theme.colors.surface
          }
        }}
        bezier
        style={styles.chart}
      />

      <View style={styles.averages}>
        <Text style={styles.averageTitle}>Durchschnittswerte:</Text>
        <View style={styles.averageGrid}>
          <View style={styles.averageItem}>
            <Text style={styles.averageLabel}>Kalorien</Text>
            <Text style={styles.averageValue}>
              {Math.round(trend.averageEnergy)} kcal
            </Text>
          </View>
          <View style={styles.averageItem}>
            <Text style={styles.averageLabel}>Fett</Text>
            <Text style={styles.averageValue}>
              {trend.averageFat.toFixed(1)}g
            </Text>
          </View>
          <View style={styles.averageItem}>
            <Text style={styles.averageLabel}>KH</Text>
            <Text style={styles.averageValue}>
              {trend.averageCarbohydrates.toFixed(1)}g
            </Text>
          </View>
          <View style={styles.averageItem}>
            <Text style={styles.averageLabel}>Protein</Text>
            <Text style={styles.averageValue}>
              {trend.averageProteins.toFixed(1)}g
            </Text>
          </View>
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  nutrientGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  nutrientItem: {
    width: '48%',
    padding: 8,
    marginBottom: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  nutrientLabel: {
    fontSize: 14,
    opacity: 0.8,
  },
  nutrientValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  averages: {
    marginTop: 16,
  },
  averageTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  averageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  averageItem: {
    width: '48%',
    padding: 8,
    marginBottom: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  averageLabel: {
    fontSize: 14,
    opacity: 0.8,
  },
  averageValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
});