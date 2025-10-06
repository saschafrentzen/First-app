export interface ProductNutriments {
  energy: number;     // kcal/100g
  fat: number;        // g/100g
  carbohydrates: number; // g/100g
  proteins: number;   // g/100g
}

export interface Product {
  barcode: string;
  name: string;
  brand: string;
  category: string;
  image: string | null;
  nutriments: ProductNutriments;
  ingredients: string;
  price: number;
  lastUpdated: string;
}