export type TransactionType = 'expense' | 'income';

export type TimeWindow = 'day' | 'week' | 'month' | 'year';

export interface Account {
  id?: number;
  name: string;
  currency: string;
  initialBalance: number;
  color: string;
  icon: string;
  isArchived: boolean;
}

export interface Category {
  id?: number;
  name: string;
  type: TransactionType;
  color: string;
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
  currency: string;
  date: string;
  description: string;
  tagIds: number[];
}

export interface AppSettings {
  id?: number;
  defaultAccountId?: number;
  defaultTimeWindow: TimeWindow;
}
