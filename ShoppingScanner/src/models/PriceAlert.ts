export enum AlertType {
  ABOVE = 'ABOVE',
  BELOW = 'BELOW'
}

export interface PriceAlert {
  id: string;
  productId: string;
  userId: string;
  targetPrice: number;
  currentPrice: number;
  alertType: AlertType;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePriceAlertDTO {
  productId: string;
  targetPrice: number;
  alertType: AlertType;
}

export interface UpdatePriceAlertDTO {
  targetPrice?: number;
  alertType?: AlertType;
  isActive?: boolean;
}