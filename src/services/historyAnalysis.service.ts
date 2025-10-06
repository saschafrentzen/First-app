import { ShoppingHistoryItem, CategorySuggestion, CategoryConfidenceScore, SuggestionReason } from '../types/shoppingHistory';
import { CustomCategory } from '../types/category';
import AsyncStorage from '@react-native-async-storage/async-storage';

class HistoryAnalysisService {
  private static instance: HistoryAnalysisService;
  private purchaseHistory: Map<string, ShoppingHistoryItem> = new Map();
  private categories: Map<string, CustomCategory>;

  private constructor(categories: Map<string, CustomCategory>) {
    this.categories = categories;
    this.loadPurchaseHistory();
  }

  static getInstance(categories: Map<string, CustomCategory>): HistoryAnalysisService {
    if (!HistoryAnalysisService.instance) {
      HistoryAnalysisService.instance = new HistoryAnalysisService(categories);
    }
    return HistoryAnalysisService.instance;
  }

  private async loadPurchaseHistory(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('purchase_history');
      if (data) {
        const history = JSON.parse(data);
        this.purchaseHistory = new Map(Object.entries(history));
      }
    } catch (error) {
      console.error('Fehler beim Laden der Kaufhistorie:', error);
    }
  }

  private async savePurchaseHistory(): Promise<void> {
    try {
      const data = Object.fromEntries(this.purchaseHistory);
      await AsyncStorage.setItem('purchase_history', JSON.stringify(data));
    } catch (error) {
      console.error('Fehler beim Speichern der Kaufhistorie:', error);
    }
  }

  // Neue Käufe zur Historie hinzufügen
  async addPurchase(productName: string, categoryId?: string): Promise<void> {
    const normalizedName = this.normalizeProductName(productName);
    const existingItem = this.purchaseHistory.get(normalizedName);
    
    if (existingItem) {
      existingItem.frequency++;
      existingItem.lastPurchased = new Date().toISOString();
      if (categoryId) {
        existingItem.category = categoryId;
        existingItem.confidence = 1;
      }
    } else {
      const newItem: ShoppingHistoryItem = {
        id: `hist_${Date.now()}`,
        productName: normalizedName,
        category: categoryId,
        purchaseDate: new Date().toISOString(),
        lastPurchased: new Date().toISOString(),
        frequency: 1,
        confidence: categoryId ? 1 : 0
      };
      this.purchaseHistory.set(normalizedName, newItem);
    }

    await this.savePurchaseHistory();
  }

  // Kategorievorschläge für ein Produkt generieren
  async suggestCategory(productName: string): Promise<CategorySuggestion> {
    const normalizedName = this.normalizeProductName(productName);
    const scores = await this.calculateCategoryScores(normalizedName);
    
    // Beste Kategorie finden
    const bestMatch = scores.reduce((best, current) => 
      current.score > best.score ? current : best
    );

    // Alternative Kategorien finden
    const alternatives = scores
      .filter(score => score.categoryId !== bestMatch.categoryId)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(score => ({
        categoryId: score.categoryId,
        confidence: score.score
      }));

    const reason = this.determineSuggestionReason(bestMatch);

    return {
      productName: normalizedName,
      suggestedCategory: bestMatch.categoryId,
      confidence: bestMatch.score,
      reason,
      alternativeCategories: alternatives,
      metadata: {
        frequency: this.getProductFrequency(normalizedName),
        seasonalConfidence: this.calculateSeasonalConfidence(normalizedName),
        lastPurchased: this.getLastPurchaseDate(normalizedName),
        similarProducts: await this.findSimilarProducts(normalizedName)
      }
    };
  }

  // Private Hilfsmethoden
  private normalizeProductName(name: string): string {
    return name.toLowerCase().trim();
  }

  private async calculateCategoryScores(productName: string): Promise<CategoryConfidenceScore[]> {
    const scores: CategoryConfidenceScore[] = [];
    
    for (const [categoryId, category] of this.categories.entries()) {
      const score = {
        categoryId,
        score: 0,
        factors: {
          purchaseHistory: this.calculateHistoryFactor(productName, categoryId),
          nameSimilarity: this.calculateNameSimilarity(productName, category),
          seasonality: this.calculateSeasonalityFactor(productName, categoryId),
          userPreference: this.calculateUserPreferenceFactor(categoryId)
        }
      };

      // Gewichtete Gesamtbewertung berechnen
      score.score = (
        score.factors.purchaseHistory * 0.4 +
        score.factors.nameSimilarity * 0.3 +
        score.factors.seasonality * 0.2 +
        score.factors.userPreference * 0.1
      );

      scores.push(score);
    }

    return scores;
  }

  private calculateHistoryFactor(productName: string, categoryId: string): number {
    const historyItem = this.purchaseHistory.get(productName);
    if (!historyItem) return 0;

    return historyItem.category === categoryId ? 1 : 0;
  }

  private calculateNameSimilarity(productName: string, category: CustomCategory): number {
    // Einfache Levenshtein-Distanz für Namensähnlichkeit
    const maxLen = Math.max(productName.length, category.name.length);
    const distance = this.levenshteinDistance(productName, category.name.toLowerCase());
    return 1 - (distance / maxLen);
  }

  private calculateSeasonalityFactor(productName: string, categoryId: string): number {
    const historyItem = this.purchaseHistory.get(productName);
    if (!historyItem?.metadata?.seasonality) return 0;

    const currentMonth = new Date().getMonth();
    const season = this.getCurrentSeason(currentMonth);
    return historyItem.metadata.seasonality[season];
  }

  private calculateUserPreferenceFactor(categoryId: string): number {
    // Berechne, wie häufig der Benutzer diese Kategorie generell verwendet
    let categoryUsage = 0;
    let totalItems = 0;

    for (const item of this.purchaseHistory.values()) {
      if (item.category === categoryId) categoryUsage++;
      totalItems++;
    }

    return totalItems > 0 ? categoryUsage / totalItems : 0;
  }

  private getCurrentSeason(month: number): 'winter' | 'spring' | 'summer' | 'autumn' {
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }

  private determineSuggestionReason(score: CategoryConfidenceScore): SuggestionReason {
    const factors = score.factors;
    const maxFactor = Math.max(
      factors.purchaseHistory,
      factors.nameSimilarity,
      factors.seasonality,
      factors.userPreference
    );

    if (maxFactor === factors.purchaseHistory) return 'purchase_history';
    if (maxFactor === factors.nameSimilarity) return 'name_similarity';
    if (maxFactor === factors.seasonality) return 'seasonal_pattern';
    if (maxFactor === factors.userPreference) return 'user_preference';
    return 'global_statistics';
  }

  private getProductFrequency(productName: string): number {
    return this.purchaseHistory.get(productName)?.frequency || 0;
  }

  private calculateSeasonalConfidence(productName: string): number {
    const historyItem = this.purchaseHistory.get(productName);
    if (!historyItem?.metadata?.seasonality) return 0;

    const season = this.getCurrentSeason(new Date().getMonth());
    return historyItem.metadata.seasonality[season];
  }

  private getLastPurchaseDate(productName: string): string | undefined {
    return this.purchaseHistory.get(productName)?.lastPurchased;
  }

  private async findSimilarProducts(productName: string): Promise<Array<{
    name: string;
    categoryId: string;
    similarity: number;
  }>> {
    const similar: Array<{name: string; categoryId: string; similarity: number}> = [];

    for (const [name, item] of this.purchaseHistory.entries()) {
      if (name === productName) continue;

      const similarity = this.calculateNameSimilarity(productName, {
        name,
        id: '',
        color: '',
        path: [],
        level: 0,
        tags: [],
        status: 'active',
        metadata: {},
        permissions: {
          owner: '',
          sharedWith: [],
          public: false,
          role: 'viewer'
        },
        createdAt: '',
        lastModified: '',
        createdBy: '',
        modifiedBy: ''
      });

      if (similarity > 0.5 && item.category) {
        similar.push({
          name,
          categoryId: item.category,
          similarity
        });
      }
    }

    return similar.sort((a, b) => b.similarity - a.similarity).slice(0, 5);
  }

  private levenshteinDistance(a: string, b: string): number {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }
}

export const historyAnalysisService = (categories: Map<string, CustomCategory>) => 
  HistoryAnalysisService.getInstance(categories);