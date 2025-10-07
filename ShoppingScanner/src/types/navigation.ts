import { NavigatorScreenParams } from '@react-navigation/native';
import { ShoppingList, ShoppingItem } from './storage';

export type HouseholdStackParamList = {
  HouseholdList: undefined;
  HouseholdDetail: {
    householdId: string;
  };
  HouseholdSettings: {
    householdId: string;
  };
  ListSelection: {
    householdId: string;
  };
  SharedList: {
    shareId: string;
  };
  InviteMember: {
    householdId: string;
  };
};

export type ListStackParamList = {
  Lists: { newList?: ShoppingList; addProduct?: ShoppingItem };
  CreateList: undefined;
  ListDetails: { listId: string };
  Scanner: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  ListStack: NavigatorScreenParams<ListStackParamList>;
  HouseholdStack: NavigatorScreenParams<HouseholdStackParamList>;
  Settings: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}