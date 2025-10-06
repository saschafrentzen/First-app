import { CustomCategory } from './category';

export interface ShoppingHistoryItem {
  id: string;
  productName: string;
  category?: string;  // Kategorie-ID
  purchaseDate: string;
  frequency: number;  // Häufigkeit des Kaufs
  lastPurchased: string;
  confidence: number; // Konfidenz der Kategoriezuordnung (0-1)
  metadata?: {
    alternativeCategories?: string[];  // Alternative Kategorien-IDs
    seasonality?: {
      winter: number;
      spring: number;
      summer: number;
      autumn: number;
    };
    tags?: string[];
    notes?: string;
  };
}

export interface CategorySuggestion {
  productName: string;
  suggestedCategory: string;  // Kategorie-ID
  confidence: number;
  reason: SuggestionReason;
  alternativeCategories?: Array<{
    categoryId: string;
    confidence: number;
  }>;
  metadata?: {
    frequency?: number;
    seasonalConfidence?: number;
    lastPurchased?: string;
    similarProducts?: Array<{
      name: string;
      categoryId: string;
      similarity: number;
    }>;
  };
}

export type SuggestionReason = 
  | 'purchase_history'    // Basierend auf Kaufhistorie
  | 'name_similarity'     // Ähnlicher Produktname
  | 'seasonal_pattern'    // Saisonales Kaufmuster
  | 'user_preference'     // Benutzerverhalten
  | 'global_statistics'; // Globale Statistiken

export interface CategoryConfidenceScore {
  categoryId: string;
  score: number;
  factors: {
    purchaseHistory: number;
    nameSimilarity: number;
    seasonality: number;
    userPreference: number;
  };
}