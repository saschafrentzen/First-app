export type BudgetWarningThreshold = {
  percentage: number;  // z.B. 80 für 80% des Budgets
  notificationType: 'push' | 'in-app' | 'both';
};

export type BudgetWarningSettings = {
  enabled: boolean;
  thresholds: BudgetWarningThreshold[];
  notifyOnTrends: boolean;  // Benachrichtigen bei auffälligen Ausgabentrends
  autoAdjust: boolean;      // Automatische Budget-Anpassungen erlauben
};

export type BudgetPrediction = {
  predictedAmount: number;
  confidence: number;       // Konfidenzwert zwischen 0 und 1
  trend: 'increasing' | 'stable' | 'decreasing';
  factors: {
    description: string;    // Beschreibung des Einflussfaktors
    impact: number;        // Einfluss auf die Vorhersage (-1 bis 1)
  }[];
};

export type BudgetAdjustmentSuggestion = {
  currentBudget: number;
  suggestedBudget: number;
  reason: string;
  confidence: number;
  appliedDate?: Date;      // Datum der automatischen Anwendung
};

export type BudgetWarning = {
  id: string;
  categoryId: string;
  type: 'threshold' | 'trend' | 'prediction';
  severity: 'low' | 'medium' | 'high';
  message: string;
  currentAmount: number;
  budgetAmount: number;
  percentage: number;
  createdAt: Date;
  acknowledged: boolean;
  prediction?: BudgetPrediction;
  suggestion?: BudgetAdjustmentSuggestion;
};