export interface Recipe {
  recipeId: string;
  title: string;
  description: string;
  ingredients: Ingredient[];
  steps: CookingStep[];
  categories: string[];
  preparationTime: number;
  cookingTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  createdBy: string;
  createdAt: string;
  lastModified: string;
  images: string[];
  nutrition: NutritionInfo;
  tags: string[];
  notes: string;
  isPublic: boolean;
  rating: number;
  reviews: number;
}

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  notes?: string;
  category: string;
}

export interface CookingStep {
  stepNumber: number;
  description: string;
  timer?: number; // in minutes
  image?: string;
}

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sugar: number;
  servingSize: string;
}