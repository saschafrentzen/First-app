import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { Theme } from '../theme';

const screenWidth = Dimensions.get('window').width;

interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
    color?: (opacity: number) => string;
    strokeWidth?: number;
  }[];
}

interface NutritionChartProps {
  type: 'line' | 'bar' | 'pie';
  data: ChartData;
  height?: number;
  title?: string;
  yAxisSuffix?: string;
  formatYLabel?: (value: string) => string;
  formatXLabel?: (value: string) => string;
  showLegend?: boolean;
}

const defaultChartConfig = {
  backgroundColor: Theme.colors.background,
  backgroundGradientFrom: Theme.colors.background,
  backgroundGradientTo: Theme.colors.background,
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(${Theme.colors.primary}, ${opacity})`,
  labelColor: () => Theme.colors.text,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '6',
    strokeWidth: '2',
    stroke: Theme.colors.primary,
  },
};

export const NutritionChart: React.FC<NutritionChartProps> = ({
  type,
  data,
  height = 220,
  title,
  yAxisSuffix = '',
  formatYLabel,
  formatXLabel,
  showLegend = true,
}) => {
  const chartConfig = {
    ...defaultChartConfig,
    formatYLabel: formatYLabel || ((value) => value + yAxisSuffix),
    formatXLabel: formatXLabel || ((value) => value),
  };

  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <LineChart
            data={data}
            width={screenWidth - 32}
            height={height}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            withInnerLines={false}
            withOuterLines={true}
            withDots={true}
            withShadow={false}
            yAxisSuffix={yAxisSuffix}
          />
        );
      case 'bar':
        return (
          <BarChart
            data={data}
            width={screenWidth - 32}
            height={height}
            chartConfig={chartConfig}
            style={styles.chart}
            withInnerLines={false}
            showValuesOnTopOfBars={true}
            flatColor={true}
            yAxisSuffix={yAxisSuffix}
            yAxisLabel=""
          />
        );
      case 'pie':
        return (
          <PieChart
            data={data.datasets[0].data.map((value, index) => ({
              name: data.labels[index],
              value,
              color: data.datasets[0].color?.(1) || defaultChartConfig.color(1),
              legendFontColor: Theme.colors.text,
              legendFontSize: 12,
            }))}
            width={screenWidth - 32}
            height={height}
            chartConfig={chartConfig}
            accessor="value"
            backgroundColor="transparent"
            paddingLeft="0"
            absolute
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      {renderChart()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    padding: 16,
    backgroundColor: Theme.colors.surface,
    borderRadius: 16,
    elevation: 2,
    shadowColor: Theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginBottom: 8,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
});