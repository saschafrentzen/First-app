import React, { useState, useEffect } from 'react';
import { BudgetDetailsScreen } from './BudgetDetailsScreen';
import { budgetService } from '../services/budget.service';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/RootNavigator';
import { BudgetCategory } from '../types/budget';

type Props = {
  route: RouteProp<RootStackParamList, 'BudgetDetails'>;
};

export const BudgetDetailsScreenContainer: React.FC<Props> = ({ route }) => {
  const [category, setCategory] = useState<BudgetCategory | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadCategory = async () => {
    const category = budgetService.getCategories().get(route.params.categoryId);
    if (category) {
      setCategory(category);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCategory();
    setRefreshing(false);
  };

  useEffect(() => {
    loadCategory();
  }, [route.params.categoryId]);

  if (!category) {
    return null;
  }

  return (
    <BudgetDetailsScreen
      category={category}
      onRefresh={handleRefresh}
      refreshing={refreshing}
      onBudgetUpdated={loadCategory}
    />
  );
};