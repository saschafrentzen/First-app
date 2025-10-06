import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SeasonalFood, SeasonalTip, Month } from '../types/seasonal';
import { Theme } from '../theme';
import { seasonalFoodService } from '../services/seasonalFood.service';

interface SeasonalFoodCardProps {
  food: SeasonalFood;
  onPress?: () => void;
}

export const SeasonalFoodCard: React.FC<SeasonalFoodCardProps> = ({ food, onPress }) => {
  return (
    <TouchableOpacity 
      style={styles.foodCard}
      onPress={onPress}
    >
      {food.image && (
        <Image
          source={{ uri: food.image }}
          style={styles.foodImage}
        />
      )}
      <View style={styles.foodInfo}>
        <Text style={styles.foodName}>{food.name}</Text>
        <Text style={styles.foodCategory}>
          {food.category.charAt(0).toUpperCase() + food.category.slice(1)}
        </Text>
        {food.nutritionalHighlights.slice(0, 2).map((highlight, index) => (
          <Text key={index} style={styles.highlight}>
            • {highlight.nutrient}: {highlight.quality}
          </Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

interface SeasonalTipCardProps {
  tip: SeasonalTip;
  onPress?: () => void;
}

export const SeasonalTipCard: React.FC<SeasonalTipCardProps> = ({ tip, onPress }) => {
  return (
    <TouchableOpacity 
      style={[
        styles.tipCard,
        tip.importance === 'high' ? styles.importanceHigh :
        tip.importance === 'medium' ? styles.importanceMedium :
        styles.importanceLow
      ]}
      onPress={onPress}
    >
      <Text style={styles.tipTitle}>{tip.title}</Text>
      <Text style={styles.tipDescription} numberOfLines={3}>
        {tip.description}
      </Text>
      <Text style={styles.tipCategory}>
        {tip.category.charAt(0).toUpperCase() + tip.category.slice(1)}
      </Text>
    </TouchableOpacity>
  );
};

interface SeasonalOverviewProps {
  month?: Month;
  onFoodPress?: (food: SeasonalFood) => void;
  onTipPress?: (tip: SeasonalTip) => void;
}

export const SeasonalOverview: React.FC<SeasonalOverviewProps> = ({ 
  month = (new Date().getMonth() + 1) as Month,
  onFoodPress,
  onTipPress 
}) => {
  const [foods, setFoods] = React.useState<SeasonalFood[]>([]);
  const [tips, setTips] = React.useState<SeasonalTip[]>([]);

  React.useEffect(() => {
    loadSeasonalData();
  }, [month]);

  const loadSeasonalData = async () => {
    try {
      const seasonalFoods = await seasonalFoodService.getSeasonalFoods(month);
      const seasonalTips = await seasonalFoodService.getCurrentTips(month);
      setFoods(seasonalFoods);
      setTips(seasonalTips);
    } catch (error) {
      console.error('Fehler beim Laden der saisonalen Daten:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Saisonale Lebensmittel</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {foods.map(food => (
          <SeasonalFoodCard
            key={food.id}
            food={food}
            onPress={() => onFoodPress?.(food)}
          />
        ))}
      </ScrollView>

      <Text style={styles.sectionTitle}>Saisonale Tipps</Text>
      {tips.map(tip => (
        <SeasonalTipCard
          key={tip.id}
          tip={tip}
          onPress={() => onTipPress?.(tip)}
        />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Theme.spacing.md,
  },
  sectionTitle: {
    ...Theme.typography.h2,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.md,
    marginTop: Theme.spacing.lg,
  },
  foodCard: {
    width: 200,
    marginRight: Theme.spacing.md,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.shape.borderRadius.md,
    overflow: 'hidden',
    ...Theme.shadows.md,
  },
  foodImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  foodInfo: {
    padding: Theme.spacing.sm,
  },
  foodName: {
    ...Theme.typography.h3,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.xs,
  },
  foodCategory: {
    ...Theme.typography.caption,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.xs,
  },
  highlight: {
    ...Theme.typography.caption,
    color: Theme.colors.textSecondary,
  },
  tipCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.shape.borderRadius.md,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    ...Theme.shadows.sm,
  },
  tipTitle: {
    ...Theme.typography.h3,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.xs,
  },
  tipDescription: {
    ...Theme.typography.body2,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.sm,
  },
  tipCategory: {
    ...Theme.typography.caption,
    color: Theme.colors.textSecondary,
  },
  importanceHigh: {
    borderLeftWidth: 4,
    borderLeftColor: Theme.colors.error,
  },
  importanceMedium: {
    borderLeftWidth: 4,
    borderLeftColor: Theme.colors.warning,
  },
  importanceLow: {
    borderLeftWidth: 4,
    borderLeftColor: Theme.colors.success,
  },
});