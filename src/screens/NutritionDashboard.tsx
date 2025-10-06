import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Text, Alert } from 'react-native';
import { NutritionChart } from '../components/NutritionChart';
import { nutritionAIService } from '../services/nutritionAI.service';
import { nutritionTrackingService } from '../services/nutritionTracking.service';
import { Theme } from '../theme';
import { AnalysisResult, NutritionInsight } from '../types/nutrition';
import { SeasonalOverview } from '../components/SeasonalFood';
import { SeasonalFood, SeasonalTip } from '../types/seasonal';
import { SeasonalFoodDetail } from './SeasonalFoodDetail';

interface NutritionDashboardProps {
  profileId: string;
}

export const NutritionDashboard: React.FC<NutritionDashboardProps> = ({ profileId }) => {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFood, setSelectedFood] = useState<SeasonalFood | null>(null);

  useEffect(() => {
    loadAnalysis();
  }, [profileId]);

  const handleFoodPress = (food: SeasonalFood) => {
    setSelectedFood(food);
  };

  const handleTipPress = (tip: SeasonalTip) => {
    Alert.alert(
      tip.title,
      tip.description
    );
  };

  const loadAnalysis = async () => {
    try {
      setLoading(true);
      const result = await nutritionAIService.analyzeNutrition(profileId);
      setAnalysis(result);
      setError(null);
    } catch (err) {
      setError('Fehler beim Laden der Analyse');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderTrendChart = () => {
    if (!analysis?.insights) return null;

    const trendInsights = analysis.insights.filter(i => i.type === 'trend');
    if (trendInsights.length === 0) return null;

    const chartData = {
      labels: trendInsights[0].data.context.dates || [],
      datasets: [{
        data: trendInsights[0].data.context.values || [],
        color: () => Theme.colors.chart.primary,
        strokeWidth: 2,
      }],
    };

    return (
      <NutritionChart
        type="line"
        data={chartData}
        title="Ernährungstrend"
        yAxisSuffix={trendInsights[0].data.metric === 'calories' ? ' kcal' : 'g'}
      />
    );
  };

  const renderMacroDistribution = () => {
    if (!analysis?.patterns) return null;

    const nutritionPattern = analysis.patterns.find(p => p.type === 'nutrition');
    if (!nutritionPattern) return null;

    const data = {
      labels: ['Protein', 'Kohlenhydrate', 'Fett'],
      datasets: [{
        data: nutritionPattern.supportingData.macroDistribution || [0, 0, 0],
        color: (opacity = 1) => Theme.colors.chart.primary,
      }],
    };

    return (
      <NutritionChart
        type="pie"
        data={data}
        title="Makronährstoffverteilung"
      />
    );
  };

  const renderWeeklyProgress = () => {
    if (!analysis?.predictions) return null;

    const weeklyData = {
      labels: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],
      datasets: [{
        data: analysis.predictions.map(p => p.predictedValue),
        color: () => Theme.colors.chart.secondary,
      }],
    };

    return (
      <NutritionChart
        type="bar"
        data={weeklyData}
        title="Wöchentlicher Fortschritt"
      />
    );
  };

  const renderInsights = () => {
    if (!analysis?.insights) return null;

    return (
      <View style={styles.insightsContainer}>
        <Text style={styles.sectionTitle}>Erkenntnisse</Text>
        {analysis.insights.map((insight, index) => (
          <InsightCard key={insight.id || index} insight={insight} />
        ))}
      </View>
    );
  };

  const renderCorrelations = () => {
    if (!analysis?.correlations) return null;

    return (
      <View style={styles.correlationsContainer}>
        <Text style={styles.sectionTitle}>Zusammenhänge</Text>
        {analysis.correlations.map((correlation, index) => (
          <View key={index} style={styles.correlationItem}>
            <Text style={styles.correlationText}>
              {correlation.factor1} ↔ {correlation.factor2}
            </Text>
            <Text style={styles.correlationStrength}>
              {(correlation.strength * 100).toFixed(0)}% {correlation.direction === 'positive' ? '↑' : '↓'}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Laden...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {renderTrendChart()}
      {renderMacroDistribution()}
      {renderWeeklyProgress()}
      {renderInsights()}
      {renderCorrelations()}
    </ScrollView>
  );
};

interface InsightCardProps {
  insight: NutritionInsight;
}

const InsightCard: React.FC<InsightCardProps> = ({ insight }) => {
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'pattern': return '🔄';
      case 'correlation': return '🔗';
      case 'prediction': return '🎯';
      case 'anomaly': return '⚠️';
      case 'trend': return '📈';
      default: return '💡';
    }
  };

  return (
    <View style={styles.insightCard}>
      <Text style={styles.insightIcon}>{getInsightIcon(insight.type)}</Text>
      <View style={styles.insightContent}>
        <Text style={styles.insightDescription}>{insight.description}</Text>
        <Text style={styles.insightMeta}>
          Konfidenz: {(insight.confidence * 100).toFixed(0)}%
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    padding: Theme.spacing.md,
  },
  sectionTitle: {
    ...Theme.typography.h2,
    marginVertical: Theme.spacing.md,
  },
  insightsContainer: {
    marginTop: Theme.spacing.lg,
  },
  insightCard: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.md,
    borderRadius: Theme.shape.borderRadius.md,
    marginBottom: Theme.spacing.sm,
    ...Theme.shadows.sm,
  },
  insightIcon: {
    fontSize: 24,
    marginRight: Theme.spacing.sm,
  },
  insightContent: {
    flex: 1,
  },
  insightDescription: {
    ...Theme.typography.body1,
    color: Theme.colors.text,
  },
  insightMeta: {
    ...Theme.typography.caption,
    color: Theme.colors.textSecondary,
    marginTop: Theme.spacing.xs,
  },
  correlationsContainer: {
    marginTop: Theme.spacing.lg,
    marginBottom: Theme.spacing.xl,
  },
  correlationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Theme.spacing.md,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.shape.borderRadius.md,
    marginBottom: Theme.spacing.sm,
  },
  seasonalContainer: {
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.lg,
    padding: Theme.spacing.md,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.shape.borderRadius.lg,
    ...Theme.shadows.md,
    ...Theme.shadows.sm,
  },
  correlationText: {
    ...Theme.typography.body1,
    color: Theme.colors.text,
  },
  correlationStrength: {
    ...Theme.typography.body2,
    color: Theme.colors.textSecondary,
  },
  errorText: {
    ...Theme.typography.body1,
    color: Theme.colors.error,
    textAlign: 'center',
  },
});