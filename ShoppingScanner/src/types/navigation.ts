import { ShoppingList, ShoppingItem } from './storage';

export type RootStackParamList = {
  MainTabs: undefined;
  Home: undefined;
  Lists: { newList?: ShoppingList; addProduct?: ShoppingItem };
  CreateList: undefined;
  ListDetails: { listId: string };
  Scanner: undefined;
  Settings: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}