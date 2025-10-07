import { FirebaseAuthTypes } from '@react-native-firebase/auth';

export interface UserProfile {
  userId: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  preferences: UserPreferences;
  statistics: UserStatistics;
  lastActive: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: boolean;
  privacySettings: PrivacySettings;
  sharingPreferences: SharingPreferences;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'friends';
  showOnlineStatus: boolean;
  allowFriendRequests: boolean;
}

export interface SharingPreferences {
  defaultListPermissions: {
    canEdit: boolean;
    canShare: boolean;
    canDelete: boolean;
  };
  autoAcceptFromFriends: boolean;
  notifyOnShares: boolean;
}

export interface UserStatistics {
  recipesCreated: number;
  recipesShared: number;
  listsCreated: number;
  listsShared: number;
  totalIngredients: number;
  memberSince: string;
}