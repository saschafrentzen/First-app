import React, { useState } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity, Text } from 'react-native';
import { Form, FormField, FormSelect, FormNumberInput } from '../components/Form';
import { nutritionGoalsService } from '../services/nutritionGoals.service';
import { DailyNutritionEntry } from '../types/nutrition';
import { Theme } from '../theme';

interface MealFormProps {
  profileId: string;
  onSave: (entry: DailyNutritionEntry) => void;
}

interface FoodItem {
  name: string;
  amount: string;
  unit: string;
}

export const MealForm: React.FC<MealFormProps> = ({ profileId, onSave }) => {
  const [mealType, setMealType] = useState('');
  const [foods, setFoods] = useState<FoodItem[]>([
    { name: '', amount: '', unit: 'g' },
  ]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const mealTypes = [
    { label: 'Frühstück', value: 'breakfast' },
    { label: 'Mittagessen', value: 'lunch' },
    { label: 'Abendessen', value: 'dinner' },
    { label: 'Snack', value: 'snack' },
  ];

  const unitOptions = [
    { label: 'Gramm', value: 'g' },
    { label: 'Milliliter', value: 'ml' },
    { label: 'Stück', value: 'piece' },
    { label: 'Portion', value: 'serving' },
  ];

  const addFoodItem = () => {
    setFoods([...foods, { name: '', amount: '', unit: 'g' }]);
  };

  const updateFoodItem = (index: number, field: keyof FoodItem, value: string) => {
    const updatedFoods = [...foods];
    updatedFoods[index] = { ...updatedFoods[index], [field]: value };
    setFoods(updatedFoods);
  };

  const validateForm = (): boolean => {
    if (!mealType) {
      Alert.alert('Fehler', 'Bitte wähle eine Mahlzeit aus');
      return false;
    }

    for (const food of foods) {
      if (!food.name.trim()) {
        Alert.alert('Fehler', 'Bitte gib einen Namen für jedes Lebensmittel ein');
        return false;
      }
      if (!food.amount || isNaN(parseFloat(food.amount))) {
        Alert.alert('Fehler', 'Bitte gib eine gültige Menge für jedes Lebensmittel ein');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      // Erstelle das Meal-Objekt
      const meal = {
        id: `meal_${Date.now()}`,
        type: mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack',
        time: new Date().toISOString(),
        foods: foods.map(food => ({
          name: food.name,
          amount: parseFloat(food.amount),
          unit: food.unit,
          nutrition: {
            calories: 0, // Diese Werte würden normalerweise aus einer Nährwert-Datenbank kommen
            protein: 0,
            carbohydrates: 0,
            fat: 0,
          },
        })),
        totalNutrition: {
          calories: 0,
          protein: 0,
          carbohydrates: 0,
          fat: 0,
        },
      };

      // Erstelle den Tageseintrag
      const entry: DailyNutritionEntry = {
        id: `entry_${Date.now()}`,
        profileId,
        date: new Date().toISOString().split('T')[0],
        meals: [meal],
        totalDailyNutrition: meal.totalNutrition,
        goals: [],
        notes,
      };

      onSave(entry);
      
      // Formular zurücksetzen
      setMealType('');
      setFoods([{ name: '', amount: '', unit: 'g' }]);
      setNotes('');
    } catch (error) {
      console.error('Fehler beim Speichern der Mahlzeit:', error);
      Alert.alert(
        'Fehler',
        'Die Mahlzeit konnte nicht gespeichert werden. Bitte versuche es erneut.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit} loading={loading} submitLabel="Mahlzeit speichern">
      <FormSelect
        label="Mahlzeit"
        value={mealType}
        options={mealTypes}
        onSelect={setMealType}
      />

      {foods.map((food, index) => (
        <View key={index} style={styles.foodItem}>
          <FormField
            label="Lebensmittel"
            value={food.name}
            onChangeText={(value) => updateFoodItem(index, 'name', value)}
            placeholder="z.B. Haferflocken"
          />
          <View style={styles.amountContainer}>
            <FormNumberInput
              label="Menge"
              value={food.amount}
              onChangeText={(value) => updateFoodItem(index, 'amount', value)}
              min={0}
              step={10}
              unit={food.unit}
            />
            <FormSelect
              label="Einheit"
              value={food.unit}
              options={unitOptions}
              onSelect={(value) => updateFoodItem(index, 'unit', value)}
            />
          </View>
        </View>
      ))}

      <TouchableOpacity
        style={styles.addButton}
        onPress={addFoodItem}
      >
        <Text style={styles.addButtonText}>+ Lebensmittel hinzufügen</Text>
      </TouchableOpacity>

      <FormField
        label="Notizen"
        value={notes}
        onChangeText={setNotes}
        multiline
        placeholder="Optionale Notizen zur Mahlzeit"
      />
    </Form>
  );
};

const styles = StyleSheet.create({
  foodItem: {
    marginBottom: Theme.spacing.md,
    padding: Theme.spacing.sm,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.shape.borderRadius.md,
    ...Theme.shadows.sm,
  },
  amountContainer: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
  },
  addButton: {
    padding: Theme.spacing.md,
    borderRadius: Theme.shape.borderRadius.sm,
    backgroundColor: Theme.colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.lg,
  },
  addButtonText: {
    color: `rgb(${Theme.colors.primary})`,
    ...Theme.typography.body1,
  },
});