import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { HouseholdStackParamList } from '@app/types/navigation';
import {
  householdService,
  Household,
  HouseholdMember,
} from '@app/services/HouseholdService';
import { SharedList } from '@app/services/SharedListService';
import { MemberList } from '@app/components/households/MemberList';
import { LoadingSpinner } from '@app/components/common/LoadingSpinner';
import { ErrorMessage } from '@app/components/common/ErrorMessage';
import { theme } from '@app/theme';

type RouteParams = HouseholdStackParamList['HouseholdDetail'];

export const HouseholdDetailScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation<StackNavigationProp<HouseholdStackParamList>>();
  const { householdId } = route.params as RouteParams;

  const [household, setHousehold] = useState<Household | null>(null);
  const [sharedLists, setSharedLists] = useState<SharedList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadHouseholdData = useCallback(async () => {
    try {
      setError(null);
      const [householdData, listsData] = await Promise.all([
        householdService.getHousehold(householdId),
        householdService.getHouseholdLists(householdId),
      ]);
      setHousehold(householdData);
      setSharedLists(listsData);
    } catch (err) {
      setError('Fehler beim Laden der Haushaltsdaten');
      console.error('Error loading household data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [householdId]);

  useEffect(() => {
    loadHouseholdData();
  }, [loadHouseholdData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadHouseholdData();
  };

  const handleAddList = () => {
    navigation.navigate('ListSelection', { householdId });
  };

  const handleListPress = (list: SharedList) => {
    navigation.navigate('SharedList', { shareId: list.shareId });
  };

  const handleSettingsPress = () => {
    navigation.navigate('HouseholdSettings', { householdId });
  };

  const handleInviteMember = () => {
    if (household?.settings.allowInvites) {
      navigation.navigate('InviteMember', { householdId });
    } else {
      Alert.alert(
        'Nicht möglich',
        'Einladungen sind für diesen Haushalt deaktiviert.'
      );
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!household) {
    return (
      <ErrorMessage
        message="Haushalt konnte nicht geladen werden"
        onRetry={loadHouseholdData}
      />
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.householdName}>{household.name}</Text>
            <Text style={styles.memberCount}>
              {household.members.length}{' '}
              {household.members.length === 1 ? 'Mitglied' : 'Mitglieder'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={handleSettingsPress}
          >
            <MaterialCommunityIcons
              name="cog"
              size={24}
              color={theme.colors.text}
            />
          </TouchableOpacity>
        </View>

        {/* Statistiken */}
        {household.settings.sharedBudget && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <MaterialCommunityIcons
                name="wallet"
                size={24}
                color={theme.colors.primary}
              />
              <Text style={styles.statValue}>
                {household.statistics.totalSpent.toFixed(2)} {household.settings.currency}
              </Text>
              <Text style={styles.statLabel}>Gesamtausgaben</Text>
            </View>
            {/* Weitere Statistiken hier */}
          </View>
        )}

        {/* Mitglieder */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mitglieder</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleInviteMember}
            >
              <MaterialCommunityIcons
                name="account-plus"
                size={20}
                color={theme.colors.primary}
              />
              <Text style={styles.addButtonText}>Einladen</Text>
            </TouchableOpacity>
          </View>
          <MemberList members={household.members} showRoles={true} />
        </View>

        {/* Geteilte Listen */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Einkaufslisten</Text>
            <TouchableOpacity style={styles.addButton} onPress={handleAddList}>
              <MaterialCommunityIcons
                name="plus"
                size={20}
                color={theme.colors.primary}
              />
              <Text style={styles.addButtonText}>Liste hinzufügen</Text>
            </TouchableOpacity>
          </View>
          
          {sharedLists.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="format-list-text"
                size={48}
                color={theme.colors.grey}
              />
              <Text style={styles.emptyText}>
                Keine Listen vorhanden.{'\n'}
                Fügen Sie Ihre erste Liste hinzu!
              </Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {sharedLists.map((list) => (
                <TouchableOpacity
                  key={list.shareId}
                  style={styles.listItem}
                  onPress={() => handleListPress(list)}
                >
                  <View style={styles.listInfo}>
                    <Text style={styles.listName}>{list.name}</Text>
                    <Text style={styles.listMeta}>
                      Geteilt von {list.ownerEmail}
                    </Text>
                  </View>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={24}
                    color={theme.colors.grey}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  householdName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  memberCount: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  settingsButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  section: {
    marginVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  addButtonText: {
    marginLeft: 4,
    fontSize: 14,
    color: theme.colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: theme.colors.card,
    margin: 16,
    borderRadius: 12,
  },
  emptyText: {
    marginTop: 16,
    textAlign: 'center',
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  listContainer: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    marginHorizontal: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  listInfo: {
    flex: 1,
  },
  listName: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 4,
  },
  listMeta: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
});