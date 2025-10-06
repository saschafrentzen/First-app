export interface CustomCategory {
  id: string;
  name: string;
  color: string;
  icon?: string;
  parentCategory?: string;
  description?: string;
  isSystem?: boolean;
  order?: number;
  metadata?: {
    budgetLimit?: number;
    nutritionRelevant?: boolean;
    tags?: string[];
    customProperties?: Record<string, any>;
  };
  createdAt: string;
  lastModified: string;
}

export interface CategoryExportData {
  version: string;
  timestamp: string;
  categories: CustomCategory[];
}

export interface CategoryValidationResult {
  isValid: boolean;
  errors: CategoryValidationError[];
}

export interface CategoryValidationError {
  categoryId: string;
  errorType: 'circular-reference' | 'invalid-parent' | 'duplicate-id' | 'missing-required-field';
  message: string;
}

export interface CategoryStats {
  totalCategories: number;
  maxDepth: number;
  categoriesPerLevel: Map<number, number>;
  orphanedCategories: string[];
}