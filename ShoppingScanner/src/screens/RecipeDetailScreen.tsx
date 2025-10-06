import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Recipe } from '../services/recipeService';
import { useTheme } from '../hooks/useTheme';

interface RecipeDetailScreenProps {
  route: {
    params: {
      recipe: Recipe;
    };
  };
}

export const RecipeDetailScreen: React.FC<RecipeDetailScreenProps> = ({ route }) => {
  const { recipe } = route.params;
  const { theme } = useTheme();

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>{recipe.name}</Text>
        <Text style={[styles.description, { color: theme.textSecondary }]}>
          {recipe.description}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Zutaten</Text>
        {recipe.ingredients.map((ingredient, index) => (
          <View key={index} style={styles.ingredientRow}>
            <Text style={[styles.ingredientAmount, { color: theme.text }]}>
              {ingredient.amount} {ingredient.unit}
            </Text>
            <Text style={[styles.ingredientName, { color: theme.text }]}>
              {ingredient.name}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Zubereitung</Text>
        {recipe.instructions.map((step, index) => (
          <View key={index} style={styles.instructionStep}>
            <Text style={[styles.stepNumber, { color: theme.primary }]}>
              {index + 1}.
            </Text>
            <Text style={[styles.stepText, { color: theme.text }]}>{step}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Nährwerte pro Portion</Text>
        <View style={styles.nutritionGrid}>
          <View style={styles.nutritionItem}>
            <Text style={[styles.nutritionValue, { color: theme.text }]}>
              {Math.round(recipe.nutrition.calories)} kcal
            </Text>
            <Text style={[styles.nutritionLabel, { color: theme.textSecondary }]}>
              Kalorien
            </Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={[styles.nutritionValue, { color: theme.text }]}>
              {recipe.nutrition.protein}g
            </Text>
            <Text style={[styles.nutritionLabel, { color: theme.textSecondary }]}>
              Protein
            </Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={[styles.nutritionValue, { color: theme.text }]}>
              {recipe.nutrition.carbs}g
            </Text>
            <Text style={[styles.nutritionLabel, { color: theme.textSecondary }]}>
              Kohlenhydrate
            </Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={[styles.nutritionValue, { color: theme.text }]}>
              {recipe.nutrition.fat}g
            </Text>
            <Text style={[styles.nutritionLabel, { color: theme.textSecondary }]}>
              Fett
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    marginBottom: 16,
  },
  section: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  ingredientRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  ingredientAmount: {
    width: 80,
    fontSize: 16,
  },
  ingredientName: {
    flex: 1,
    fontSize: 16,
  },
  instructionStep: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    fontSize: 16,
    fontWeight: '600',
  },
  stepText: {
    flex: 1,
    fontSize: 16,
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  nutritionItem: {
    alignItems: 'center',
    minWidth: '25%',
    marginBottom: 16,
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 14,
  },
});