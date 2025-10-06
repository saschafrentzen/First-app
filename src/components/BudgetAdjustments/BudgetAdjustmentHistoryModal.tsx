import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  useWindowDimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { BudgetCategory, BudgetAdjustment } from '../../types/budget';
import { BudgetAdjustmentHistory } from './BudgetAdjustmentHistory';
import { budgetAdjustmentService } from '../../services/budget-adjustment.service';

interface Props {
  category: BudgetCategory;
  visible: boolean;
  onClose: () => void;
}

export const BudgetAdjustmentHistoryModal: React.FC<Props> = ({
  category,
  visible,
  onClose
}) => {
  const [adjustments, setAdjustments] = useState<BudgetAdjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { height } = useWindowDimensions();

  const loadAdjustments = async () => {
    try {
      const history = await budgetAdjustmentService.getAdjustmentHistory(category.id);
      setAdjustments(history.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ));
    } catch (error) {
      console.error('Fehler beim Laden der Anpassungshistorie:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAdjustments();
    setRefreshing(false);
  };

  useEffect(() => {
    if (visible) {
      loadAdjustments();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { maxHeight: height }]}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Anpassungsverlauf</Text>
            <Text style={styles.subtitle}>{category.name}</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Icon name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Aktuelles Budget</Text>
            <Text style={styles.statValue}>
              {new Intl.NumberFormat('de-DE', {
                style: 'currency',
                currency: 'EUR'
              }).format(category.limit)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Anpassungen</Text>
            <Text style={styles.statValue}>{adjustments.length}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <BudgetAdjustmentHistory
            adjustments={adjustments}
            loading={loading}
            onRefresh={handleRefresh}
            refreshing={refreshing}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 14,
    color: '#666'
  },
  closeButton: {
    padding: 8
  },
  stats: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8
  },
  statItem: {
    flex: 1
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333'
  },
  content: {
    flex: 1
  }
});