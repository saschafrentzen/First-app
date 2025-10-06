import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, ProgressBar, FAB, Portal, Dialog, TextInput } from 'react-native-paper';
import { budgetService } from '../services/budget.service';
import {
  BudgetCategory,
  BudgetAlert,
  BudgetStatus,
  BudgetNotification
} from '../types/budget';

const BudgetWarningScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [categories, setCategories] = useState<BudgetCategory[]>([]);

  const getCategoryName = useCallback((categoryId: string): string => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Unbekannte Kategorie';
  }, [categories]);
  const [notifications, setNotifications] = useState<BudgetNotification[]>([]);
  const [statuses, setStatuses] = useState<Map<string, BudgetStatus>>(new Map());
  const [refreshing, setRefreshing] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: '',
    limit: '',
    period: 'monthly' as const
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Lade Budget-Kategorien und Status
      const loadedCategories = Array.from(budgetService.getCategories().values());
      setCategories(loadedCategories);

      // Lade Status für jede Kategorie
      const statusMap = new Map();
      for (const category of loadedCategories) {
        const status = await budgetService.getCategoryStatus(category.id);
        if (status) {
          statusMap.set(category.id, status);
        }
      }
      setStatuses(statusMap);

      // Lade aktuelle Benachrichtigungen
      const loadedNotifications = Array.from(budgetService.getNotifications().values())
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setNotifications(loadedNotifications);
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error);
      Alert.alert('Fehler', 'Die Daten konnten nicht geladen werden.');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const addCategory = async () => {
    try {
      if (!newCategory.name || !newCategory.limit) {
        Alert.alert('Fehler', 'Bitte füllen Sie alle Felder aus.');
        return;
      }

      const limit = parseFloat(newCategory.limit);
      if (isNaN(limit) || limit <= 0) {
        Alert.alert('Fehler', 'Bitte geben Sie ein gültiges Budget ein.');
        return;
      }

      await budgetService.addCategory({
        name: newCategory.name,
        limit,
        period: newCategory.period,
        spent: 0,
        alerts: []
      });

      setDialogVisible(false);
      setNewCategory({ name: '', limit: '', period: 'monthly' });
      loadData();
    } catch (error) {
      console.error('Fehler beim Hinzufügen der Kategorie:', error);
      Alert.alert('Fehler', 'Die Kategorie konnte nicht hinzugefügt werden.');
    }
  };

  const renderCategoryCard = (category: BudgetCategory) => {
    const status = statuses.get(category.id);
    const progress = status ? status.percentageSpent / 100 : 0;
    const progressColor = getProgressColor(progress);

    return (
      <Card key={category.id} style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Text style={styles.categoryName}>{category.name}</Text>
            <Text style={styles.period}>{formatPeriod(category.period)}</Text>
          </View>

          <ProgressBar
            progress={progress}
            color={progressColor}
            style={styles.progressBar}
          />

          <View style={styles.budgetInfo}>
            <View>
              <Text style={styles.label}>Ausgegeben</Text>
              <Text style={styles.amount}>
                {formatCurrency(status?.spent || 0)}
              </Text>
            </View>
            <View>
              <Text style={styles.label}>Verbleibend</Text>
              <Text style={[styles.amount, { color: progressColor }]}>
                {formatCurrency(status?.remaining || 0)}
              </Text>
            </View>
            <View>
              <Text style={styles.label}>Limit</Text>
              <Text style={styles.amount}>
                {formatCurrency(category.limit)}
              </Text>
            </View>
          </View>

          {status?.activeAlerts && status.activeAlerts.length > 0 && (
            <View style={styles.alertsContainer}>
              {(status.activeAlerts as BudgetAlert[]).map((alert) => (
                <View key={alert.id} style={styles.alertChip}>
                  <Icon
                    name={alert.type === 'warning' ? 'alert' : 'alert-octagon'}
                    size={16}
                    color={alert.type === 'warning' ? '#FFA000' : '#D32F2F'}
                  />
                  <Text style={styles.alertText}>
                    {alert.message}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  const renderNotificationsList = () => {
    if (notifications.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Icon name="bell-outline" size={48} color="#757575" />
          <Text style={styles.emptyStateText}>
            Keine Benachrichtigungen vorhanden
          </Text>
        </View>
      );
    }

    return notifications.map(notification => (
      <Card key={notification.id} style={styles.notificationCard}>
        <Card.Content>
          <View style={styles.notificationHeader}>
            <Icon
              name={notification.type === 'warning' ? 'alert' : 'alert-octagon'}
              size={24}
              color={notification.type === 'warning' ? '#FFA000' : '#D32F2F'}
            />
            <View style={styles.notificationInfo}>
              <Text style={styles.notificationTitle}>
                {getCategoryName(notification.categoryId)}
              </Text>
              <Text style={styles.notificationTimestamp}>
                {formatTimestamp(notification.timestamp)}
              </Text>
            </View>
          </View>
          <Text style={styles.notificationMessage}>
            {notification.message}
          </Text>
        </Card.Content>
      </Card>
    ));
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Budget-Übersicht</Text>
          {categories.map(renderCategoryCard)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Benachrichtigungen</Text>
          {renderNotificationsList()}
        </View>
      </ScrollView>

      <FAB
        style={[styles.fab, { bottom: insets.bottom + 16 }]}
        icon="plus"
        onPress={() => setDialogVisible(true)}
      />

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>Neue Budget-Kategorie</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Name"
              value={newCategory.name}
              onChangeText={text => setNewCategory(prev => ({ ...prev, name: text }))}
              style={styles.input}
            />
            <TextInput
              label="Budget-Limit"
              value={newCategory.limit}
              onChangeText={text => setNewCategory(prev => ({ ...prev, limit: text }))}
              keyboardType="numeric"
              style={styles.input}
            />
            <TouchableOpacity
              style={styles.periodSelector}
              onPress={() => {
                // Implementiere Periode-Auswahl
              }}
            >
              <Text>Zeitraum: {formatPeriod(newCategory.period)}</Text>
              <Icon name="chevron-right" size={24} />
            </TouchableOpacity>
          </Dialog.Content>
          <Dialog.Actions>
            <TouchableOpacity
              onPress={() => setDialogVisible(false)}
              style={styles.dialogButton}
            >
              <Text>Abbrechen</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={addCategory}
              style={[styles.dialogButton, styles.dialogButtonPrimary]}
            >
              <Text style={styles.dialogButtonPrimaryText}>Hinzufügen</Text>
            </TouchableOpacity>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

// Hilfsfunktionen
const getProgressColor = (progress: number): string => {
  if (progress >= 0.95) return '#D32F2F';
  if (progress >= 0.8) return '#FFA000';
  return '#4CAF50';
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
};

const formatPeriod = (period: string): string => {
  switch (period) {
    case 'daily': return 'Täglich';
    case 'weekly': return 'Wöchentlich';
    case 'monthly': return 'Monatlich';
    case 'yearly': return 'Jährlich';
    default: return period;
  }
};

const formatTimestamp = (timestamp: string): string => {
  return new Date(timestamp).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  section: {
    padding: 16
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16
  },
  card: {
    marginBottom: 16,
    elevation: 4
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  categoryName: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  period: {
    fontSize: 14,
    color: '#757575'
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 12
  },
  budgetInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  label: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4
  },
  amount: {
    fontSize: 16,
    fontWeight: '500'
  },
  alertsContainer: {
    marginTop: 8
  },
  alertChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 8,
    borderRadius: 16,
    marginBottom: 8
  },
  alertText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#E65100'
  },
  notificationCard: {
    marginBottom: 8
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  notificationInfo: {
    marginLeft: 12,
    flex: 1
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '500'
  },
  notificationTimestamp: {
    fontSize: 12,
    color: '#757575'
  },
  notificationMessage: {
    marginTop: 8,
    fontSize: 14
  },
  fab: {
    position: 'absolute',
    right: 16,
    backgroundColor: '#2196F3'
  },
  emptyState: {
    alignItems: 'center',
    padding: 32
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    color: '#757575'
  },
  input: {
    marginBottom: 16
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  dialogButton: {
    padding: 8,
    marginHorizontal: 8
  },
  dialogButtonPrimary: {
    backgroundColor: '#2196F3',
    borderRadius: 4,
    paddingHorizontal: 16
  },
  dialogButtonPrimaryText: {
    color: 'white'
  }
});

export default BudgetWarningScreen;