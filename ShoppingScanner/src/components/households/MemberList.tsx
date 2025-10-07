import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { HouseholdMember } from '../../services/HouseholdService';
import { theme } from '../../theme';

interface MemberListProps {
  members: HouseholdMember[];
  showRoles?: boolean;
}

export const MemberList: React.FC<MemberListProps> = ({
  members,
  showRoles = true,
}) => {
  const getRoleIcon = (role: HouseholdMember['role']) => {
    switch (role) {
      case 'admin':
        return 'shield-crown';
      case 'member':
        return 'account';
      default:
        return 'account-question';
    }
  };

  const getRoleLabel = (role: HouseholdMember['role']) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'member':
        return 'Mitglied';
      default:
        return 'Unbekannt';
    }
  };

  return (
    <View style={styles.container}>
      {members.map((member) => (
        <View key={member.userId} style={styles.memberItem}>
          <View style={styles.avatarContainer}>
            {member.avatar ? (
              <Image
                source={{ uri: member.avatar }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.placeholderAvatar]}>
                <Text style={styles.avatarLetter}>
                  {member.displayName?.[0]?.toUpperCase() ??
                    member.email[0].toUpperCase()}
                </Text>
              </View>
            )}
            <MaterialCommunityIcons
              name={getRoleIcon(member.role)}
              size={16}
              color={member.role === 'admin' ? theme.colors.primary : theme.colors.textSecondary}
              style={styles.roleIcon}
            />
          </View>

          <View style={styles.memberInfo}>
            <Text style={styles.memberName}>
              {member.displayName || member.email}
            </Text>
            {showRoles && (
              <Text style={styles.roleText}>
                {getRoleLabel(member.role)}
              </Text>
            )}
          </View>

          <View style={styles.memberSettings}>
            {member.settings.notifications && (
              <MaterialCommunityIcons
                name="bell"
                size={16}
                color={theme.colors.success}
                style={styles.settingIcon}
              />
            )}
            {member.settings.budgetView && (
              <MaterialCommunityIcons
                name="wallet"
                size={16}
                color={theme.colors.success}
                style={styles.settingIcon}
              />
            )}
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    overflow: 'hidden',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  placeholderAvatar: {
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  roleIcon: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: theme.colors.white,
    borderRadius: 8,
    padding: 2,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 2,
  },
  roleText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  memberSettings: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginLeft: 8,
  },
});