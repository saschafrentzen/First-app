export type NutritionGoalType = 
  | 'calories'
  | 'protein'
  | 'carbs'
  | 'fat'
  | 'fiber'
  | 'sugar'
  | 'sodium'
  | 'water';

export type NutritionGoalPeriod = 
  | 'daily'
  | 'weekly'
  | 'monthly';

export type NutritionGoalOperation = 
  | 'less-than'
  | 'more-than'
  | 'exactly'
  | 'between';

export interface NutritionGoal {
  id: string;
  type: NutritionGoalType;
  period: NutritionGoalPeriod;
  operation: NutritionGoalOperation;
  targetValue: number;
  targetMaxValue?: number; // Für 'between' Operation
  unit: string;
  createdAt: string;
  lastModified: string;
  active: boolean;
  name: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
}

export interface NutritionProgress {
  id: string;
  goalId: string;
  date: string;
  value: number;
  notes?: string;
}

export interface NutritionRecommendation {
  id: string;
  goalId: string;
  type: 'product' | 'recipe' | 'tip';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  impact: number; // 0-100, wie sehr diese Empfehlung zum Ziel beiträgt
  createdAt: string;
  expiresAt?: string;
  completed: boolean;
}

export interface NutritionGoalValidation {
  isValid: boolean;
  errors: NutritionGoalError[];
}

export interface NutritionGoalError {
  type: 'invalid-target' | 'conflicting-goals' | 'unrealistic-goal';
  message: string;
  goalId: string;
}