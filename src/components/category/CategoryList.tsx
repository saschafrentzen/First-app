import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from 'react-native-paper';
import { CustomCategory } from '../../types/category';
import { categoryService } from '../../services/categoryService';
import { CategoryExport } from './CategoryExport';
import { CategoryImport } from './CategoryImport';

interface CategoryListProps {
  categories: CustomCategory[];
  onSelectCategory?: (category: CustomCategory) => void;
  onMoveCategory?: (categoryId: string, newParentId?: string) => void;
  multiSelect?: boolean;
}

interface CategoryItemProps {
  category: CustomCategory;
  level: number;
  isExpanded: boolean;
  onToggle: () => void;
  onSelect: () => void;
  isSelected: boolean;
  children?: React.ReactNode;
}

const CategoryItem: React.FC<CategoryItemProps> = ({
  category,
  level,
  isExpanded,
  onToggle,
  onSelect,
  isSelected,
  children,
}) => {
  const hasChildren = (category.subCategories?.length ?? 0) > 0;

  return (
    <View>
      <TouchableOpacity
        style={[
          styles.categoryItem,
          { marginLeft: level * 20 },
          isSelected && styles.selectedItem,
        ]}
        onPress={onSelect}
        onLongPress={onToggle}
      >
        <View style={styles.categoryHeader}>
          {hasChildren && (
            <TouchableOpacity onPress={onToggle} style={styles.expandButton}>
              <MaterialCommunityIcons
                name={isExpanded ? 'chevron-down' : 'chevron-right'}
                size={24}
                color="#666"
              />
            </TouchableOpacity>
          )}
          
          {category.icon && (
            <MaterialCommunityIcons
              name={category.icon as any}
              size={24}
              color={category.color}
              style={styles.categoryIcon}
            />
          )}
          
          <Text style={styles.categoryName}>{category.name}</Text>
          
          {category.status === 'archived' && (
            <MaterialCommunityIcons
              name="archive"
              size={16}
              color="#999"
              style={styles.statusIcon}
            />
          )}
        </View>

        {category.tags && category.tags.length > 0 && (
          <View style={styles.tagContainer}>
            {category.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>

      {isExpanded && children}
    </View>
  );
};

export const CategoryList: React.FC<CategoryListProps> = ({
  categories,
  onSelectCategory,
  onMoveCategory,
  multiSelect = false,
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'level' | 'lastModified'>('name');
  const [isExportDialogVisible, setIsExportDialogVisible] = useState(false);
  const [isImportDialogVisible, setIsImportDialogVisible] = useState(false);

  const toggleExpanded = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const handleSelect = (category: CustomCategory) => {
    if (multiSelect) {
      setSelectedCategories(prev => {
        const next = new Set(prev);
        if (next.has(category.id)) {
          next.delete(category.id);
        } else {
          next.add(category.id);
        }
        return next;
      });
    }
    onSelectCategory?.(category);
  };

  const handleImportComplete = async (result: { imported: number; skipped: number; errors: Array<{ id: string; error: string }> }) => {
    if (result.imported > 0) {
      await categoryService.reloadCategories();
    }
    setIsImportDialogVisible(false);
  };

  const filteredCategories = useMemo(() => {
    return categories.filter(category => {
      const matchesSearch = category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesSearch;
    });
  }, [categories, searchQuery]);

  const sortedCategories = useMemo(() => {
    return [...filteredCategories].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'level':
          return a.level - b.level;
        case 'lastModified':
          return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
        default:
          return 0;
      }
    });
  }, [filteredCategories, sortBy]);

  const renderCategoryTree = useCallback((categoryList: CustomCategory[], parentId?: string) => {
    return categoryList
      .filter(cat => cat.parentCategory === parentId)
      .map(category => (
        <CategoryItem
          key={category.id}
          category={category}
          level={category.level}
          isExpanded={expandedCategories.has(category.id)}
          onToggle={() => toggleExpanded(category.id)}
          onSelect={() => handleSelect(category)}
          isSelected={selectedCategories.has(category.id)}
        >
          {expandedCategories.has(category.id) &&
            renderCategoryTree(categoryList, category.id)}
        </CategoryItem>
      ));
  }, [expandedCategories, selectedCategories, handleSelect]);

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Kategorien durchsuchen..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => {
            setSortBy(current => {
              switch (current) {
                case 'name':
                  return 'level';
                case 'level':
                  return 'lastModified';
                default:
                  return 'name';
              }
            });
          }}
        >
          <MaterialCommunityIcons
            name="sort"
            size={24}
            color="#666"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.actionBar}>
        <Button
          mode="contained"
          onPress={() => setIsImportDialogVisible(true)}
          icon={() => <MaterialCommunityIcons name="file-import" size={20} color="white" />}
        >
          Importieren
        </Button>
        <Button
          mode="contained"
          onPress={() => setIsExportDialogVisible(true)}
          icon={() => <MaterialCommunityIcons name="file-export" size={20} color="white" />}
          disabled={selectedCategories.size === 0}
          style={styles.exportButton}
        >
          Exportieren
        </Button>
      </View>

      <CategoryExport
        visible={isExportDialogVisible}
        onDismiss={() => setIsExportDialogVisible(false)}
        selectedCategories={Array.from(selectedCategories)}
      />

      <CategoryImport
        visible={isImportDialogVisible}
        onDismiss={() => setIsImportDialogVisible(false)}
        onImportComplete={handleImportComplete}
      />

      <FlatList
        data={[{ id: 'root' }]}
        keyExtractor={item => item.id}
        renderItem={() => (
          <View>{renderCategoryTree(sortedCategories)}</View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 10,
    gap: 10,
  },
  exportButton: {
    marginLeft: 10,
  },
  searchBar: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  sortButton: {
    padding: 5,
  },
  categoryItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedItem: {
    backgroundColor: '#e3f2fd',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expandButton: {
    padding: 5,
    marginRight: 5,
  },
  categoryIcon: {
    marginRight: 10,
  },
  categoryName: {
    flex: 1,
    fontSize: 16,
  },
  statusIcon: {
    marginLeft: 10,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  tag: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingVertical: 2,
    paddingHorizontal: 8,
    marginRight: 5,
    marginTop: 2,
  },
  tagText: {
    fontSize: 12,
    color: '#666',
  },
});