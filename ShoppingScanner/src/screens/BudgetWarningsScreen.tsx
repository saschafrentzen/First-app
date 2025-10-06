import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { BudgetWarning, BudgetWarningSettings } from '../types/budgetWarning';
import { budgetWarningService } from '../services/budgetWarningService';

export const BudgetWarningsScreen: React.FC = () => {
  const [warnings, setWarnings] = useState<BudgetWarning[]>([]);
  const [settings, setSettings] = useState<BudgetWarningSettings | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    loadWarningsAndSettings();
  }, []);

  const loadWarningsAndSettings = async () => {
    try {
      const [loadedWarnings, loadedSettings] = await Promise.all([
        budgetWarningService.getWarnings(),
        budgetWarningService.getSettings()
      ]);
      setWarnings(loadedWarnings);
      setSettings(loadedSettings);
    } catch (error) {
      Alert.alert('Fehler', 'Einstellungen konnten nicht geladen werden.');
    }
  };

  const handleSettingChange = async (key: keyof BudgetWarningSettings, value: boolean) => {
    if (!settings) return;
    
    try {
      const newSettings = { ...settings, [key]: value };
      await budgetWarningService.updateSettings(newSettings);
      setSettings(newSettings);
    } catch (error) {
      Alert.alert('Fehler', 'Einstellung konnte nicht gespeichert werden.');
    }
  };

  const handleAcknowledgeWarning = async (warning: BudgetWarning) => {
    try {
      await budgetWarningService.acknowledgeWarning(warning.id);
      // Aktualisiere die Warnungen in der UI
      const updatedWarnings = await budgetWarningService.getWarnings();
      setWarnings(updatedWarnings);
    } catch (error) {
      Alert.alert('Fehler', 'Warnung konnte nicht bestätigt werden.');
    }
  };

  const renderWarning = (warning: BudgetWarning) => {
    const severityColors = {
      low: theme.success,
      medium: theme.warning,
      high: theme.error
    };

    return (
      <TouchableOpacity
        key={warning.id}
        style={[
          styles.warningCard,
          { 
            backgroundColor: theme.surface,
            borderColor: severityColors[warning.severity],
            opacity: warning.acknowledged ? 0.7 : 1
          }
        ]}
        onPress={() => !warning.acknowledged && handleAcknowledgeWarning(warning)}
      >
        <View style={styles.warningHeader}>
          <MaterialCommunityIcons
            name={
              warning.type === 'threshold' ? 'alert-circle' :
              warning.type === 'prediction' ? 'chart-line' :
              'trending-up'
            }
            size={24}
            color={severityColors[warning.severity]}
          />
          <View style={styles.warningInfo}>
            <Text style={[styles.warningTitle, { color: theme.text }]}>
              {warning.message}
            </Text>
            <Text style={[styles.warningSubtitle, { color: theme.textSecondary }]}>
              {new Date(warning.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {warning.prediction && (
          <View style={styles.predictionInfo}>
            <Text style={[styles.predictionText, { color: theme.text }]}>
              Prognose: {warning.prediction.predictedAmount.toFixed(2)}€
            </Text>
            <Text style={[styles.predictionConfidence, { color: theme.textSecondary }]}>
              Konfidenz: {(warning.prediction.confidence * 100).toFixed(0)}%
            </Text>
          </View>
        )}

        {warning.suggestion && (
          <View style={styles.suggestionInfo}>
            <Text style={[styles.suggestionText, { color: theme.text }]}>
              Vorschlag: {warning.suggestion.suggestedBudget.toFixed(2)}€
              {' '}({((warning.suggestion.suggestedBudget - warning.suggestion.currentBudget) / warning.suggestion.currentBudget * 100).toFixed(0)}%)
            </Text>
            <Text style={[styles.suggestionReason, { color: theme.textSecondary }]}>
              {warning.suggestion.reason}
            </Text>
          </View>
        )}

        {!warning.acknowledged && (
          <TouchableOpacity
            style={[styles.acknowledgeButton, { backgroundColor: theme.primary }]}
            onPress={() => handleAcknowledgeWarning(warning)}
          >
            <Text style={[styles.acknowledgeText, { color: theme.textInverted }]}>
              Bestätigen
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  if (!settings) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text>Lädt...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView>
        <View style={[styles.settingsSection, { borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Einstellungen
          </Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>
                Warnungen aktiviert
              </Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                Aktiviert alle Budget-Warnungen
              </Text>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={(value) => handleSettingChange('enabled', value)}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>
                Trend-Benachrichtigungen
              </Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                Benachrichtigungen bei auffälligen Ausgabentrends
              </Text>
            </View>
            <Switch
              value={settings.notifyOnTrends}
              onValueChange={(value) => handleSettingChange('notifyOnTrends', value)}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>
                Automatische Anpassungen
              </Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                Erlaubt automatische Budget-Anpassungen
              </Text>
            </View>
            <Switch
              value={settings.autoAdjust}
              onValueChange={(value) => handleSettingChange('autoAdjust', value)}
            />
          </View>
        </View>

        <View style={styles.warningsSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Aktuelle Warnungen
          </Text>
          {warnings.length > 0 ? (
            warnings.map(renderWarning)
          ) : (
            <Text style={[styles.noWarnings, { color: theme.textSecondary }]}>
              Keine aktiven Warnungen
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  settingsSection: {
    padding: 16,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 14,
    marginTop: 4,
  },
  warningsSection: {
    padding: 16,
  },
  warningCard: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  warningInfo: {
    flex: 1,
    marginLeft: 12,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  warningSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  predictionInfo: {
    marginTop: 12,
    padding: 8,
    borderRadius: 4,
  },
  predictionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  predictionConfidence: {
    fontSize: 12,
    marginTop: 4,
  },
  suggestionInfo: {
    marginTop: 12,
    padding: 8,
    borderRadius: 4,
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  suggestionReason: {
    fontSize: 12,
    marginTop: 4,
  },
  acknowledgeButton: {
    marginTop: 12,
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  acknowledgeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  noWarnings: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 24,
  },
});