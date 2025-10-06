// Grundlegende Nährwertinformationen
export interface NutritionInfo {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  saturatedFat?: number;
  unsaturatedFat?: number;
  sodium?: number;
  vitamins?: {
    a?: number;
    b1?: number;
    b2?: number;
    b6?: number;
    b12?: number;
    c?: number;
    d?: number;
    e?: number;
    k?: number;
  };
  minerals?: {
    calcium?: number;
    iron?: number;
    magnesium?: number;
    zinc?: number;
    potassium?: number;
  };
}

// Analysen und Insights
export interface NutritionInsight {
  id: string;
  type: 'pattern' | 'correlation' | 'prediction' | 'anomaly' | 'trend';
  confidence: number;
  description: string;
  data: {
    metric: string;
    value: number;
    context?: any;
  };
  metadata: {
    generatedAt: string;
    validUntil?: string;
    source: 'ml' | 'analysis' | 'pattern';
    model?: string;
  };
}

export interface AnalysisResult {
  insights: NutritionInsight[];
  predictions: Array<{
    metric: string;
    predictedValue: number;
    confidence: number;
    factors: Array<{
      name: string;
      impact: number;
    }>;
    timeframe: 'short' | 'medium' | 'long';
  }>;
  correlations: Array<{
    factor1: string;
    factor2: string;
    strength: number;
    direction: 'positive' | 'negative';
  }>;
  patterns: Array<{
    type: string;
    description: string;
    confidence: number;
    supportingData: any;
  }>;
}

// Einheitentypen für verschiedene Nährwerte
export type NutritionUnit = 
  | 'g'      // Gramm
  | 'mg'     // Milligramm
  | 'µg'     // Mikrogramm
  | 'kcal'   // Kilokalorien
  | 'kJ'     // Kilojoule
  | '%'      // Prozent der Tageszufuhr
  | 'IU';    // Internationale Einheiten

// Nährwert mit Einheit
export interface NutritionValue {
  value: number;
  unit: NutritionUnit;
}

// Persönliches Ernährungsprofil
export interface NutritionProfile {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  lastModified: string;
  isActive: boolean;
  personalInfo: {
    age: number;
    gender: 'male' | 'female' | 'other';
    weight: number;      // in kg
    height: number;      // in cm
    activityLevel: 'sedentary' | 'lightlyActive' | 'moderatelyActive' | 'veryActive' | 'extraActive';
    healthConditions?: string[];
    allergies?: string[];
    intolerances?: string[];
  };
  preferences: {
    diet?: 'omnivore' | 'vegetarian' | 'vegan' | 'pescatarian' | 'paleo' | 'keto' | 'other';
    excludedFoods?: string[];
    preferredFoods?: string[];
    mealTimings?: {
      breakfast?: string;
      lunch?: string;
      dinner?: string;
      snacks?: string[];
    };
  };
}

// Definition eines Ernährungsziels
export interface NutritionGoal {
  id: string;
  profileId: string;
  name: string;
  description?: string;
  type: 'weight' | 'macro' | 'micro' | 'habit' | 'custom';
  category: 'daily' | 'weekly' | 'monthly' | 'overall';
  status: 'active' | 'completed' | 'paused' | 'abandoned';
  priority: 'low' | 'medium' | 'high';
  startDate: string;
  targetDate?: string;
  metrics: {
    current: number;
    target: number;
    unit: string;
    minimum?: number;
    maximum?: number;
  };
  tracking: {
    frequency: 'daily' | 'weekly' | 'monthly';
    reminder?: boolean;
    reminderTime?: string;
    lastTracked?: string;
  };
  nutritionTargets?: {
    calories?: NutritionValue;
    macronutrients?: {
      protein?: NutritionValue;
      carbohydrates?: NutritionValue;
      fat?: NutritionValue;
    };
    micronutrients?: {
      [key: string]: NutritionValue;
    };
  };
  progress: {
    percentage: number;
    history: Array<{
      date: string;
      value: number;
      notes?: string;
    }>;
    trend: 'increasing' | 'decreasing' | 'stable' | 'fluctuating';
  };
  customFields?: {
    [key: string]: any;
  };
  metadata: {
    createdAt: string;
    lastModified: string;
    completedAt?: string;
    tags?: string[];
    notes?: string;
  };
}

// Täglicher Ernährungseintrag
export interface DailyNutritionEntry {
  id: string;
  profileId: string;
  date: string;
  meals: Array<{
    id: string;
    type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    time: string;
    foods: Array<{
      name: string;
      amount: number;
      unit: string;
      nutrition: NutritionInfo;
    }>;
    totalNutrition: NutritionInfo;
  }>;
  totalDailyNutrition: NutritionInfo;
  waterIntake?: number;  // in ml
  supplements?: Array<{
    name: string;
    amount: number;
    unit: string;
    timesTaken: string[];
  }>;
  goals: Array<{
    goalId: string;
    planned: number;
    actual: number;
    status: 'met' | 'notMet' | 'exceeded';
  }>;
  notes?: string;
}

// Progress-Tracking
export interface NutritionProgress {
  id: string;
  profileId: string;
  goalId: string;
  period: {
    start: string;
    end: string;
  };
  metrics: {
    planned: number;
    actual: number;
    average: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  };
  history: Array<{
    date: string;
    value: number;
    deviation: number;  // Abweichung vom Ziel
  }>;
  analysis: {
    successRate: number;
    consistencyScore: number;
    challengingDays: string[];
    recommendations?: string[];
  };
}