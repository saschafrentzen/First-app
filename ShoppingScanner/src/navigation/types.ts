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
  SmartFridge: undefined; // Hauptscreen für den Kühlschrank
  FridgeDetail: { fridgeId: string }; // Detailansicht für einen spezifischen Kühlschrank
};