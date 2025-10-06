import { CustomCategory, CategoryRule } from '../types/category';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { historyAnalysisService } from './historyAnalysis.service';
import { CategorySuggestion } from '../types/shoppingHistory';

class CategoryService {
  private static instance: CategoryService;
  private categories: Map<string, CustomCategory> = new Map();
  private rules: Map<string, CategoryRule> = new Map();

  private constructor() {
    this.loadCategories();
    this.loadRules();
  }

  static getInstance(): CategoryService {
    if (!CategoryService.instance) {
      CategoryService.instance = new CategoryService();
    }
    return CategoryService.instance;
  }

  // Basis-Kategorieverwaltung
  async createCategory(category: Omit<CustomCategory, 'id' | 'createdAt' | 'lastModified'>): Promise<CustomCategory> {
    const newCategory: CustomCategory = {
      ...category,
      id: `cat_${Date.now()}`,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      path: this.calculatePath(category.parentCategory),
      level: this.calculateLevel(category.parentCategory),
      tags: category.tags || [],
      status: 'active'
    };

    this.categories.set(newCategory.id, newCategory);
    await this.saveCategories();
    return newCategory;
  }

  // Hierarchieverwaltung
  private calculatePath(parentId?: string): string[] {
    if (!parentId) return [];
    const parent = this.categories.get(parentId);
    if (!parent) return [];
    return [...parent.path, parentId];
  }

  private calculateLevel(parentId?: string): number {
    if (!parentId) return 0;
    const parent = this.categories.get(parentId);
    if (!parent) return 0;
    return parent.level + 1;
  }

  async moveCategory(categoryId: string, newParentId?: string): Promise<void> {
    const category = this.categories.get(categoryId);
    if (!category) throw new Error('Kategorie nicht gefunden');

    // Zyklische Abhängigkeiten verhindern
    if (newParentId && this.wouldCreateCycle(categoryId, newParentId)) {
      throw new Error('Verschiebung würde zyklische Abhängigkeit erzeugen');
    }

    category.parentCategory = newParentId;
    category.path = this.calculatePath(newParentId);
    category.level = this.calculateLevel(newParentId);
    category.lastModified = new Date().toISOString();

    // Alle Unterkategorien aktualisieren
    await this.updateSubcategoriesPaths(categoryId);
    await this.saveCategories();
  }

  private wouldCreateCycle(categoryId: string, newParentId: string): boolean {
    let current = newParentId;
    while (current) {
      if (current === categoryId) return true;
      const parent = this.categories.get(current);
      if (!parent?.parentCategory) break;
      current = parent.parentCategory;
    }
    return false;
  }

  private async updateSubcategoriesPaths(categoryId: string) {
    const category = this.categories.get(categoryId);
    if (!category?.subCategories) return;

    for (const subCatId of category.subCategories) {
      const subCat = this.categories.get(subCatId);
      if (subCat) {
        subCat.path = this.calculatePath(subCat.parentCategory);
        subCat.level = this.calculateLevel(subCat.parentCategory);
        await this.updateSubcategoriesPaths(subCat.id);
      }
    }
  }

  // Regelbasierte Kategorisierung
  private validateRule(rule: Partial<CategoryRule>): void {
    if (!rule.condition) {
      throw new Error('Regel muss eine Bedingung enthalten');
    }

    if (!rule.condition.operator || !rule.condition.value) {
      throw new Error('Regelbedingung muss einen Operator und einen Wert enthalten');
    }

    const validOperators = ['contains', 'equals', 'startsWith', 'endsWith', 'regex'];
    if (!validOperators.includes(rule.condition.operator)) {
      throw new Error(`Ungültiger Operator. Erlaubte Werte sind: ${validOperators.join(', ')}`);
    }

    if (rule.condition.operator === 'regex') {
      try {
        new RegExp(rule.condition.value);
      } catch {
        throw new Error('Ungültiger regulärer Ausdruck');
      }
    }

    if (typeof rule.priority !== 'number' || rule.priority < 0) {
      throw new Error('Priorität muss eine positive Zahl sein');
    }

    if (rule.isActive !== undefined && typeof rule.isActive !== 'boolean') {
      throw new Error('isActive muss ein Boolean-Wert sein');
    }
  }

  async addCategoryRule(rule: Omit<CategoryRule, 'id' | 'createdAt'>): Promise<CategoryRule> {
    try {
      this.validateRule(rule);
      
      const newRule: CategoryRule = {
        ...rule,
        id: `rule_${Date.now()}`,
        createdAt: new Date().toISOString()
      };

      this.rules.set(newRule.id, newRule);
      await this.saveRules();
      return newRule;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Fehler beim Erstellen der Regel');
    }
  }

