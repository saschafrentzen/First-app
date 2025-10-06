import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Theme } from '../theme';
import { SeasonalFood, Month, NutritionalQuality } from '../types/seasonal';
import { NutritionInfo } from '../types/nutrition';

interface SeasonalFoodDetailProps {
  food: SeasonalFood;
  onClose: () => void;
}

export const SeasonalFoodDetail: React.FC<SeasonalFoodDetailProps> = ({
  food,
  onClose,
}) => {
  const getSeasonText = (season: SeasonalFood['season']): string => {
    const monthNames = [
      'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
      'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
    ];
    
    const start = monthNames[season.start - 1];
    const end = monthNames[season.end - 1];
    const peak = season.peak.map(m => monthNames[m - 1]).join(', ');
    
    return `Saison: ${start} bis ${end}\nHauptsaison: ${peak}`;
  };

  const getQualityColor = (quality: NutritionalQuality): string => {
    switch (quality) {
      case 'high':
        return Theme.colors.success;
      case 'medium':
        return Theme.colors.warning;
      case 'low':
        return Theme.colors.error;
      default:
        return Theme.colors.text;
    }
  };

  const renderStorageMethod = (method: 'room' | 'refrigerator' | 'freezer') => {
    const methods = {
      room: '🏠 Bei Raumtemperatur',
      refrigerator: '❄️ Im Kühlschrank',
      freezer: '🧊 Im Gefrierfrierschrank'
    };

    return (
      <View style={styles.storageMethod}>
        <Text style={styles.storageMethodText}>
          {methods[method]}
        </Text>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {food.image && (
        <Image
          source={{ uri: food.image }}
          style={styles.image}
          resizeMode="cover"
        />
      )}

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{food.name}</Text>
          <Text style={styles.category}>
            {food.category.charAt(0).toUpperCase() + food.category.slice(1)}
          </Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Saison</Text>
        <Text style={styles.seasonText}>
          {getSeasonText(food.season)}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nährwerte</Text>
        <View style={styles.nutritionGrid}>
          {food.nutritionalHighlights.map((highlight, index) => (
            <View key={index} style={styles.nutritionItem}>
              <Text style={[
                styles.nutritionValue,
                { color: getQualityColor(highlight.quality) }
              ]}>
                {highlight.nutrient}
              </Text>
              <Text style={styles.nutritionDescription}>
                {highlight.description}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lagerung</Text>
        <View style={styles.storageMethods}>
          {food.storageInfo.methods.map((method, index) => (
            <React.Fragment key={method}>
              {renderStorageMethod(method)}
            </React.Fragment>
          ))}
        </View>
        <Text style={styles.storageDuration}>
          Haltbarkeit: {food.storageInfo.maxDuration.value} {
            food.storageInfo.maxDuration.unit === 'days' ? 'Tage' :
            food.storageInfo.maxDuration.unit === 'weeks' ? 'Wochen' :
            'Monate'
          }
        </Text>
        {food.storageInfo.tips.map((tip, index) => (
          <Text key={index} style={styles.storageTip}>• {tip}</Text>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Zubereitung</Text>
        <View style={styles.preparationMethods}>
          {food.preparation.methods.map((method, index) => (
            <View key={index} style={styles.preparationMethod}>
              <Text style={styles.preparationMethodText}>{method}</Text>
            </View>
          ))}
        </View>
        {food.preparation.tips.map((tip, index) => (
          <Text key={index} style={styles.preparationTip}>• {tip}</Text>
        ))}
      </View>

      {food.alternatives.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alternativen</Text>
          <View style={styles.alternativesContainer}>
            {food.alternatives.map((alt, index) => (
              <TouchableOpacity
                key={index}
                style={styles.alternativeItem}
              >
                <Text style={styles.alternativeText}>{alt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  image: {
    width: '100%',
    height: 200,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: Theme.spacing.md,
    backgroundColor: Theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.textSecondary,
  },
  title: {
    ...Theme.typography.h1,
    color: Theme.colors.text,
  },
  category: {
    ...Theme.typography.body2,
    color: Theme.colors.textSecondary,
    marginTop: Theme.spacing.xs,
  },
  closeButton: {
    padding: Theme.spacing.sm,
  },
  closeButtonText: {
    ...Theme.typography.h2,
    color: Theme.colors.textSecondary,
  },
  section: {
    padding: Theme.spacing.md,
    backgroundColor: Theme.colors.surface,
    marginBottom: Theme.spacing.sm,
  },
  sectionTitle: {
    ...Theme.typography.h2,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.md,
  },
  seasonText: {
    ...Theme.typography.body1,
    color: Theme.colors.text,
    lineHeight: 24,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Theme.spacing.xs,
  },
  nutritionItem: {
    width: '50%',
    padding: Theme.spacing.xs,
  },
  nutritionValue: {
    ...Theme.typography.h3,
    marginBottom: Theme.spacing.xs,
  },
  nutritionDescription: {
    ...Theme.typography.body2,
    color: Theme.colors.textSecondary,
  },
  storageMethods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Theme.spacing.md,
  },
  storageMethod: {
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.shape.borderRadius.sm,
    padding: Theme.spacing.sm,
    marginRight: Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
  },
  storageMethodText: {
    ...Theme.typography.body2,
    color: Theme.colors.text,
  },
  storageDuration: {
    ...Theme.typography.body1,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.md,
  },
  storageTip: {
    ...Theme.typography.body2,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.xs,
  },
  preparationMethods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Theme.spacing.md,
  },
  preparationMethod: {
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.shape.borderRadius.sm,
    padding: Theme.spacing.sm,
    marginRight: Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
  },
  preparationMethodText: {
    ...Theme.typography.body2,
    color: '#FFFFFF',
  },
  preparationTip: {
    ...Theme.typography.body2,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.xs,
  },
  alternativesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Theme.spacing.xs,
  },
  alternativeItem: {
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.shape.borderRadius.sm,
    padding: Theme.spacing.sm,
    margin: Theme.spacing.xs,
  },
  alternativeText: {
    ...Theme.typography.body2,
    color: Theme.colors.text,
  },
});