import Dexie, { type Table } from 'dexie';
import type {
  Account,
  Category,
  Tag,
  Transaction,
  AppSettings,
} from '../types';

export class PlatitoDB extends Dexie {
  accounts!: Table<Account, number>;
  categories!: Table<Category, number>;
  tags!: Table<Tag, number>;
  transactions!: Table<Transaction, number>;
  settings!: Table<AppSettings, number>;

  constructor() {
    super('platito_db');

    // v1: initial schema
    // v2: settings includes displayCurrency and exchangeRates
    this.version(2).stores({
      accounts: '++id, name, currency, isArchived',
      categories: '++id, name, type',
      tags: '++id, name',
      transactions: '++id, accountId, categoryId, type, date, *tagIds',
      settings: '++id',
    });
  }
}
