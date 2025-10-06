import { CustomCategory } from './categoryService';

export interface Recipe {
  id: string;
  name: string;
  description: string;
  servings: number;
  ingredients: Ingredient[];
  instructions: string[];
  prepTime: number; // in minutes
  cookTime: number; // in minutes
  difficulty: 'einfach' | 'mittel' | 'schwer';
  tags: string[];
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  category: CustomCategory;
}

export interface RecipeQuery {
  preferences?: string[];
  excludedIngredients?: string[];
  maxPrepTime?: number;
  difficulty?: Recipe['difficulty'];
  servings?: number;
  tags?: string[];
}

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
const API_URL = 'https://api.openai.com/v1/chat/completions';

class RecipeService {
  private static instance: RecipeService;

  private constructor() {}

  public static getInstance(): RecipeService {
    if (!RecipeService.instance) {
      RecipeService.instance = new RecipeService();
    }
    return RecipeService.instance;
  }

  public async searchRecipes(query: string, options?: RecipeQuery): Promise<Recipe[]> {
    try {
      const prompt = this.buildPrompt(query, options);
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'Du bist ein Kochexperte und Ernährungsberater. Antworte mit Rezepten im JSON-Format, die genau der vorgegebenen Struktur entsprechen.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error('API-Anfrage fehlgeschlagen');
      }

      const data = await response.json();
      const recipesText = data.choices[0].message.content;
      const recipes: Recipe[] = JSON.parse(recipesText);

      return recipes.map(recipe => ({
        ...recipe,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      }));
    } catch (error) {
      console.error('Fehler bei der Rezeptsuche:', error);
      throw new Error('Rezepte konnten nicht geladen werden');
    }
  }

  private buildPrompt(query: string, options?: RecipeQuery): string {
    let prompt = `Finde passende Rezepte für: ${query}\n\n`;
    prompt += 'Gib die Rezepte im folgenden JSON-Format zurück:\n';
    prompt += `{
      "name": "Rezeptname",
      "description": "Kurze Beschreibung",
      "servings": 4,
      "ingredients": [
        {
          "name": "Zutat",
          "amount": 100,
          "unit": "g",
          "category": {
            "id": "category-id",
            "name": "Kategoriename"
          }
        }
      ],
      "instructions": ["Schritt 1", "Schritt 2"],
      "prepTime": 20,
      "cookTime": 30,
      "difficulty": "einfach|mittel|schwer",
      "tags": ["vegetarisch", "schnell"],
      "nutrition": {
        "calories": 400,
        "protein": 20,
        "carbs": 45,
        "fat": 15
      }
    }\n`;

    if (options) {
      if (options.preferences?.length) {
        prompt += `\nBerücksichtige diese Ernährungspräferenzen: ${options.preferences.join(', ')}`;
      }
      if (options.excludedIngredients?.length) {
        prompt += `\nVerwende diese Zutaten NICHT: ${options.excludedIngredients.join(', ')}`;
      }
      if (options.maxPrepTime) {
        prompt += `\nMaximale Zubereitungszeit: ${options.maxPrepTime} Minuten`;
      }
      if (options.difficulty) {
        prompt += `\nSchwierigkeitsgrad: ${options.difficulty}`;
      }
      if (options.servings) {
        prompt += `\nPortionen: ${options.servings}`;
      }
      if (options.tags?.length) {
        prompt += `\nGewünschte Tags: ${options.tags.join(', ')}`;
      }
    }

    return prompt;
  }

  public createShoppingListFromRecipe(recipe: Recipe, currentServings?: number): Ingredient[] {
    if (!currentServings || currentServings <= 0) {
      return recipe.ingredients;
    }

    const servingRatio = currentServings / recipe.servings;
    return recipe.ingredients.map(ingredient => ({
      ...ingredient,
      amount: Math.round((ingredient.amount * servingRatio) * 100) / 100,
    }));
  }
}

export const recipeService = RecipeService.getInstance();