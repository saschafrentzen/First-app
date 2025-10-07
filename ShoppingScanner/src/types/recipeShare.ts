import { Recipe } from '@app/types/recipe';
import { UserProfile } from '@app/types/user';

export interface RecipeShare {
  shareId: string;
  recipeId: string;
  recipe: Recipe;
  sharedBy: string; // User ID des Teilenden
  sharedWith: string[]; // Array von User IDs
  permissions: RecipePermissions;
  sharedAt: string;
  lastModified: string;
}

export interface RecipePermissions {
  canEdit: boolean;
  canShare: boolean;
  canDelete: boolean;
}

export interface RecipeInvitation {
  invitationId: string;
  recipeId: string;
  fromUser: string; // User ID
  toEmail: string;
  message?: string;
  permissions: RecipePermissions;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: string;
  expiresAt: string;
}

export interface SharedRecipeStats {
  totalShares: number;
  activeShares: number;
  pendingInvitations: number;
  lastSharedAt: string | null;
}

export interface RecipeSharingPreferences {
  defaultPermissions: RecipePermissions;
  autoAcceptFrom: string[]; // Array von User IDs
  blockSharingFrom: string[]; // Array von User IDs
  notifyOnShare: boolean;
  notifyOnModification: boolean;
}