  async findMatchingCategory(text: string): Promise<CustomCategory | null> {
    try {
      const activeRules = Array.from(this.rules.values())
        .filter(rule => rule.isActive)
        .sort((a, b) => b.priority - a.priority);

      for (const rule of activeRules) {
        const matches = this.testRule(text, rule);
        if (matches) {
          // Finde die erste aktive Kategorie, die der Regel entspricht
          const matchingCategory = Array.from(this.categories.values())
            .find(cat => 
              cat.status === 'active' && 
              cat.metadata?.rules?.some(r => r.id === rule.id)
            );
          
          if (matchingCategory) {
            return matchingCategory;
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Fehler beim Suchen der passenden Kategorie:', error);
      return null;
    }
  }

  private testRule(text: string, rule: CategoryRule): boolean {
    const { operator, value } = rule.condition;
    switch (operator) {
      case 'contains':
        return text.toLowerCase().includes(value.toLowerCase());
      case 'equals':
        return text.toLowerCase() === value.toLowerCase();
      case 'startsWith':
        return text.toLowerCase().startsWith(value.toLowerCase());
      case 'endsWith':
        return text.toLowerCase().endsWith(value.toLowerCase());
      case 'regex':
        try {
          return new RegExp(value, 'i').test(text);
        } catch {
          return false;
        }
      default:
        return false;
    }
  }

  // Archivierung
  async archiveCategory(categoryId: string): Promise<void> {
    const category = this.categories.get(categoryId);
    if (!category) throw new Error('Kategorie nicht gefunden');

    category.status = 'archived';
    category.lastModified = new Date().toISOString();

    // Optional: Automatisch alle Unterkategorien archivieren
    if (category.subCategories) {
      for (const subCatId of category.subCategories) {
        await this.archiveCategory(subCatId);
      }
    }

    await this.saveCategories();
  }

  // Berechtigungen
  async updateCategoryPermissions(
    categoryId: string,
    permissions: CustomCategory['permissions']
  ): Promise<void> {
    const category = this.categories.get(categoryId);
    if (!category) throw new Error('Kategorie nicht gefunden');

    category.permissions = permissions;
    category.lastModified = new Date().toISOString();
    await this.saveCategories();
  }

  // Persistenz
  private async loadCategories() {
    try {
      const data = await AsyncStorage.getItem('categories');
      if (data) {
        const categories = JSON.parse(data);
        this.categories = new Map(Object.entries(categories));
      }
    } catch (error) {
      console.error('Fehler beim Laden der Kategorien:', error);
    }
  }

  // Öffentliche Methode zum Neuladen der Kategorien
  async reloadCategories(): Promise<void> {
    await this.loadCategories();
  }

  private async saveCategories() {
    try {
      const data = Object.fromEntries(this.categories);
      await AsyncStorage.setItem('categories', JSON.stringify(data));
    } catch (error) {
      console.error('Fehler beim Speichern der Kategorien:', error);
    }
  }

  private async loadRules() {
    try {
      const data = await AsyncStorage.getItem('category_rules');
      if (data) {
        const rules = JSON.parse(data);
        this.rules = new Map(Object.entries(rules));
      }
    } catch (error) {
      console.error('Fehler beim Laden der Regeln:', error);
    }
  }

  private async saveRules() {
    try {
      const data = Object.fromEntries(this.rules);
      await AsyncStorage.setItem('category_rules', JSON.stringify(data));
    } catch (error) {
      console.error('Fehler beim Speichern der Regeln:', error);
    }
  }

  // Import/Export Funktionen
  async exportCategories(options: {
    format: 'json' | 'csv';
    includeRules?: boolean;
    includeMetadata?: boolean;
  }): Promise<string> {
    const categories = Array.from(this.categories.values());
    const rules = options.includeRules ? Array.from(this.rules.values()) : [];

    if (options.format === 'json') {
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        categories: categories.map(cat => ({
          ...cat,
          metadata: options.includeMetadata ? cat.metadata : undefined
        })),
        rules: options.includeRules ? rules : undefined
      };
      return JSON.stringify(exportData, null, 2);
    } else {
      // CSV Format
      const headers = [
        'id',
        'name',
        'color',
        'icon',
        'parentCategory',
        'level',
        'tags',
        'status'
      ];
      
      const csvData = categories.map(cat => [
        cat.id,
        cat.name,
        cat.color,
        cat.icon || '',
        cat.parentCategory || '',
        cat.level.toString(),
        cat.tags.join(';'),
        cat.status
      ]);

      const csvRows = [
        headers.join(','),
        ...csvData.map(row => row.map(cell => 
          typeof cell === 'string' ? `"${cell.replace(/"/g, '""')}"` : cell
        ).join(','))
      ];

      return csvRows.join('\n');
    }
  }

  async importCategories(data: string, format: 'json' | 'csv', options: {
    conflictResolution: 'skip' | 'overwrite' | 'rename';
    validateHierarchy?: boolean;
    importRules?: boolean;
  }): Promise<{
    imported: number;
    skipped: number;
    errors: Array<{ id: string; error: string }>;
  }> {
    const result = {
      imported: 0,
      skipped: 0,
      errors: [] as Array<{ id: string; error: string }>
    };

    try {
      if (format === 'json') {
        const importData = JSON.parse(data);
        
        // Validiere Version und Format
        if (!importData.categories || !Array.isArray(importData.categories)) {
          throw new Error('Ungültiges Import-Format');
        }

        // Importiere Regeln zuerst, wenn gewünscht
        if (options.importRules && importData.rules) {
          for (const rule of importData.rules) {
            try {
              // Validiere die Regel vor dem Import
              this.validateRule(rule);
              
              // Prüfe auf Duplikate
              const existingRule = Array.from(this.rules.values())
                .find(r => r.condition.operator === rule.condition.operator && 
                          r.condition.value === rule.condition.value);
              
              if (existingRule) {
                result.errors.push({
                  id: rule.id,
                  error: `Eine ähnliche Regel existiert bereits (ID: ${existingRule.id})`
                });
                continue;
              }
              
              await this.addCategoryRule(rule);
            } catch (error) {
              result.errors.push({
                id: rule.id || 'unbekannt',
                error: `Fehler beim Importieren der Regel: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
              });
            }
          }
        }

        // Importiere Kategorien
        for (const cat of importData.categories) {
          try {
            const exists = this.categories.has(cat.id);
            
            if (exists && options.conflictResolution === 'skip') {
              result.skipped++;
              continue;
            }

            if (exists && options.conflictResolution === 'rename') {
              cat.id = `${cat.id}_imported_${Date.now()}`;
              cat.name = `${cat.name} (Importiert)`;
            }

            // Validiere Hierarchie
            if (options.validateHierarchy && cat.parentCategory) {
              const parentExists = this.categories.has(cat.parentCategory);
              if (!parentExists) {
                result.errors.push({
                  id: cat.id,
                  error: 'Übergeordnete Kategorie nicht gefunden'
                });
                continue;
              }
            }

            this.categories.set(cat.id, cat);
            result.imported++;
          } catch (error) {
            result.errors.push({
              id: cat.id,
              error: error instanceof Error ? `Import fehlgeschlagen: ${error.message}` : 'Unbekannter Fehler beim Import'
            });
          }
        }
      } else {
        // CSV Import
        const lines = data.split('\\n');
        const headers = lines[0].split(',');

        for (let i = 1; i < lines.length; i++) {
          try {
            const values = lines[i].split(',').map(val => 
              val.startsWith('"') && val.endsWith('"') 
                ? val.slice(1, -1).replace(/""/g, '"') 
                : val
            );

            const cat: Partial<CustomCategory> = {
              id: values[0],
              name: values[1],
              color: values[2],
              icon: values[3] || undefined,
              parentCategory: values[4] || undefined,
              level: parseInt(values[5]),
              tags: values[6] ? values[6].split(';') : [],
              status: values[7] as 'active' | 'archived'
            };

            const exists = this.categories.has(cat.id!);
            
            if (exists && options.conflictResolution === 'skip') {
              result.skipped++;
              continue;
            }

            if (exists && options.conflictResolution === 'rename') {
              cat.id = `${cat.id}_imported_${Date.now()}`;
              cat.name = `${cat.name} (Importiert)`;
            }

            this.categories.set(cat.id!, cat as CustomCategory);
            result.imported++;
          } catch (error) {
            result.errors.push({
              id: `row_${i}`,
              error: error instanceof Error ? `CSV Import fehlgeschlagen: ${error.message}` : 'Unbekannter Fehler beim CSV Import'
            });
          }
        }
      }

      // Speichere die aktualisierten Kategorien
      await this.saveCategories();
      return result;
    } catch (error) {
      throw new Error(error instanceof Error ? `Import fehlgeschlagen: ${error.message}` : 'Unbekannter Import-Fehler');
    }
  }

  // Template-Verwaltung
  async exportTemplate(categoryIds: string[], options?: {
    languages?: string[];
    defaultLanguage?: string;
    includeMetadata?: boolean;
  }): Promise<string> {
    const defaultLanguage = options?.defaultLanguage || 'de';
    const languages = options?.languages || [defaultLanguage];

    const template = {
      version: '1.1',
      name: {
        [defaultLanguage]: 'Benutzerdefinierte Vorlage',
        en: 'Custom Template'
      },
      description: {
        [defaultLanguage]: 'Exportierte Kategorie-Vorlage',
        en: 'Exported category template'
      },
      metadata: {
        languages,
        defaultLanguage,
        createdAt: new Date().toISOString(),
        creator: 'system'
      },
      categories: categoryIds.map(id => {
        const cat = this.categories.get(id);
        if (!cat) return null;
        
        // Erstelle mehrsprachige Namens- und Beschreibungsobjekte
        const name: Record<string, string> = {
          [defaultLanguage]: cat.name
        };
        
        const description: Record<string, string> = {};
        if (cat.metadata?.description) {
          description[defaultLanguage] = cat.metadata.description;
        }

        return {
          name,
          description,
          color: cat.color,
          icon: cat.icon,
          metadata: options?.includeMetadata ? cat.metadata : undefined,
          tags: cat.tags,
          translations: cat.metadata?.translations || {}
        };
      }).filter(Boolean)
    };

    return JSON.stringify(template, null, 2);
  }

  private getTranslatedValue(translations: Record<string, string> | undefined, targetLanguage: string, fallbackLanguage: string): string | undefined {
    if (!translations) return undefined;
    return translations[targetLanguage] || translations[fallbackLanguage];
  }

  async importTemplate(templateData: string, options?: {
    targetLanguage?: string;
    fallbackLanguage?: string;
    preserveTranslations?: boolean;
  }): Promise<{
    created: number;
    errors: string[];
    warnings: string[];
  }> {
    try {
      const template = JSON.parse(templateData);
      const result = {
        created: 0,
        errors: [] as string[],
        warnings: [] as string[]
      };

      if (!template.categories || !Array.isArray(template.categories)) {
        throw new Error('Ungültiges Template-Format');
      }

      // Ermittle die zu verwendende Sprache
      const templateLangs = template.metadata?.languages || ['de'];
      const targetLanguage = options?.targetLanguage || template.metadata?.defaultLanguage || 'de';
      const fallbackLanguage = options?.fallbackLanguage || 'en';

      if (!templateLangs.includes(targetLanguage)) {
        result.warnings.push(
          `Zielsprache '${targetLanguage}' ist nicht im Template verfügbar. ` +
          `Verfügbare Sprachen: ${templateLangs.join(', ')}`
        );
      }

      for (const cat of template.categories) {
        try {
          // Wähle den Namen in der Zielsprache oder Fallback
          const name = this.getTranslatedValue(cat.name, targetLanguage, fallbackLanguage);
          if (!name) {
            throw new Error(`Kein Name für die Sprache '${targetLanguage}' oder '${fallbackLanguage}' gefunden`);
          }

          // Sammle alle verfügbaren Übersetzungen
          const translations = options?.preserveTranslations ? {
            name: cat.name,
            description: cat.description
          } : undefined;

          // Erstelle die Kategorie mit Übersetzungen
          await this.createCategory({
            ...cat,
            name,
            createdBy: 'template',
            metadata: {
              ...cat.metadata,
              translations,
              importedFrom: {
                template: template.name[targetLanguage] || template.name[fallbackLanguage],
                language: targetLanguage,
                date: new Date().toISOString()
              }
            },
            permissions: {
              owner: 'system',
              sharedWith: [],
              public: true,
              role: 'viewer'
            }
          });
          result.created++;
        } catch (error) {
          const catName = this.getTranslatedValue(cat.name, targetLanguage, fallbackLanguage) || 'Unbekannt';
          result.errors.push(
            error instanceof Error 
              ? `Fehler beim Erstellen der Kategorie '${catName}': ${error.message}` 
              : `Fehler beim Erstellen der Kategorie '${catName}'`
          );
        }
      }

      return result;
    } catch (error) {
      throw new Error(error instanceof Error ? `Template-Import fehlgeschlagen: ${error.message}` : 'Unbekannter Fehler beim Template-Import');
    }
  }
}

export const categoryService = CategoryService.getInstance();