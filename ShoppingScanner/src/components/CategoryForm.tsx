import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ColorPicker from 'react-native-wheel-color-picker';
import { CustomCategory, categoryService } from '../services/categoryService';
import { useTheme } from '../hooks/useTheme';

interface CategoryFormProps {
  initialCategory?: Partial<CustomCategory>;
  onSave: (category: Omit<CustomCategory, 'id' | 'createdAt' | 'lastModified'>) => void;
  onCancel: () => void;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({ initialCategory, onSave, onCancel }) => {
  const [name, setName] = useState(initialCategory?.name || '');
  const [color, setColor] = useState(initialCategory?.color || '#000000');
  const [icon, setIcon] = useState(initialCategory?.icon || '');
  const [parentCategory, setParentCategory] = useState<string | undefined>(initialCategory?.parentCategory);
  const [categories, setCategories] = useState<CustomCategory[]>([]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const allCategories = await categoryService.getAllCategories();
      setCategories(allCategories);
    } catch (error) {
      console.error('Fehler beim Laden der Kategorien:', error);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      // TODO: Show error message
      return;
    }

    onSave({
      name: name.trim(),
      color,
      icon,
      parentCategory,
    });
  };

  const icons = [
    'food', 'home', 'shower', 'cart', 'cash', 'clothes', 
    'car', 'medical-bag', 'book', 'gamepad', 'gift', 'tools'
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.form}>
        <Text style={[styles.label, { color: theme.text }]}>Name</Text>
        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.border }]}
          value={name}
          onChangeText={setName}
          placeholder="Kategoriename"
          placeholderTextColor={theme.textSecondary}
        />

        <Text style={[styles.label, { color: theme.text }]}>Farbe</Text>
        <TouchableOpacity
          style={[styles.colorPreview, { backgroundColor: color }]}
          onPress={() => setShowColorPicker(!showColorPicker)}
        />
        
        {showColorPicker && (
          <View style={styles.colorPicker}>
            <ColorPicker
              color={color}
              onColorChange={setColor}
              thumbSize={30}
              sliderSize={30}
              noSnap={true}
              row={false}
            />
          </View>
        )}

        <Text style={[styles.label, { color: theme.text }]}>Icon</Text>
        <TouchableOpacity
          style={[styles.iconButton, { borderColor: theme.border }]}
          onPress={() => setShowIconPicker(!showIconPicker)}
        >
          {icon ? (
            <MaterialCommunityIcons name={icon} size={24} color={theme.text} />
          ) : (
            <Text style={{ color: theme.textSecondary }}>Icon auswählen</Text>
          )}
        </TouchableOpacity>

        {showIconPicker && (
          <View style={styles.iconGrid}>
            {icons.map((iconName) => (
              <TouchableOpacity
                key={iconName}
                style={[
                  styles.iconOption,
                  { borderColor: icon === iconName ? color : 'transparent' }
                ]}
                onPress={() => {
                  setIcon(iconName);
                  setShowIconPicker(false);
                }}
              >
                <MaterialCommunityIcons
                  name={iconName}
                  size={24}
                  color={theme.text}
                />
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={[styles.label, { color: theme.text }]}>Übergeordnete Kategorie (optional)</Text>
        <View style={styles.categoryList}>
          {categories
            .filter(cat => cat.id !== initialCategory?.id)
            .map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryOption,
                  {
                    backgroundColor: parentCategory === cat.id ? cat.color : 'transparent',
                    borderColor: cat.color,
                  }
                ]}
                onPress={() => setParentCategory(cat.id)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    { color: parentCategory === cat.id ? '#fff' : cat.color }
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
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
            onPress={handleSave}
          >
            <Text style={styles.buttonText}>Speichern</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  colorPreview: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 16,
  },
  colorPicker: {
    height: 200,
    marginBottom: 16,
  },
  iconButton: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  iconOption: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 8,
    margin: 4,
  },
  categoryList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  categoryOption: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 12,
    margin: 4,
  },
  categoryText: {
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#ccc',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});