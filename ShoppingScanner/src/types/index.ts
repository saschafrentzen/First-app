import { FirebaseAuthTypes } from '@react-native-firebase/auth';

// Benutzerdefinierte Interfaces für Firebase-Typen
export interface FirebaseUser extends FirebaseAuthTypes.User {
  email: string | null;
  uid: string;
}

export * from './recipe';
export * from './user';
export * from './recipeShare';
export * from './priceComparison';
export * from './shopping';
export * from './smartHome';

// Service-Typen
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string; // Detaillierte Fehlermeldung, z.B. für Entwickler
}

// Navigation-Parameter
export interface NavigationParams {
  householdId?: string;
  shareId?: string;
  listId?: string;
}