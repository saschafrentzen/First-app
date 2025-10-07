import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Household } from '../../services/HouseholdService';
import { theme } from '../../theme';

interface CreateHouseholdModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (name: string, settings: Household['settings']) => Promise<void>;
}

export const CreateHouseholdModal: React.FC<CreateHouseholdModalProps> = ({
  visible,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState('');
  const [allowInvites, setAllowInvites] = useState(true);
  const [autoShareLists, setAutoShareLists] = useState(false);
  const [sharedBudget, setSharedBudget] = useState(false);
  const [currency, setCurrency] = useState('EUR');

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Fehler', 'Bitte geben Sie einen Namen ein');
      return;
    }

    const settings: Household['settings'] = {
      allowInvites,
      autoShareLists,
      sharedBudget,
      currency,
    };

    try {
      await onCreate(name.trim(), settings);
      resetForm();
    } catch (error) {
      console.error('Error in create household modal:', error);
    }
  };

  const resetForm = () => {
    setName('');
    setAllowInvites(true);
    setAutoShareLists(false);
    setSharedBudget(false);
    setCurrency('EUR');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Neuer Haushalt</Text>
            <TouchableOpacity onPress={handleClose}>
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={theme.colors.text}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Name des Haushalts</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="z.B. Meine Familie"
              placeholderTextColor={theme.colors.textSecondary}
            />

            <Text style={styles.sectionTitle}>Einstellungen</Text>

            <View style={styles.settingItem}>
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Einladungen erlauben</Text>
                <Text style={styles.settingDescription}>
                  Mitglieder können weitere Personen einladen
                </Text>
              </View>
              <Switch
                value={allowInvites}
                onValueChange={setAllowInvites}
                trackColor={{
                  false: theme.colors.grey,
                  true: theme.colors.primary,
                }}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Listen automatisch teilen</Text>
                <Text style={styles.settingDescription}>
                  Neue Listen werden automatisch mit allen Mitgliedern geteilt
                </Text>
              </View>
              <Switch
                value={autoShareLists}
                onValueChange={setAutoShareLists}
                trackColor={{
                  false: theme.colors.grey,
                  true: theme.colors.primary,
                }}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Gemeinsames Budget</Text>
                <Text style={styles.settingDescription}>
                  Budget und Ausgaben werden gemeinsam verwaltet
                </Text>
              </View>
              <Switch
                value={sharedBudget}
                onValueChange={setSharedBudget}
                trackColor={{
                  false: theme.colors.grey,
                  true: theme.colors.primary,
                }}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Währung</Text>
                <Text style={styles.settingDescription}>
                  Standardwährung für den Haushalt
                </Text>
              </View>
              <TextInput
                style={styles.currencyInput}
                value={currency}
                onChangeText={setCurrency}
                placeholder="EUR"
                maxLength={3}
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreate}
          >
            <Text style={styles.createButtonText}>Haushalt erstellen</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  form: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.colors.card,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 24,
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
  currencyInput: {
    backgroundColor: theme.colors.card,
    borderRadius: 8,
    padding: 8,
    width: 60,
    textAlign: 'center',
    fontSize: 16,
    color: theme.colors.text,
  },
  createButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  createButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});