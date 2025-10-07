import { ShoppingItem } from '../services/database';

export type AppStackParamList = {
  Lists: undefined;
  Scanner: {
    onAddItem: (item: ShoppingItem) => void;
  };
  History: undefined;
  ReportPrice: {
    productId: string;
    productName: string;
    storeId: string;
    storeName: string;
  };
  PriceComparison: {
    productId: string;
    productName: string;
  };
};