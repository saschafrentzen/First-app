import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Animated
} from 'react-native';
import { BudgetCategory } from '../types/budget';
import { budgetService } from '../services/budget.service';
import { BudgetCategoryCard } from '../components/Budget/BudgetCategoryCard';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { SequentialFadeIn } from '../components/Animations/Animations';

type NavigationProp = StackNavigationProp<RootStackParamList, 'BudgetList'>;

export const BudgetListScreen: React.FC = () => {
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<NavigationProp>();

  const loadCategories = async () => {
    try {
      const loadedCategories = Array.from(budgetService.getCategories().values());
      setCategories(loadedCategories);
    } catch (error) {
      console.error('Fehler beim Laden der Kategorien:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCategories();
    setRefreshing(false);
  };

  const handleCategoryPress = (category: BudgetCategory) => {
    navigation.navigate('BudgetDetails', { categoryId: category.id });
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const renderItem = ({ item, index }: { item: BudgetCategory; index: number }) => (
    <Animated.View
      style={{
        opacity: new Animated.Value(1),
        transform: [{ scale: new Animated.Value(1) }]
      }}
    >
      <BudgetCategoryCard
        category={item}
        onPress={() => handleCategoryPress(item)}
      />
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={categories}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        CellRendererComponent={({ children, index, style, ...props }) => (
          <SequentialFadeIn
            style={[style, { marginBottom: 16 }]}
            delay={50 * index}
          >
            {[children]}
          </SequentialFadeIn>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  listContainer: {
    padding: 16
  }
});