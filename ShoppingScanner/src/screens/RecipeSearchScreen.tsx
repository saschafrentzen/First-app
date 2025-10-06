import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Recipe, RecipeQuery, recipeService } from '../services/recipeService';
import { useTheme } from '../hooks/useTheme';
import { ShoppingListItem } from '../types/shoppingList';
import { shoppingListService } from '../services/shoppingListService';

interface RecipeSearchScreenProps {
  navigation: any;
}

export const RecipeSearchScreen: React.FC<RecipeSearchScreenProps> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [options, setOptions] = useState<RecipeQuery>({
    preferences: [],
    excludedIngredients: [],
    maxPrepTime: undefined,
    difficulty: undefined,
    servings: undefined,
    tags: [],
  });
  const { theme } = useTheme();

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Fehler', 'Bitte gib einen Suchbegriff ein.');
      return;
    }

    setIsLoading(true);
    try {
      const results = await recipeService.searchRecipes(searchQuery, options);
      setRecipes(results);
    } catch (error) {
      Alert.alert('Fehler', 'Die Rezeptsuche ist fehlgeschlagen.');
    } finally {
      setIsLoading(false);
    }
  };

  const addToShoppingList = async (recipe: Recipe) => {
    try {
      const ingredients = recipeService.createShoppingListFromRecipe(recipe);
      const shoppingItems: ShoppingListItem[] = ingredients.map(ing => ({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: ing.name,
        quantity: ing.amount,
        unit: ing.unit,
        category: ing.category?.id || ing.category,
        completed: false,
        addedAt: new Date(),
        checked: false,
        price: 0,
        createdAt: new Date().toISOString(),
      }));

      await shoppingListService.addItems(shoppingItems);
      Alert.alert(
        'Erfolg',
        'Die Zutaten wurden zur Einkaufsliste hinzugefügt.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('ShoppingList'),
          },
        ],
      );
    } catch (error) {
      Alert.alert('Fehler', 'Die Zutaten konnten nicht zur Einkaufsliste hinzugefügt werden.');
    }
  };

  const renderRecipeCard = (recipe: Recipe) => (
    <View style={[styles.recipeCard, { backgroundColor: theme.background }]}>
      <View style={styles.recipeHeader}>
        <View>
          <Text style={[styles.recipeName, { color: theme.text }]}>{recipe.name}</Text>
          <Text style={[styles.recipeDescription, { color: theme.textSecondary }]}>
            {recipe.description}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.primary }]}
          onPress={() => addToShoppingList(recipe)}
        >
          <MaterialCommunityIcons name="cart-plus" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.recipeInfo}>
        <View style={styles.infoItem}>
          <MaterialCommunityIcons name="clock-outline" size={20} color={theme.textSecondary} />
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            {recipe.prepTime + recipe.cookTime} Min
          </Text>
        </View>
        <View style={styles.infoItem}>
          <MaterialCommunityIcons name="account-group" size={20} color={theme.textSecondary} />
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            {recipe.servings} Port.
          </Text>
        </View>
        <View style={styles.infoItem}>
          <MaterialCommunityIcons name="chef-hat" size={20} color={theme.textSecondary} />
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            {recipe.difficulty}
          </Text>
        </View>
      </View>

      <View style={styles.nutritionInfo}>
        <Text style={[styles.nutritionTitle, { color: theme.text }]}>Nährwerte pro Portion:</Text>
        <View style={styles.nutritionGrid}>
          <View style={styles.nutritionItem}>
            <Text style={[styles.nutritionValue, { color: theme.text }]}>
              {Math.round(recipe.nutrition.calories)} kcal
            </Text>
            <Text style={[styles.nutritionLabel, { color: theme.textSecondary }]}>Kalorien</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={[styles.nutritionValue, { color: theme.text }]}>
              {recipe.nutrition.protein}g
            </Text>
            <Text style={[styles.nutritionLabel, { color: theme.textSecondary }]}>Protein</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={[styles.nutritionValue, { color: theme.text }]}>
              {recipe.nutrition.carbs}g
            </Text>
            <Text style={[styles.nutritionLabel, { color: theme.textSecondary }]}>Kohlenhydrate</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={[styles.nutritionValue, { color: theme.text }]}>
              {recipe.nutrition.fat}g
            </Text>
            <Text style={[styles.nutritionLabel, { color: theme.textSecondary }]}>Fett</Text>
          </View>
        </View>
      </View>

      <View style={styles.tags}>
        {recipe.tags.map((tag, index) => (
          <View
            key={index}
            style={[styles.tag, { backgroundColor: theme.accent + '20' }]}
          >
            <Text style={[styles.tagText, { color: theme.accent }]}>{tag}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: theme.background, borderColor: theme.border }]}>
          <MaterialCommunityIcons name="magnify" size={24} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Nach Rezepten suchen..."
            placeholderTextColor={theme.textSecondary}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity onPress={() => setShowFilters(!showFilters)}>
            <MaterialCommunityIcons
              name="filter-variant"
              size={24}
              color={showFilters ? theme.primary : theme.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {showFilters && (
          <View style={styles.filtersContainer}>
            {/* Hier können weitere Filter-Optionen hinzugefügt werden */}
          </View>
        )}

        <TouchableOpacity
          style={[styles.searchButton, { backgroundColor: theme.primary }]}
          onPress={handleSearch}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.searchButtonText}>Suchen</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.resultsContainer}>
        {recipes.map((recipe, index) => (
          <View key={recipe.id || index} style={styles.recipeContainer}>
            {renderRecipeCard(recipe)}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  filtersContainer: {
    marginTop: 8,
  },
  searchButton: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  resultsContainer: {
    flex: 1,
  },
  recipeContainer: {
    padding: 16,
    paddingTop: 0,
  },
  recipeCard: {
    borderRadius: 12,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  recipeName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  recipeDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  addButton: {
    padding: 8,
    borderRadius: 8,
  },
  recipeInfo: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  infoText: {
    marginLeft: 4,
    fontSize: 14,
  },
  nutritionInfo: {
    marginBottom: 12,
  },
  nutritionTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  nutritionLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
  },
});