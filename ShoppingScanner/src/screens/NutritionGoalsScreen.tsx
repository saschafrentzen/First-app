import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  NutritionGoal,
  NutritionGoalType,
  NutritionGoalPeriod,
  NutritionGoalOperation
} from '../types/nutritionGoal';
import { nutritionGoalService } from '../services/nutritionGoalService';
import { useTheme } from '../hooks/useTheme';
import { NutritionGoalForm } from '../components/NutritionGoalForm';

export const NutritionGoalsScreen: React.FC = () => {
  const [goals, setGoals] = useState<NutritionGoal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<NutritionGoal | undefined>();
  const { theme } = useTheme();

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const allGoals = await nutritionGoalService.getAllGoals();
      setGoals(allGoals);
    } catch (error) {
      Alert.alert('Fehler', 'Ernährungsziele konnten nicht geladen werden.');
    }
  };

  const handleCreateGoal = async (goal: Omit<NutritionGoal, 'id' | 'createdAt' | 'lastModified'>) => {
    try {
      await nutritionGoalService.createGoal(goal);
      setShowForm(false);
      loadGoals();
      Alert.alert('Erfolg', 'Ernährungsziel wurde erstellt.');
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Fehler', error.message);
      } else {
        Alert.alert('Fehler', 'Ernährungsziel konnte nicht erstellt werden.');
      }
    }
  };

  const handleUpdateGoal = async (goal: Omit<NutritionGoal, 'id' | 'createdAt' | 'lastModified'>) => {
    if (!editingGoal) return;

    try {
      await nutritionGoalService.updateGoal(editingGoal.id, goal);
      setShowForm(false);
      setEditingGoal(undefined);
      loadGoals();
      Alert.alert('Erfolg', 'Ernährungsziel wurde aktualisiert.');
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Fehler', error.message);
      } else {
        Alert.alert('Fehler', 'Ernährungsziel konnte nicht aktualisiert werden.');
      }
    }
  };

  const handleDeleteGoal = async (goal: NutritionGoal) => {
    Alert.alert(
      'Ernährungsziel löschen',
      'Möchten Sie dieses Ernährungsziel wirklich löschen?',
      [
        {
          text: 'Abbrechen',
          style: 'cancel',
        },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            try {
              await nutritionGoalService.deleteGoal(goal.id);
              loadGoals();
              Alert.alert('Erfolg', 'Ernährungsziel wurde gelöscht.');
            } catch (error) {
              Alert.alert('Fehler', 'Ernährungsziel konnte nicht gelöscht werden.');
            }
          },
        },
      ],
    );
  };

  const renderGoal = (goal: NutritionGoal) => {
    return (
      <TouchableOpacity
        key={goal.id}
        style={[styles.goalItem, { borderColor: theme.border }]}
        onPress={() => {
          setEditingGoal(goal);
          setShowForm(true);
        }}
      >
        <View style={styles.goalHeader}>
          <View style={styles.goalInfo}>
            <MaterialCommunityIcons
              name="target"
              size={24}
              color={theme.primary}
              style={styles.icon}
            />
            <View>
              <Text style={[styles.goalName, { color: theme.text }]}>
                {goal.name}
              </Text>
              <Text style={[styles.goalDescription, { color: theme.textSecondary }]}>
                {goal.description || 'Keine Beschreibung'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => handleDeleteGoal(goal)}
            style={styles.deleteButton}
          >
            <MaterialCommunityIcons name="delete" size={24} color={theme.error} />
          </TouchableOpacity>
        </View>

        <View style={styles.goalDetails}>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons
              name="chart-line"
              size={20}
              color={theme.textSecondary}
            />
            <Text style={[styles.detailText, { color: theme.textSecondary }]}>
              Ziel: {goal.targetValue}{goal.unit}
              {goal.targetMaxValue ? ` - ${goal.targetMaxValue}${goal.unit}` : ''}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={20}
              color={theme.textSecondary}
            />
            <Text style={[styles.detailText, { color: theme.textSecondary }]}>
              {goal.period === 'daily' ? 'Täglich' :
               goal.period === 'weekly' ? 'Wöchentlich' : 'Monatlich'}
            </Text>
          </View>

          <View style={styles.priorityBadge}>
            <Text style={[
              styles.priorityText,
              {
                color: theme.textInverted,
                backgroundColor:
                  goal.priority === 'high' ? theme.error :
                  goal.priority === 'medium' ? theme.warning :
                  theme.success
              }
            ]}>
              {goal.priority === 'high' ? 'Hohe' :
               goal.priority === 'medium' ? 'Mittlere' :
               'Niedrige'} Priorität
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (showForm) {
    return (
      <NutritionGoalForm
        initialGoal={editingGoal}
        onSave={editingGoal ? handleUpdateGoal : handleCreateGoal}
        onCancel={() => {
          setShowForm(false);
          setEditingGoal(undefined);
        }}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: theme.primary }]}
        onPress={() => setShowForm(true)}
      >
        <MaterialCommunityIcons name="plus" size={24} color={theme.textInverted} />
        <Text style={[styles.addButtonText, { color: theme.textInverted }]}>
          Neues Ernährungsziel
        </Text>
      </TouchableOpacity>

      <ScrollView>
        {goals.map(renderGoal)}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 16,
    marginLeft: 8,
  },
  goalItem: {
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: 12,
  },
  goalName: {
    fontSize: 16,
    fontWeight: '500',
  },
  goalDescription: {
    fontSize: 14,
    marginTop: 4,
  },
  deleteButton: {
    padding: 8,
  },
  goalDetails: {
    marginTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  detailText: {
    fontSize: 14,
    marginLeft: 8,
  },
  priorityBadge: {
    marginTop: 12,
  },
  priorityText: {
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
});