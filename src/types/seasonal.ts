// Typ für Monate
export type Month = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

// Kategorie für saisonale Lebensmittel
export type FoodCategory = 
  | 'vegetable'    // Gemüse
  | 'fruit'        // Obst
  | 'herb'         // Kräuter
  | 'mushroom'     // Pilze
  | 'nut'          // Nüsse
  | 'other';       // Sonstige

// Nährwertqualität
export type NutritionalQuality = 'low' | 'medium' | 'high';

// Saisonales Lebensmittel
export interface SeasonalFood {
  id: string;
  name: string;
  category: FoodCategory;
  season: {
    start: Month;
    peak: Month[];
    end: Month;
  };
  nutritionalHighlights: Array<{
    nutrient: string;
    quality: NutritionalQuality;
    description: string;
  }>;
  storageInfo: {
    methods: Array<'room' | 'refrigerator' | 'freezer'>;
    maxDuration: {
      value: number;
      unit: 'days' | 'weeks' | 'months';
    };
    tips: string[];
  };
  preparation: {
    methods: string[];
    tips: string[];
  };
  alternatives: string[]; // IDs von anderen saisonalen Lebensmitteln
  image?: string;
}

// Saisonaler Ernährungstipp
export interface SeasonalTip {
  id: string;
  title: string;
  description: string;
  applicableMonths: Month[];
  category: 'nutrition' | 'preparation' | 'storage' | 'shopping' | 'sustainability';
  relatedFoods: string[]; // IDs von SeasonalFood
  importance: 'low' | 'medium' | 'high';
  metadata: {
    createdAt: string;
    lastModified: string;
    source?: string;
  };
}

// Saisonaler Wochenplan
export interface SeasonalMealPlan {
  id: string;
  week: number;
  year: number;
  seasonalFoods: Array<{
    foodId: string;
    suggestedUses: Array<{
      mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
      preparation: string;
    }>;
  }>;
  tips: string[]; // IDs von SeasonalTip
  nutritionInfo: {
    seasonalPercentage: number; // Prozentsatz saisonaler Lebensmittel
    sustainabilityScore: number;
    costEstimate: {
      value: number;
      currency: string;
    };
  };
}

// Saisonaler Report
export interface SeasonalReport {
  id: string;
  profileId: string;
  period: {
    start: string;
    end: string;
  };
  seasonalityScore: number; // 0-100%
  usedSeasonalFoods: Array<{
    foodId: string;
    frequency: number;
    totalAmount: number;
    unit: string;
  }>;
  missedOpportunities: Array<{
    foodId: string;
    reason: 'availability' | 'preference' | 'price' | 'other';
    suggestion: string;
  }>;
  impact: {
    environmental: {
      co2Saved: number; // in kg
      waterSaved: number; // in L
    };
    economic: {
      moneySaved: number;
      currency: string;
    };
  };
  recommendations: Array<{
    type: 'food' | 'habit' | 'planning';
    description: string;
    potentialImpact: 'low' | 'medium' | 'high';
  }>;
}