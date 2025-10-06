import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { LineChart, Grid, XAxis, YAxis } from 'react-native-svg-charts';
import * as shape from 'd3-shape';
import { NutritionGoal, NutritionProgress } from '../types/nutritionGoal';
import { nutritionGoalService } from '../services/nutritionGoalService';
import { useTheme } from '../hooks/useTheme';

interface NutritionProgressTrackingProps {
  goal: NutritionGoal;
}

interface ProgressStatus {
  percentage: number;
  status: 'success' | 'warning' | 'error';
}

interface ChartData {
  date: Date;
  value: number;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  header: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  timeRangeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  timeRangeButtonActive: {
    backgroundColor: '#007AFF',
  },
  timeRangeText: {
    color: '#666',
  },
  timeRangeTextActive: {
    color: '#fff',
  },
  chartContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  progressStatus: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  chart: {
    height: 300,
    flexDirection: 'row',
    marginTop: 16,
  },
});

interface ProgressStatus {
  percentage: number;
  status: 'success' | 'warning' | 'error';
}

export const NutritionProgressTracking: React.FC<NutritionProgressTrackingProps> = ({ goal }) => {
  const [progressData, setProgressData] = useState<NutritionProgress[]>([]);
  const [progressStatus, setProgressStatus] = useState<ProgressStatus>({
    percentage: 0,
    status: 'error'
  });
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    loadProgress();
  }, [goal.id, timeRange]);

  const loadProgress = async () => {
    try {
      const endDate = new Date();
      let startDate = new Date();
      
      switch (timeRange) {
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      const data = await nutritionGoalService.getProgressForGoal(
        goal.id,
        startDate.toISOString(),
        endDate.toISOString()
      );
      setProgressData(data);
      updateProgressStatus(data);
    } catch (error) {
      Alert.alert('Fehler', 'Fortschrittsdaten konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  };

  const updateProgressStatus = (data: NutritionProgress[]) => {
    if (data.length === 0) {
      setProgressStatus({ percentage: 0, status: 'error' });
      return;
    }

    const latestProgress = data[data.length - 1];
    const percentage = (latestProgress.value / goal.targetValue) * 100;
    
    let status: 'success' | 'warning' | 'error';
    if (percentage >= 100) {
      status = 'success';
    } else if (percentage >= 80) {
      status = 'warning';
    } else {
      status = 'error';
    }

    setProgressStatus({ percentage, status });
  };

  const formatDate = (date: Date): string => {
    switch (timeRange) {
      case 'week':
        return date.toLocaleDateString('de-DE', { weekday: 'short' });
      case 'month':
        return date.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' });
      case 'year':
        return date.toLocaleDateString('de-DE', { month: 'short' });
      default:
        return date.toLocaleDateString('de-DE');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Lade Fortschrittsdaten...</Text>
      </View>
    );
  }

  if (progressData.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Noch keine Fortschrittsdaten vorhanden</Text>
      </View>
    );
  }

  const data = progressData.map(p => ({
    date: new Date(p.date),
    value: p.value
  }));

  const xAxisData = data.map(item => item.date);
  const yAxisData = data.map(item => item.value);
  const maxValue = Math.max(...yAxisData, goal.targetValue);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{goal.name}</Text>
        <View style={styles.timeRangeContainer}>
          {['week', 'month', 'year'].map((range) => (
            <TouchableOpacity
              key={range}
              style={[
                styles.timeRangeButton,
                timeRange === range && styles.timeRangeButtonActive
              ]}
              onPress={() => setTimeRange(range as 'week' | 'month' | 'year')}
            >
              <Text style={[
                styles.timeRangeText,
                timeRange === range && styles.timeRangeTextActive
              ]}>
                {range === 'week' ? 'Woche' : range === 'month' ? 'Monat' : 'Jahr'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.chartContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressBarFill,
              {
                backgroundColor: 
                  progressStatus.status === 'success' ? theme.success :
                  progressStatus.status === 'warning' ? theme.warning :
                  theme.error,
                width: `${progressStatus.percentage}%`,
              }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {progressStatus.percentage.toFixed(1)}%
        </Text>
        <Text style={styles.progressStatus}>
          {progressStatus.status === 'success' ? 'Ziel erreicht! 🎉' :
           progressStatus.status === 'warning' ? 'Fast geschafft! 💪' :
           'Noch ein Stück zum Ziel! 🎯'}
        </Text>

        <View style={styles.chart}>
          <YAxis
            data={yAxisData}
            contentInset={{ top: 20, bottom: 20 }}
            svg={{ fill: theme.text }}
            numberOfTicks={5}
            formatLabel={(value) => `${value}${goal.unit}`}
          />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <LineChart
              style={{ flex: 1 }}
              data={yAxisData}
              svg={{ stroke: theme.primary }}
              contentInset={{ top: 20, bottom: 20 }}
              curve={shape.curveNatural}
            >
              <Grid />
            </LineChart>
            <XAxis
              style={{ marginTop: 10 }}
              data={xAxisData}
              contentInset={{ left: 10, right: 10 }}
              svg={{ fill: theme.text }}
              formatLabel={(index) => formatDate(xAxisData[index])}
            />
          </View>
        </View>
      </View>
    </ScrollView>
  );

  };