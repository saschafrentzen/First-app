import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  useWindowDimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, ProgressBar, Chip, List, Divider, SegmentedButtons } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LineChart } from 'react-native-chart-kit';
import { BudgetCategory, BudgetForecast } from '../types/budget';
import { budgetService } from '../services/budget.service';

type TimeRange = '1M' | '3M' | '6M' | '1Y' | 'ALL';

const BudgetForecastScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [forecasts, setForecasts] = useState<Map<string, BudgetForecast>>(new Map());
  const [historicalData, setHistoricalData] = useState<Map<string, Array<{ period: string; spent: number }>>>(new Map());
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('3M');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const loadedCategories = Array.from(budgetService.getCategories().values());
      setCategories(loadedCategories);

      const forecastMap = new Map();
      const historyMap = new Map();

      for (const category of loadedCategories) {
        const [forecast, history] = await Promise.all([
          budgetService.getForecast(category.id),
          budgetService.getHistoricalSpending(category.id)
        ]);

        if (forecast) {
          forecastMap.set(category.id, forecast);
        }
        if (history) {
          historyMap.set(category.id, history);
        }
      }

      setForecasts(forecastMap);
      setHistoricalData(historyMap);
    } catch (error) {
      console.error('Fehler beim Laden der Prognosen:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getFilteredData = (data: Array<{ period: string; spent: number }>) => {
    if (!data) return [];
    
    const now = new Date();
    const sortedData = [...data].sort((a, b) => 
      new Date(a.period).getTime() - new Date(b.period).getTime()
    );

    switch (selectedTimeRange) {
      case '1M':
        return sortedData.filter(d => {
          const date = new Date(d.period);
          return (now.getTime() - date.getTime()) <= 30 * 24 * 60 * 60 * 1000;
        });
      case '3M':
        return sortedData.filter(d => {
          const date = new Date(d.period);
          return (now.getTime() - date.getTime()) <= 90 * 24 * 60 * 60 * 1000;
        });
      case '6M':
        return sortedData.filter(d => {
          const date = new Date(d.period);
          return (now.getTime() - date.getTime()) <= 180 * 24 * 60 * 60 * 1000;
        });
      case '1Y':
        return sortedData.filter(d => {
          const date = new Date(d.period);
          return (now.getTime() - date.getTime()) <= 365 * 24 * 60 * 60 * 1000;
        });
      case 'ALL':
      default:
        return sortedData;
    }
  };

  const renderTimeRangeSelector = () => {
    const buttons = [
      { label: '1M', value: '1M' },
      { label: '3M', value: '3M' },
      { label: '6M', value: '6M' },
      { label: '1J', value: '1Y' },
      { label: 'Alle', value: 'ALL' }
    ];

    return (
      <View style={styles.timeRangeSelector}>
        <SegmentedButtons
          value={selectedTimeRange}
          onValueChange={value => setSelectedTimeRange(value as TimeRange)}
          buttons={buttons}
          density="small"
        />
      </View>
    );
  };

  const renderHistoryChart = (categoryId: string) => {
    const history = historicalData.get(categoryId);
    if (!history || history.length < 2) return null;

    const filteredData = getFilteredData(history);
    if (filteredData.length < 2) return null;

    // Berechne das Budget-Limit für den Vergleich
    const category = categories.find(c => c.id === categoryId);
    if (!category) return null;

    const labels = filteredData.map(d => {
      const date = new Date(d.period);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });

    const datasets = [
      {
        data: filteredData.map(d => d.spent),
        color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
        strokeWidth: 2
      },
      {
        data: Array(filteredData.length).fill(category.limit),
        color: (opacity = 1) => `rgba(244, 67, 54, ${opacity})`,
        strokeWidth: 2,
        dotted: true
      }
    ];

    const maxValue = Math.max(
      ...filteredData.map(d => d.spent),
      category.limit
    );

    const chartConfig = {
      backgroundGradientFrom: '#ffffff',
      backgroundGradientTo: '#ffffff',
      color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
      strokeWidth: 2,
      decimalPlaces: 0,
      formatYLabel: (value: string) => formatCurrency(parseFloat(value)),
      propsForLabels: {
        fontSize: 10
      },
      propsForVerticalLabels: {
        rotation: 30
      }
    };

    return (
      <View style={styles.chartContainer}>
        {renderTimeRangeSelector()}
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#2196F3' }]} />
            <Text>Ausgaben</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#F44336' }]} />
            <Text>Budget-Limit</Text>
          </View>
        </View>
        <LineChart
          data={{ labels, datasets }}
          width={windowWidth - 64}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          yAxisLabel="€"
          yAxisInterval={1}
          withVerticalLines={false}
          withHorizontalLines={true}
          verticalLabelRotation={30}
          segments={5}
        />
      </View>
    );
  };

  const getTrendIcon = (trend: 'increasing' | 'decreasing' | 'stable') => {
    switch (trend) {
      case 'increasing':
        return { name: 'trending-up', color: '#D32F2F' };
      case 'decreasing':
        return { name: 'trending-down', color: '#4CAF50' };
      default:
        return { name: 'trending-neutral', color: '#FFA000' };
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const renderForecastCard = (category: BudgetCategory) => {
    const forecast = forecasts.get(category.id);
    if (!forecast) return null;

    const trendIcon = getTrendIcon(forecast.trend);
    const isSelected = selectedCategory === category.id;

    return (
      <Card
        key={category.id}
        style={[styles.card, isSelected && styles.selectedCard]}
        onPress={() => setSelectedCategory(isSelected ? null : category.id)}
      >
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.headerLeft}>
              <Text style={styles.categoryName}>{category.name}</Text>
              <Chip
                icon={() => (
                  <Icon name={trendIcon.name} size={16} color={trendIcon.color} />
                )}
                style={[styles.trendChip, { backgroundColor: `${trendIcon.color}15` }]}
                mode="outlined"
              >
                {forecast.trend.charAt(0).toUpperCase() + forecast.trend.slice(1)}
              </Chip>
            </View>
            <View style={styles.headerRight}>
              <Text style={styles.confidence}>{Math.round(forecast.confidence)}% Konfidenz</Text>
            </View>
          </View>

          <View style={styles.forecastInfo}>
            <View style={styles.infoColumn}>
              <Text style={styles.label}>Aktuell</Text>
              <Text style={styles.amount}>{formatCurrency(category.spent)}</Text>
            </View>
            <View style={styles.infoColumn}>
              <Text style={styles.label}>Prognose</Text>
              <Text style={[
                styles.amount,
                { color: forecast.projectedSpend > category.limit ? '#D32F2F' : '#4CAF50' }
              ]}>
                {formatCurrency(forecast.projectedSpend)}
              </Text>
            </View>
            <View style={styles.infoColumn}>
              <Text style={styles.label}>Budget</Text>
              <Text style={styles.amount}>{formatCurrency(category.limit)}</Text>
            </View>
          </View>

          {isSelected && (
            <View style={styles.detailsContainer}>
              <Divider style={styles.divider} />
              
              <Text style={styles.sectionTitle}>Ausgabenverlauf</Text>
              {renderHistoryChart(category.id)}

              <Text style={styles.sectionTitle}>Einflussfaktoren</Text>
              {forecast.factors.map((factor, index) => (
                <View key={index} style={styles.factor}>
                  <Text style={styles.factorName}>{factor.name}</Text>
                  <ProgressBar
                    progress={factor.impact}
                    color={factor.impact > 0.5 ? '#D32F2F' : '#FFA000'}
                    style={styles.factorImpact}
                  />
                </View>
              ))}

              <Text style={styles.sectionTitle}>Empfehlungen</Text>
              {forecast.recommendations.map((recommendation, index) => (
                <List.Item
                  key={index}
                  title={recommendation.message}
                  description={`Mögliche Einsparung: ${formatCurrency(recommendation.potentialSavings)}`}
                  left={props => <List.Icon {...props} icon="lightbulb-outline" />}
                  titleNumberOfLines={2}
                  descriptionStyle={styles.recommendationSavings}
                />
              ))}
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.section}>
          <Text style={styles.pageTitle}>Budget-Prognosen</Text>
          {categories.map(renderForecastCard)}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  section: {
    padding: 16
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16
  },
  card: {
    marginBottom: 16,
    elevation: 4
  },
  selectedCard: {
    borderColor: '#2196F3',
    borderWidth: 2
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16
  },
  headerLeft: {
    flex: 1
  },
  headerRight: {
    alignItems: 'flex-end'
  },
  categoryName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8
  },
  trendChip: {
    alignSelf: 'flex-start'
  },
  confidence: {
    fontSize: 14,
    color: '#757575'
  },
  forecastInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  infoColumn: {
    flex: 1,
    alignItems: 'center'
  },
  label: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4
  },
  amount: {
    fontSize: 16,
    fontWeight: '500'
  },
  detailsContainer: {
    marginTop: 16
  },
  divider: {
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12
  },
  factor: {
    marginBottom: 12
  },
  factorName: {
    fontSize: 14,
    marginBottom: 4
  },
  factorImpact: {
    height: 8,
    borderRadius: 4
  },
  recommendationSavings: {
    color: '#4CAF50'
  },
  chartContainer: {
    marginVertical: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 8,
    elevation: 2
  },
  timeRangeSelector: {
    marginBottom: 16
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4
  },
  chart: {
    marginVertical: 8,
    borderRadius: 8
  }
});

export default BudgetForecastScreen;