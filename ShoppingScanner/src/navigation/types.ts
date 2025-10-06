import { ShoppingItem } from '../services/database';

export type RootStackParamList = {
  Lists: undefined;
  Scanner: {
    onAddItem: (item: ShoppingItem) => void;
  };
  History: undefined;
};