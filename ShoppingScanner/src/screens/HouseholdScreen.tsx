import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { HouseholdStackParamList } from '@app/types/navigation';
import { householdService, Household } from '@app/services/HouseholdService';
import { HouseholdCard } from '@app/components/households/HouseholdCard';
import { CreateHouseholdModal } from '@app/components/households/CreateHouseholdModal';
import { LoadingSpinner } from '@app/components/common/LoadingSpinner';
import { ErrorMessage } from '@app/components/common/ErrorMessage';
import { theme } from '@app/theme';

export const HouseholdScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<HouseholdStackParamList>>();
  const [households, setHouseholds] = useState<Household[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);

  const loadHouseholds = async () => {
    try {
      setError(null);
      const userHouseholds = await householdService.getUserHouseholds();
      setHouseholds(userHouseholds);
    } catch (err) {
      setError('Fehler beim Laden der Haushalte');
      console.error('Error loading households:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadHouseholds();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadHouseholds();
  };

  const handleCreateHousehold = async (name: string, settings: Household['settings']) => {
    try {
      await householdService.createHousehold(name, settings);
      setIsCreateModalVisible(false);
      loadHouseholds();
      Alert.alert('Erfolg', 'Haushalt wurde erfolgreich erstellt');
    } catch (err) {
      Alert.alert('Fehler', 'Haushalt konnte nicht erstellt werden');
      console.error('Error creating household:', err);
    }
  };

  const handleHouseholdPress = (household: Household) => {
    navigation.navigate('HouseholdDetail', { householdId: household.householdId });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Meine Haushalte</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsCreateModalVisible(true)}
        >
          <MaterialCommunityIcons name="plus" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {error && <ErrorMessage message={error} onRetry={loadHouseholds} />}

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {households.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="home-variant"
              size={64}
              color={theme.colors.grey}
            />
            <Text style={styles.emptyText}>
              Noch keine Haushalte vorhanden.{'\n'}
              Erstellen Sie Ihren ersten Haushalt!
            </Text>
          </View>
        ) : (
          <View style={styles.householdList}>
            {households.map((household) => (
              <HouseholdCard
                key={household.householdId}
                household={household}
                onPress={() => handleHouseholdPress(household)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <CreateHouseholdModal
        visible={isCreateModalVisible}
        onClose={() => setIsCreateModalVisible(false)}
        onCreate={handleCreateHousehold}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  addButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  householdList: {
    padding: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.grey,
    textAlign: 'center',
  },
});