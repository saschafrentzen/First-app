import { NavigatorScreenParams } from '@react-navigation/native';
import { ShoppingList } from './shopping';

export type TabStackParamList = {
  Home: undefined;
  Lists: undefined;
  Scanner: undefined;
  Settings: undefined;
  SmartFridge: undefined;
};

export type MainTabsParamList = {
  Home: undefined;
  ListStack: undefined;
  HouseholdStack: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabsParamList>;
  CreateList: undefined;
  ListDetails: { listId: string };
  SmartFridge: undefined;
};

export type HouseholdStackParamList = {
  Households: undefined;
  HouseholdDetail: { householdId: string };
  ListSelection: { householdId: string };
  SharedList: { shareId: string };
  HouseholdSettings: { householdId: string };
  InviteMember: { householdId: string };
};

export type ListStackParamList = {
  Lists: undefined;
  CreateList: undefined;
  ListDetails: { listId: string };
  Scanner: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}