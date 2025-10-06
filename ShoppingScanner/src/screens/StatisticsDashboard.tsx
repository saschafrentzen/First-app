import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, Button, Divider, SegmentedButtons } from 'react-native-paper';
import { BudgetProgress, BudgetChart } from '../components/BudgetVisualizations';
import { NutritionSummary, NutritionTrendChart } from '../components/NutritionVisualizations';
import { categoryBudgetService, CategoryAnalysis } from '../services/categoryBudget';
import { nutritionService, DailyNutrition, NutritionTrend } from '../services/nutrition';

export const StatisticsDashboard: React.FC = () => {
  const [budgetAnalyses, setBudgetAnalyses] = useState<CategoryAnalysis[]>([]);
  const [dailyNutrition, setDailyNutrition] = useState<DailyNutrition | null>(null);
  const [nutritionTrend, setNutritionTrend] = useState<NutritionTrend | null>(null);
  const [trendPeriod, setTrendPeriod] = useState<'week' | 'month'>('week');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Budget-Daten laden
      const analyses = await categoryBudgetService.getAllAnalyses();
      setBudgetAnalyses(analyses);

      // Ernährungsdaten laden
      const today = new Date().toISOString().split('T')[0];
      const nutrition = await nutritionService.getDailyNutrition(today);
      setDailyNutrition(nutrition);

      const trend = await nutritionService.getNutritionTrend(trendPeriod);
      setNutritionTrend(trend);
    } catch (err) {
      setError('Fehler beim Laden der Daten');
      console.error('Fehler beim Laden der Statistiken:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [trendPeriod]);

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Lade Statistiken...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.error}>{error}</Text>
        <Button mode="contained" onPress={loadData} style={styles.retryButton}>
          Erneut versuchen
        </Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Kategoriebudgets</Text>
        {budgetAnalyses.map((analysis) => (
          <BudgetProgress key={analysis.category} analysis={analysis} />
        ))}
        {budgetAnalyses.length > 1 && <BudgetChart analyses={budgetAnalyses} />}
      </View>

      <Divider style={styles.divider} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ernährungsanalyse</Text>
        {dailyNutrition && <NutritionSummary dailyNutrition={dailyNutrition} />}
        
        <View style={styles.periodSelector}>
          <SegmentedButtons
            value={trendPeriod}
            onValueChange={(value) => setTrendPeriod(value as 'week' | 'month')}
            buttons={[
              { value: 'week', label: '7 Tage' },
              { value: 'month', label: '30 Tage' },
            ]}
          />
        </View>

        {nutritionTrend && <NutritionTrendChart trend={nutritionTrend} />}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  divider: {
    marginVertical: 16,
  },
  periodSelector: {
    marginVertical: 16,
  },
  error: {
    color: 'red',
    marginBottom: 16,
  },
  retryButton: {
    marginTop: 8,
  },
});