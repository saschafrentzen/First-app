import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import ColorPicker from 'react-native-wheel-color-picker';
import { CustomCategory, CategoryStats } from '../types/category';
import { categoryService } from '../services/categoryService';
import { useTheme } from '../hooks/useTheme';

interface CategoryTreeViewProps {
  categories: CustomCategory[];
  selectedCategory?: string;
  onSelect: (category: CustomCategory) => void;
}

const CategoryTreeView: React.FC<CategoryTreeViewProps> = ({
  categories,
  selectedCategory,
  onSelect,
}) => {
  const { theme } = useTheme();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const toggleNode = (categoryId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedNodes(newExpanded);
  };

  const renderCategory = (category: CustomCategory, level: number = 0) => {
    const hasChildren = categories.some(cat => cat.parentCategory === category.id);
    const isExpanded = expandedNodes.has(category.id);
    const isSelected = selectedCategory === category.id;

    return (
      <View key={category.id}>
        <TouchableOpacity
          style={[
            styles.categoryItem,
            { marginLeft: level * 20 },
            isSelected && { backgroundColor: theme.primaryLight },
          ]}
          onPress={() => onSelect(category)}
        >
          <View style={styles.categoryHeader}>
            {hasChildren && (
              <TouchableOpacity
                onPress={() => toggleNode(category.id)}
                style={styles.expandButton}
              >
                <MaterialCommunityIcons
                  name={isExpanded ? 'chevron-down' : 'chevron-right'}
                  size={24}
                  color={theme.text}
                />
              </TouchableOpacity>
            )}
            {category.icon && (
              <MaterialCommunityIcons
                name={category.icon as any}
                size={24}
                color={category.color}
                style={styles.icon}
              />
            )}
            <View style={styles.categoryInfo}>
              <Text style={[styles.categoryName, { color: theme.text }]}>
                {category.name}
              </Text>
              {category.description && (
                <Text style={[styles.categoryDescription, { color: theme.textLight }]}>
                  {category.description}
                </Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
        {isExpanded &&
          categories
            .filter(cat => cat.parentCategory === category.id)
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map(child => renderCategory(child, level + 1))}
      </View>
    );
  };

  const rootCategories = categories
    .filter(cat => !cat.parentCategory)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  return <View>{rootCategories.map(cat => renderCategory(cat))}</View>;
};

interface CategoryManagerProps {
  onCategorySelect?: (category: CustomCategory) => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({ onCategorySelect }) => {
  const { theme } = useTheme();
  const [categories, setCategories] = useState<CustomCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CustomCategory | undefined>();
  const [categoryStats, setCategoryStats] = useState<CategoryStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const cats = await categoryService.getAllCategories();
      setCategories(cats);
      updateCategoryStats(cats);
    } catch (error) {
      Alert.alert('Fehler', 'Kategorien konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  };

  const updateCategoryStats = (cats: CustomCategory[]) => {
    const stats: CategoryStats = {
      totalCategories: cats.length,
      maxDepth: 0,
      categoriesPerLevel: new Map(),
      orphanedCategories: [],
    };

    const calculateDepth = (categoryId: string, currentDepth: number = 0): number => {
      const category = cats.find(c => c.id === categoryId);
      if (!category || !category.parentCategory) return currentDepth;
      return calculateDepth(category.parentCategory, currentDepth + 1);
    };

    cats.forEach(cat => {
      const depth = calculateDepth(cat.id);
      stats.maxDepth = Math.max(stats.maxDepth, depth);
      
      const levelCount = stats.categoriesPerLevel.get(depth) || 0;
      stats.categoriesPerLevel.set(depth, levelCount + 1);

      if (cat.parentCategory && !cats.some(c => c.id === cat.parentCategory)) {
        stats.orphanedCategories.push(cat.id);
      }
    });

    setCategoryStats(stats);
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync();
      
      if (result.assets && result.assets.length > 0) {
        const fileContent = await fetch(result.assets[0].uri).then(res => res.text());
        await categoryService.importCategories(JSON.parse(fileContent));
        await loadCategories();
        Alert.alert('Erfolg', 'Kategorien wurden erfolgreich importiert.');
      }
    } catch (error) {
      Alert.alert('Fehler', 'Kategorien konnten nicht importiert werden.');
    }
  };

  const handleExport = async () => {
    try {
      await categoryService.exportCategories();
      Alert.alert('Erfolg', 'Kategorien wurden erfolgreich exportiert.');
    } catch (error) {
      Alert.alert('Fehler', 'Kategorien konnten nicht exportiert werden.');
    }
  };

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: theme.backgroundLight }]}
          placeholder="Kategorien durchsuchen..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={theme.textLight}
        />
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={handleImport}
          >
            <Text style={[styles.buttonText, { color: theme.textInverted }]}>
              Importieren
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={handleExport}
          >
            <Text style={[styles.buttonText, { color: theme.textInverted }]}>
              Exportieren
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {categoryStats && (
        <View style={styles.statsContainer}>
          <Text style={[styles.statsText, { color: theme.text }]}>
            Gesamt: {categoryStats.totalCategories} Kategorien
          </Text>
          <Text style={[styles.statsText, { color: theme.text }]}>
            Max. Tiefe: {categoryStats.maxDepth}
          </Text>
        </View>
      )}

      <ScrollView style={styles.treeContainer}>
        <CategoryTreeView
          categories={filteredCategories}
          selectedCategory={selectedCategory?.id}
          onSelect={(category) => {
            setSelectedCategory(category);
            onCategorySelect?.(category);
          }}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
  },
  searchInput: {
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    padding: 8,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: 'bold',
  },
  treeContainer: {
    flex: 1,
  },
  categoryItem: {
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expandButton: {
    padding: 4,
  },
  icon: {
    marginRight: 8,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
  },
  categoryDescription: {
    fontSize: 12,
  },
  statsContainer: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statsText: {
    fontSize: 12,
  },
});

export default CategoryManager;