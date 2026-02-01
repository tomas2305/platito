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
}

export interface Category {
  id?: number;
  name: string;
  type: TransactionType;
  color: ColorName;
  icon: string;
  isDefault?: boolean;
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
}
