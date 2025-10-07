import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  householdService,
  Household,
  HouseholdMember,
} from '@app/services/HouseholdService';
import { LoadingSpinner } from '@app/components/common/LoadingSpinner';
import { ErrorMessage } from '@app/components/common/ErrorMessage';
import { MemberList } from '@app/components/households/MemberList';
import { theme } from '@app/theme';

interface RouteParams {
  householdId: string;
}

export const HouseholdSettingsScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { householdId } = route.params as RouteParams;

  const [household, setHousehold] = useState<Household | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<Household['settings']>({
    allowInvites: true,
    autoShareLists: false,
    sharedBudget: false,
    currency: 'EUR',
  });
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadHouseholdData();
  }, []);

  const loadHouseholdData = async () => {
    try {
      setError(null);
      const data = await householdService.getHousehold(householdId);
      setHousehold(data);
      setSettings(data.settings);
      
      // Prüfe Admin-Rechte
      const user = await householdService.getCurrentUser();
      if (user) {
                const member = data.members.find((m: HouseholdMember) => m.userId === user.uid);
        setIsAdmin(member?.role === 'admin');
      }
    } catch (err) {
      setError('Fehler beim Laden der Haushaltseinstellungen');
      console.error('Error loading household settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = async (value: string) => {
    try {
      if (!isAdmin) {
        Alert.alert(
          'Keine Berechtigung',
          'Nur Administratoren können den Namen ändern.'
        );
        return;
      }

      await householdService.updateHouseholdName(householdId, value);
      setHousehold(prev => prev ? { ...prev, name: value } : null);
    } catch (error) {
      console.error('Error updating household name:', error);
      Alert.alert(
        'Fehler',
        'Der Name konnte nicht geändert werden.'
      );
    }
  };

  const handleSettingChange = async (
    key: keyof Household['settings'],
    value: any
  ) => {
    try {
      if (!isAdmin) {
        Alert.alert(
          'Keine Berechtigung',
          'Nur Administratoren können Einstellungen ändern.'
        );
        return;
      }

      const updatedSettings = {
        ...settings,
        [key]: value,
      };

      await householdService.updateHouseholdSettings(householdId, updatedSettings);
      setSettings(updatedSettings);

      // Zeige Erfolg nur bei wichtigen Änderungen
      if (key === 'sharedBudget' || key === 'allowInvites') {
        Alert.alert('Erfolg', 'Einstellungen wurden aktualisiert');
      }
    } catch (err) {
      Alert.alert('Fehler', 'Einstellungen konnten nicht aktualisiert werden');
      console.error('Error updating settings:', err);
    }
  };

  const handleRemoveMember = async (member: HouseholdMember) => {
    if (!isAdmin) {
      Alert.alert(
        'Keine Berechtigung',
        'Nur Administratoren können Mitglieder entfernen.'
      );
      return;
    }

    Alert.alert(
      'Mitglied entfernen',
      `Möchten Sie wirklich ${member.displayName || member.email} aus dem Haushalt entfernen?`,
      [
        {
          text: 'Abbrechen',
          style: 'cancel',
        },
        {
          text: 'Entfernen',
          style: 'destructive',
          onPress: async () => {
            try {
              await householdService.removeMemberFromHousehold(
                householdId,
                member.userId
              );
              loadHouseholdData();
              Alert.alert('Erfolg', 'Mitglied wurde entfernt');
            } catch (err) {
              Alert.alert('Fehler', 'Mitglied konnte nicht entfernt werden');
              console.error('Error removing member:', err);
            }
          },
        },
      ]
    );
  };

  const handleTransferOwnership = async (newAdmin: HouseholdMember) => {
    Alert.alert(
      'Adminrechte übertragen',
      `Möchten Sie wirklich die Adminrechte an ${
        newAdmin.displayName || newAdmin.email
      } übertragen? Sie verlieren damit Ihre Adminrechte.`,
      [
        {
          text: 'Abbrechen',
          style: 'cancel',
        },
        {
          text: 'Übertragen',
          onPress: async () => {
            try {
              await householdService.transferOwnership(householdId, newAdmin.userId);
              loadHouseholdData();
              Alert.alert('Erfolg', 'Adminrechte wurden übertragen');
            } catch (err) {
              Alert.alert('Fehler', 'Adminrechte konnten nicht übertragen werden');
              console.error('Error transferring ownership:', err);
            }
          },
        },
      ]
    );
  };

  const handleDeleteHousehold = () => {
    if (!isAdmin) {
      Alert.alert(
        'Keine Berechtigung',
        'Nur Administratoren können den Haushalt löschen.'
      );
      return;
    }

    Alert.alert(
      'Haushalt löschen',
      'Möchten Sie wirklich diesen Haushalt und alle zugehörigen Daten unwiderruflich löschen?',
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
              await householdService.deleteHousehold(householdId);
              navigation.goBack();
              Alert.alert('Erfolg', 'Haushalt wurde gelöscht');
            } catch (err) {
              Alert.alert('Fehler', 'Haushalt konnte nicht gelöscht werden');
              console.error('Error deleting household:', err);
            }
          },
        },
      ]
    );
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
    <ScrollView style={styles.container}>
      {/* Allgemeine Einstellungen */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Allgemeine Einstellungen</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingText}>
            <Text style={styles.settingLabel}>Name des Haushalts</Text>
            <Text style={styles.settingDescription}>
              Der Name wird allen Mitgliedern angezeigt
            </Text>
          </View>
          <TextInput
            style={styles.input}
            value={household.name}
            onChangeText={handleNameChange}
            editable={isAdmin}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingText}>
            <Text style={styles.settingLabel}>Einladungen erlauben</Text>
            <Text style={styles.settingDescription}>
              Mitglieder können weitere Personen einladen
            </Text>
          </View>
          <Switch
            value={settings.allowInvites}
            onValueChange={(value) =>
              handleSettingChange('allowInvites', value)
            }
            disabled={!isAdmin}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingText}>
            <Text style={styles.settingLabel}>Listen automatisch teilen</Text>
            <Text style={styles.settingDescription}>
              Neue Listen werden automatisch mit allen geteilt
            </Text>
          </View>
          <Switch
            value={settings.autoShareLists}
            onValueChange={(value) =>
              handleSettingChange('autoShareLists', value)
            }
            disabled={!isAdmin}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingText}>
            <Text style={styles.settingLabel}>Gemeinsames Budget</Text>
            <Text style={styles.settingDescription}>
              Ausgaben werden gemeinsam verwaltet
            </Text>
          </View>
          <Switch
            value={settings.sharedBudget}
            onValueChange={(value) =>
              handleSettingChange('sharedBudget', value)
            }
            disabled={!isAdmin}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingText}>
            <Text style={styles.settingLabel}>Währung</Text>
            <Text style={styles.settingDescription}>
              Wird für alle Ausgaben verwendet
            </Text>
          </View>
          <TextInput
            style={styles.currencyInput}
            value={settings.currency}
            onChangeText={(value) =>
              handleSettingChange('currency', value)
            }
            maxLength={3}
            editable={isAdmin}
          />
        </View>
      </View>

      {/* Mitgliederverwaltung */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mitglieder</Text>
        {household.members.map((member: HouseholdMember) => (
          <View key={member.userId} style={styles.memberItem}>
            <MemberList
              members={[member]}
              showRoles={true}
            />
            {isAdmin && member.role !== 'admin' && (
              <View style={styles.memberActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleTransferOwnership(member)}
                >
                  <MaterialCommunityIcons
                    name="shield-crown"
                    size={20}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.actionText}>Admin</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.removeButton]}
                  onPress={() => handleRemoveMember(member)}
                >
                  <MaterialCommunityIcons
                    name="account-remove"
                    size={20}
                    color={theme.colors.error}
                  />
                  <Text style={[styles.actionText, styles.removeText]}>
                    Entfernen
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Gefahrenzone */}
      {isAdmin && (
        <View style={styles.dangerZone}>
          <Text style={styles.dangerTitle}>Gefahrenzone</Text>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteHousehold}
          >
            <MaterialCommunityIcons
              name="delete"
              size={20}
              color={theme.colors.white}
            />
            <Text style={styles.deleteButtonText}>Haushalt löschen</Text>
          </TouchableOpacity>
          <Text style={styles.dangerDescription}>
            Diese Aktion kann nicht rückgängig gemacht werden.
            Alle Daten werden unwiderruflich gelöscht.
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingText: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  input: {
    backgroundColor: theme.colors.card,
    borderRadius: 8,
    padding: 8,
    minWidth: 120,
    color: theme.colors.text,
  },
  currencyInput: {
    backgroundColor: theme.colors.card,
    borderRadius: 8,
    padding: 8,
    width: 60,
    textAlign: 'center',
    color: theme.colors.text,
  },
  memberItem: {
    marginBottom: 16,
  },
  memberActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginLeft: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.card,
  },
  actionText: {
    marginLeft: 4,
    fontSize: 14,
    color: theme.colors.primary,
  },
  removeButton: {
    backgroundColor: theme.colors.error + '10',
  },
  removeText: {
    color: theme.colors.error,
  },
  dangerZone: {
    padding: 16,
    margin: 16,
    backgroundColor: theme.colors.error + '10',
    borderRadius: 12,
  },
  dangerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.error,
    marginBottom: 16,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.error,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  deleteButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  dangerDescription: {
    fontSize: 12,
    color: theme.colors.error,
    textAlign: 'center',
  },
});