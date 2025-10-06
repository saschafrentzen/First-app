import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageError } from '../types/errors';

const CATEGORY_BUDGETS_KEY = '@category_budgets';
const CATEGORY_EXPENSES_KEY = '@category_expenses';

export interface CategoryBudget {
  category: string;
  budget: number;
  period: 'daily' | 'weekly' | 'monthly';
  startDate: string;
}

export interface CategoryExpense {
  category: string;
  amount: number;
  date: string;
  productId: string;
  listId: string;
}

export interface CategoryAnalysis {
  category: string;
  budget: number;
  spent: number;
  remaining: number;
  percentage: number;
  periodStart: string;
  periodEnd: string;
}

class CategoryBudgetService {
  private static instance: CategoryBudgetService;
  private budgets: CategoryBudget[] = [];
  private expenses: CategoryExpense[] = [];

  private constructor() {}

  public static getInstance(): CategoryBudgetService {
    if (!CategoryBudgetService.instance) {
      CategoryBudgetService.instance = new CategoryBudgetService();
    }
    return CategoryBudgetService.instance;
  }

  private async loadData(): Promise<void> {
    try {
      const [budgetsData, expensesData] = await Promise.all([
        AsyncStorage.getItem(CATEGORY_BUDGETS_KEY),
        AsyncStorage.getItem(CATEGORY_EXPENSES_KEY),
      ]);

      this.budgets = budgetsData ? JSON.parse(budgetsData) : [];
      this.expenses = expensesData ? JSON.parse(expensesData) : [];
    } catch (error) {
      throw new StorageError('Fehler beim Laden der Budgetdaten');
    }
  }

  private async saveData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(CATEGORY_BUDGETS_KEY, JSON.stringify(this.budgets)),
        AsyncStorage.setItem(CATEGORY_EXPENSES_KEY, JSON.stringify(this.expenses)),
      ]);
    } catch (error) {
      throw new StorageError('Fehler beim Speichern der Budgetdaten');
    }
  }

  public async setBudget(budget: CategoryBudget): Promise<void> {
    await this.loadData();
    const existingIndex = this.budgets.findIndex(b => b.category === budget.category);
    
    if (existingIndex >= 0) {
      this.budgets[existingIndex] = budget;
    } else {
      this.budgets.push(budget);
    }

    await this.saveData();
  }

  public async addExpense(expense: CategoryExpense): Promise<void> {
    await this.loadData();
    this.expenses.push(expense);
    await this.saveData();
  }

  public async getAnalysis(category: string): Promise<CategoryAnalysis> {
    await this.loadData();
    const budget = this.budgets.find(b => b.category === category);
    
    if (!budget) {
      throw new StorageError('Kein Budget für diese Kategorie gefunden');
    }

    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date;

    switch (budget.period) {
      case 'daily':
        periodStart = new Date(now.setHours(0, 0, 0, 0));
        periodEnd = new Date(now.setHours(23, 59, 59, 999));
        break;
      case 'weekly':
        periodStart = new Date(now.setDate(now.getDate() - now.getDay()));
        periodEnd = new Date(now.setDate(now.getDate() + 6));
        break;
      case 'monthly':
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
    }

    const relevantExpenses = this.expenses.filter(e => 
      e.category === category &&
      new Date(e.date) >= periodStart &&
      new Date(e.date) <= periodEnd
    );

    const spent = relevantExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const remaining = budget.budget - spent;
    const percentage = (spent / budget.budget) * 100;

    return {
      category,
      budget: budget.budget,
      spent,
      remaining,
      percentage,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
    };
  }

  public async getAllAnalyses(): Promise<CategoryAnalysis[]> {
    await this.loadData();
    return Promise.all(
      this.budgets.map(budget => this.getAnalysis(budget.category))
    );
  }

  public async getBudgetCategories(): Promise<string[]> {
    await this.loadData();
    return this.budgets.map(budget => budget.category);
  }

  public async clearBudgetData(): Promise<void> {
    this.budgets = [];
    this.expenses = [];
    await Promise.all([
      AsyncStorage.removeItem(CATEGORY_BUDGETS_KEY),
      AsyncStorage.removeItem(CATEGORY_EXPENSES_KEY),
    ]);
  }
}

export const categoryBudgetService = CategoryBudgetService.getInstance();