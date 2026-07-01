import type { ColorName } from '../utils/colors';

export type TransactionType = 'expense' | 'income';

export type TimeWindow = 'day' | 'week' | 'month' | 'year';

export type Currency = 'ARS' | 'USD_BLUE' | 'USD_MEP' | 'USDT';

export type ExchangeRates = Record<Currency, { toARS: number }>;

export type AutoUpdateInterval = 'none' | '6h' | '12h' | '24h';

export interface Account {
  id?: number;
  name: string;
  currency: Currency;
  initialBalance: number;
  color: ColorName;
  icon: string;
  isArchived: boolean;
  isSavingsAccount?: boolean;
}

export interface Category {
  id?: number;
  name: string;
  type: TransactionType;
  color: ColorName;
  icon: string;
  isDefault?: boolean;
  isEssential?: boolean;
}

export interface Tag {
  id?: number;
  name: string;
}

export interface Transaction {
  id?: number;
  accountId: number;
  categoryId: number;
  type: TransactionType;
  amount: number;
  currency: Currency;
  date: string;
  description: string;
  tagIds: number[];
  essentialOverride?: boolean;
}

export interface Transfer {
  id?: number;
  fromAccountId: number;
  toAccountId: number;
  amount: number;
  convertedAmount: number;
  exchangeRate: number;
  date: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  id?: number;
  defaultAccountId?: number;
  defaultTimeWindow: TimeWindow;
  displayCurrency: Currency;
  exchangeRates: ExchangeRates;
  autoUpdateInterval: AutoUpdateInterval;
  lastFxUpdate?: string;
  fxUpdateCount: number;
  targetSavingsRate?: number;
}

export interface SavingsMetrics {
  period: string;
  income: number;
  expenses: number;
  netBalance: number;
  transfersToSavings: number;
  totalSaved: number;
  savingsRate: number;
  targetSavingsRate?: number;
  isTargetMet: boolean;
  availableBudget: number;
  budgetUsageRate: number;
}

export type BaselinePeriod = '1y' | '6m' | 'ever';

export interface CategoryContribution {
  categoryId: number;
  categoryName: string;
  categoryColor: ColorName;
  monthlyAverage: number;
}

export interface EssentialBaselineMetrics {
  period: BaselinePeriod;
  monthsIncluded: number;
  isLowSample: boolean;
  monthlyAverage: number;
  monthlyMedian: number;
  stdDev: number;
  min: number;
  max: number;
  categoryBreakdown: CategoryContribution[];
  avgMonthlyIncome: number;
  percentOfIncome: number;
  totalMonthlyAverage: number;
}

export interface RunwayMetrics {
  totalBalance: number;
  conservativeRunwayMonths: number | null;
  currentHabitsRunwayMonths: number | null;
}
