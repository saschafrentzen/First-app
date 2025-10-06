import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  NutritionGoal,
  NutritionGoalType,
  NutritionGoalPeriod,
  NutritionGoalOperation
} from '../types/nutritionGoal';
import { useTheme } from '../hooks/useTheme';
interface NutritionGoalFormProps {
  initialGoal?: NutritionGoal;
  onSave: (goal: Omit<NutritionGoal, 'id' | 'createdAt' | 'lastModified'>) => void;
  onCancel: () => void;
}

const defaultUnits: Record<NutritionGoalType, string> = {
  calories: 'kcal',
  protein: 'g',
  carbs: 'g',
  fat: 'g',
  fiber: 'g',
  sugar: 'g',
  sodium: 'mg',
  water: 'ml'
};

export const NutritionGoalForm: React.FC<NutritionGoalFormProps> = ({
  initialGoal,
  onSave,
  onCancel
}) => {
  const [name, setName] = useState(initialGoal?.name || '');
  const [description, setDescription] = useState(initialGoal?.description || '');
  const [type, setType] = useState<NutritionGoalType>(initialGoal?.type || 'calories');
  const [period, setPeriod] = useState<NutritionGoalPeriod>(initialGoal?.period || 'daily');
  const [operation, setOperation] = useState<NutritionGoalOperation>(initialGoal?.operation || 'less-than');
  const [targetValue, setTargetValue] = useState(initialGoal?.targetValue?.toString() || '');
  const [targetMaxValue, setTargetMaxValue] = useState(initialGoal?.targetMaxValue?.toString() || '');
  const [priority, setPriority] = useState(initialGoal?.priority || 'medium');
  const [active, setActive] = useState(initialGoal?.active ?? true);

  const { theme } = useTheme();

  const handleSave = () => {
    if (!name || !targetValue) {
      Alert.alert('Fehler', 'Bitte füllen Sie alle erforderlichen Felder aus.');
      return;
    }

    onSave({
      name,
      description,
      type,
      period,
      operation,
      targetValue: parseFloat(targetValue),
      targetMaxValue: operation === 'between' ? parseFloat(targetMaxValue) : undefined,
      unit: defaultUnits[type],
      priority,
      active,
    });
  };

  const renderTypeSelector = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Typ</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeSelector}>
        {Object.keys(defaultUnits).map((t) => (
          <TouchableOpacity
            key={t}
            style={[
              styles.typeButton,
              { backgroundColor: type === t ? theme.primary : theme.backgroundLight },
            ]}
            onPress={() => setType(t as NutritionGoalType)}
          >
            <Text
              style={[
                styles.typeButtonText,
                { color: type === t ? theme.textInverted : theme.text },
              ]}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderPeriodSelector = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Zeitraum</Text>
      <View style={styles.periodSelector}>
        {(['daily', 'weekly', 'monthly'] as NutritionGoalPeriod[]).map((p) => (
          <TouchableOpacity
            key={p}
            style={[
              styles.periodButton,
              { backgroundColor: period === p ? theme.primary : theme.backgroundLight },
            ]}
            onPress={() => setPeriod(p)}
          >
            <Text
              style={[
                styles.periodButtonText,
                { color: period === p ? theme.textInverted : theme.text },
              ]}
            >
              {p === 'daily' ? 'Täglich' :
               p === 'weekly' ? 'Wöchentlich' : 'Monatlich'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderTargetInput = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Zielwert</Text>
      <View style={styles.targetInputContainer}>
        <TextInput
          style={[styles.targetInput, { color: theme.text, borderColor: theme.border }]}
          value={targetValue}
          onChangeText={setTargetValue}
          placeholder="Zielwert eingeben"
          placeholderTextColor={theme.textSecondary}
          keyboardType="numeric"
        />
        <Text style={[styles.unitText, { color: theme.text }]}>{defaultUnits[type]}</Text>
      </View>
      {operation === 'between' && (
        <View style={[styles.targetInputContainer, { marginTop: 8 }]}>
          <TextInput
            style={[styles.targetInput, { color: theme.text, borderColor: theme.border }]}
            value={targetMaxValue}
            onChangeText={setTargetMaxValue}
            placeholder="Maximaler Wert"
            placeholderTextColor={theme.textSecondary}
            keyboardType="numeric"
          />
          <Text style={[styles.unitText, { color: theme.text }]}>{defaultUnits[type]}</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView>
        <View style={styles.section}>
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border }]}
            value={name}
            onChangeText={setName}
            placeholder="Name des Ziels"
            placeholderTextColor={theme.textSecondary}
          />
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Beschreibung (optional)"
            placeholderTextColor={theme.textSecondary}
            multiline
          />
        </View>

        {renderTypeSelector()}
        {renderPeriodSelector()}
        {renderTargetInput()}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Priorität</Text>
          <View style={styles.prioritySelector}>
            {(['low', 'medium', 'high'] as const).map((p) => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.priorityButton,
                  {
                    backgroundColor: priority === p ?
                      (p === 'high' ? theme.error :
                       p === 'medium' ? theme.warning :
                       theme.success) :
                      theme.backgroundLight
                  },
                ]}
                onPress={() => setPriority(p)}
              >
                <Text
                  style={[
                    styles.priorityButtonText,
                    { color: priority === p ? theme.textInverted : theme.text },
                  ]}
                >
                  {p === 'high' ? 'Hoch' :
                   p === 'medium' ? 'Mittel' : 'Niedrig'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.section, styles.switchContainer]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Aktiv</Text>
          <Switch
            value={active}
            onValueChange={setActive}
            trackColor={{ false: theme.border, true: theme.primary }}
            thumbColor={theme.background}
          />
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.error }]}
          onPress={onCancel}
        >
          <MaterialCommunityIcons name="close" size={24} color={theme.textInverted} />
          <Text style={[styles.buttonText, { color: theme.textInverted }]}>Abbrechen</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primary }]}
          onPress={handleSave}
        >
          <MaterialCommunityIcons name="check" size={24} color={theme.textInverted} />
          <Text style={[styles.buttonText, { color: theme.textInverted }]}>Speichern</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  typeSelector: {
    flexDirection: 'row',
  },
  typeButton: {
    padding: 8,
    borderRadius: 8,
    marginRight: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  typeButtonText: {
    fontWeight: '500',
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  periodButton: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  periodButtonText: {
    fontWeight: '500',
  },
  targetInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  targetInput: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  unitText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  prioritySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priorityButton: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  priorityButtonText: {
    fontWeight: '500',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  buttonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
});