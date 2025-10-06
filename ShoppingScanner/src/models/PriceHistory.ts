export interface PriceHistory {
  id: string;
  productId: string;
  price: number;
  shopId: string;
  timestamp: Date;
}

export interface CreatePriceHistoryDTO {
  productId: string;
  price: number;
  shopId: string;
}

export interface PriceHistoryStats {
  lowestPrice: number;
  highestPrice: number;
  averagePrice: number;
  priceChange30Days: number; // Preisänderung in den letzten 30 Tagen in Prozent
  priceHistory: PriceHistory[];
}