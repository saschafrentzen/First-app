import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CustomCategory, categoryService } from '../services/categoryService';
import { CategoryForm } from '../components/CategoryForm';
import { useTheme } from '../hooks/useTheme';

export const CategoryManagerScreen = () => {
  const [categories, setCategories] = useState<CustomCategory[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CustomCategory | undefined>();
  const { theme } = useTheme();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const allCategories = await categoryService.getAllCategories();
      setCategories(allCategories);
    } catch (error) {
      Alert.alert('Fehler', 'Kategorien konnten nicht geladen werden.');
    }
  };

  const handleCreateCategory = async (category: Omit<CustomCategory, 'id' | 'createdAt' | 'lastModified'>) => {
    try {
      await categoryService.createCategory(category);
      setShowForm(false);
      loadCategories();
    } catch (error) {
      Alert.alert('Fehler', 'Kategorie konnte nicht erstellt werden.');
    }
  };

  const handleUpdateCategory = async (category: Omit<CustomCategory, 'id' | 'createdAt' | 'lastModified'>) => {
    if (!editingCategory) return;

    try {
      await categoryService.updateCategory(editingCategory.id, category);
      setShowForm(false);
      setEditingCategory(undefined);
      loadCategories();
    } catch (error) {
      Alert.alert('Fehler', 'Kategorie konnte nicht aktualisiert werden.');
    }
  };

  const handleDeleteCategory = async (category: CustomCategory) => {
    Alert.alert(
      'Kategorie löschen',
      'Möchten Sie diese Kategorie wirklich löschen?',
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
              await categoryService.deleteCategory(category.id);
              loadCategories();
            } catch (error) {
              if (error instanceof Error) {
                Alert.alert('Fehler', error.message);
              } else {
                Alert.alert('Fehler', 'Kategorie konnte nicht gelöscht werden.');
              }
            }
          },
        },
      ],
    );
  };

  const renderCategory = ({ item }: { item: CustomCategory }) => {
    const hasParent = !!item.parentCategory;
    const parent = categories.find(cat => cat.id === item.parentCategory);

    return (
      <TouchableOpacity
        style={[
          styles.categoryItem,
          { borderColor: theme.border },
          hasParent && { marginLeft: 20 }
        ]}
        onPress={() => {
          setEditingCategory(item);
          setShowForm(true);
        }}
      >
        <View style={styles.categoryHeader}>
          <View style={styles.categoryInfo}>
            {item.icon && (
              <MaterialCommunityIcons
                name={item.icon as any}
                size={24}
                color={item.color}
                style={styles.icon}
              />
            )}
            <View>
              <Text style={[styles.categoryName, { color: theme.text }]}>
                {item.name}
              </Text>
              {parent && (
                <Text style={[styles.parentName, { color: theme.textSecondary }]}>
                  Unterkategorie von: {parent.name}
                </Text>
              )}
            </View>
          </View>
          <TouchableOpacity
            onPress={() => handleDeleteCategory(item)}
            style={styles.deleteButton}
          >
            <MaterialCommunityIcons name="delete" size={24} color={theme.error} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (showForm) {
    return (
      <CategoryForm
        initialCategory={editingCategory}
        onSave={editingCategory ? handleUpdateCategory : handleCreateCategory}
        onCancel={() => {
          setShowForm(false);
          setEditingCategory(undefined);
        }}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: theme.primary }]}
        onPress={() => setShowForm(true)}
      >
        <MaterialCommunityIcons name="plus" size={24} color="#fff" />
        <Text style={styles.addButtonText}>Neue Kategorie</Text>
      </TouchableOpacity>

      <FlatList
        data={categories}
        renderItem={renderCategory}
        keyExtractor={item => item.id}
        ItemSeparatorComponent={() => (
          <View
            style={[styles.separator, { backgroundColor: theme.border }]}
          />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
  },
  categoryItem: {
    padding: 16,
    borderBottomWidth: 1,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
  },
  parentName: {
    fontSize: 12,
    marginTop: 4,
  },
  deleteButton: {
    padding: 8,
  },
  separator: {
    height: 1,
  },
});