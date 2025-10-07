import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Household } from '../../services/HouseholdService';
import { theme } from '../../theme';

interface HouseholdCardProps {
  household: Household;
  onPress: (household: Household) => void;
}

export const HouseholdCard: React.FC<HouseholdCardProps> = ({
  household,
  onPress,
}) => {
  const memberCount = household.members.length;
  const listCount = household.sharedLists.length;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(household)}
    >
      <View style={styles.header}>
        <Text style={styles.name}>{household.name}</Text>
        <MaterialCommunityIcons
          name="chevron-right"
          size={24}
          color={theme.colors.grey}
        />
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.infoItem}>
          <MaterialCommunityIcons
            name="account-group"
            size={20}
            color={theme.colors.primary}
          />
          <Text style={styles.infoText}>
            {memberCount} {memberCount === 1 ? 'Mitglied' : 'Mitglieder'}
          </Text>
        </View>

        <View style={styles.infoItem}>
          <MaterialCommunityIcons
            name="format-list-checks"
            size={20}
            color={theme.colors.primary}
          />
          <Text style={styles.infoText}>
            {listCount} {listCount === 1 ? 'Liste' : 'Listen'}
          </Text>
        </View>
      </View>

      {household.settings.sharedBudget && (
        <View style={styles.budgetContainer}>
          <MaterialCommunityIcons
            name="wallet"
            size={16}
            color={theme.colors.success}
          />
          <Text style={styles.budgetText}>Gemeinsames Budget aktiviert</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  infoContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  infoText: {
    marginLeft: 6,
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  budgetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  budgetText: {
    marginLeft: 4,
    fontSize: 12,
    color: theme.colors.success,
  },
});