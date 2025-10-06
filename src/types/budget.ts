// Enums & Types
export type BudgetPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type BudgetAlertType = 'warning' | 'critical';
export type BudgetCheckFrequency = 'daily' | 'weekly' | 'monthly' | 'onTransaction';
export type NotificationChannel = 'push' | 'inApp' | 'email';
export type NotificationStatus = 'pending' | 'sent' | 'failed';

// Interfaces
export interface BudgetCategory {
  id: string;
  name: string;
  limit: number;
  spent: number;
  period: BudgetPeriod;
  alerts: BudgetAlert[];
}

export interface BudgetAlert {
  id: string;
  type: BudgetAlertType;
  threshold: number;
  message: string;
  enabled: boolean;
  notificationChannels: NotificationChannel[];
}

export interface BudgetStatus {
  categoryId: string;
  period: BudgetPeriod;
  startDate: string;
  endDate: string;
  limit: number;
  spent: number;
  remaining: number;
  percentageSpent: number;
  projectedOverspend: number | null;
  lastChecked: string;
  activeAlerts: BudgetAlert[];
}

export interface BudgetSettings {
  checkFrequency: BudgetCheckFrequency;
  quietHours: {
    enabled: boolean;
    start: string; // Format: "HH:mm"
    end: string; // Format: "HH:mm"
  };
  defaultAlerts: BudgetAlert[];
  globalNotificationChannels: NotificationChannel[];
}

export interface BudgetNotification {
  id: string;
  categoryId: string;
  alertId: string;
  timestamp: string;
  type: BudgetAlertType;
  message: string;
  data: {
    budgetLimit: number;
    currentSpent: number;
    threshold: number;
    percentageSpent: number;
  };
  status: NotificationStatus;
}

export interface BudgetForecast {
  categoryId: string;
  period: BudgetPeriod;
  projectedSpend: number;
  confidence: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  factors: {
    name: string;
    impact: number;
  }[];
  recommendations: {
    message: string;
    potentialSavings: number;
  }[];
}