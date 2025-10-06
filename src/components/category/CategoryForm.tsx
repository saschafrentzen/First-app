import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CustomCategory } from '../../types/category';
import { ColorPicker, TagInput, IconPicker } from '../common';

interface CategoryFormProps {
  category?: CustomCategory;
  onSave: (category: Partial<CustomCategory>) => void;
  onCancel: () => void;
  availableParentCategories?: CustomCategory[];
}

export const CategoryForm: React.FC<CategoryFormProps> = ({
  category,
  onSave,
  onCancel,
  availableParentCategories = [],
}) => {
  const [name, setName] = useState(category?.name || '');
  const [color, setColor] = useState(category?.color || '#000000');
  const [icon, setIcon] = useState(category?.icon || '');
  const [description, setDescription] = useState(category?.metadata?.description || '');
  const [tags, setTags] = useState<string[]>(category?.tags || []);
  const [parentCategory, setParentCategory] = useState(category?.parentCategory);
  const [isPublic, setIsPublic] = useState(category?.permissions?.public || false);
  const [customFields, setCustomFields] = useState<Record<string, string>>(
    category?.metadata?.customFields || {}
  );

  const handleSubmit = () => {
    const updatedCategory: Partial<CustomCategory> = {
      name,
      color,
      icon,
      parentCategory,
      tags,
      metadata: {
        description,
        customFields,
      },
      permissions: {
        public: isPublic,
        owner: category?.permissions?.owner || 'current-user', // Sollte vom Auth-System kommen
        sharedWith: category?.permissions?.sharedWith || [],
        role: category?.permissions?.role || 'admin',
      },
      status: category?.status || 'active',
    };

    onSave(updatedCategory);
  };

  const addCustomField = () => {
    setCustomFields(prev => ({
      ...prev,
      [`field_${Object.keys(prev).length + 1}`]: '',
    }));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Grundlegende Informationen</Text>
        
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Kategoriename"
        />

        <Text style={styles.label}>Farbe</Text>
        <ColorPicker
          selectedColor={color}
          onSelectColor={setColor}
        />

        <Text style={styles.label}>Icon</Text>
        <IconPicker
          selectedIcon={icon}
          onSelectIcon={setIcon}
        />

        <Text style={styles.label}>Beschreibung</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Beschreibung der Kategorie"
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hierarchie</Text>
        
        <Text style={styles.label}>Übergeordnete Kategorie</Text>
        <View style={styles.parentCategoryContainer}>
          {availableParentCategories.map(parent => (
            <TouchableOpacity
              key={parent.id}
              style={[
                styles.parentCategoryOption,
                parentCategory === parent.id && styles.selectedParentCategory,
              ]}
              onPress={() => setParentCategory(parent.id)}
            >
              <Text style={styles.parentCategoryText}>{parent.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tags</Text>
        <TagInput
          tags={tags}
          onChangeTags={setTags}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Berechtigungen</Text>
        
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Öffentlich sichtbar</Text>
          <Switch
            value={isPublic}
            onValueChange={setIsPublic}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Benutzerdefinierte Felder</Text>
        
        {Object.entries(customFields).map(([key, value]) => (
          <View key={key} style={styles.customFieldContainer}>
            <TextInput
              style={[styles.input, styles.customFieldInput]}
              value={key}
              placeholder="Feldname"
              onChangeText={(newKey) => {
                const newFields = { ...customFields };
                delete newFields[key];
                newFields[newKey] = value;
                setCustomFields(newFields);
              }}
            />
            <TextInput
              style={[styles.input, styles.customFieldInput]}
              value={value}
              placeholder="Wert"
              onChangeText={(newValue) => {
                setCustomFields(prev => ({
                  ...prev,
                  [key]: newValue,
                }));
              }}
            />
            <TouchableOpacity
              onPress={() => {
                const newFields = { ...customFields };
                delete newFields[key];
                setCustomFields(newFields);
              }}
            >
              <MaterialCommunityIcons name="delete" size={24} color="#ff4444" />
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity
          style={styles.addFieldButton}
          onPress={addCustomField}
        >
          <MaterialCommunityIcons name="plus" size={24} color="#2196f3" />
          <Text style={styles.addFieldText}>Neues Feld hinzufügen</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={onCancel}
        >
          <Text style={styles.buttonText}>Abbrechen</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={handleSubmit}
        >
          <Text style={[styles.buttonText, styles.saveButtonText]}>Speichern</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  parentCategoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  parentCategoryOption: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  selectedParentCategory: {
    backgroundColor: '#2196f3',
  },
  parentCategoryText: {
    color: '#333',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
  },
  customFieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  customFieldInput: {
    flex: 1,
  },
  addFieldButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    gap: 8,
  },
  addFieldText: {
    color: '#2196f3',
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginTop: 24,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  saveButton: {
    backgroundColor: '#2196f3',
  },
  buttonText: {
    fontSize: 16,
    color: '#333',
  },
  saveButtonText: {
    color: '#fff',
  },
});