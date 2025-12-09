import Dexie, { type Table } from 'dexie';
import type {
  Account,
  Category,
  Tag,
  Transaction,
  AppSettings,
} from '../types';
import { getColorName } from '../utils/colors';

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
    // v3: categories include icon and isDefault
    // v4: color fields converted from hex to ColorName
    this.version(3).stores({
      accounts: '++id, name, currency, isArchived',
      categories: '++id, name, type, icon, isDefault',
      tags: '++id, name',
      transactions: '++id, accountId, categoryId, type, date, *tagIds',
      settings: '++id',
    }).upgrade((tx) => {
      return tx.table('categories').toCollection().modify((category) => {
        if (!('icon' in category)) category.icon = 'tag';
        if (!('isDefault' in category)) category.isDefault = false;
      });
    });

    this.version(4).stores({
      accounts: '++id, name, currency, isArchived',
      categories: '++id, name, type, icon, isDefault',
      tags: '++id, name',
      transactions: '++id, accountId, categoryId, type, date, *tagIds',
      settings: '++id',
    }).upgrade((tx) => {
      // Convert account colors from hex to color names
      return Promise.all([
        tx.table('accounts').toCollection().modify((account) => {
          if (account.color?.startsWith('#')) {
            account.color = getColorName(account.color);
          }
        }),
        tx.table('categories').toCollection().modify((category) => {
          if (category.color?.startsWith('#')) {
            category.color = getColorName(category.color);
          }
        }),
      ]);
    });
  }
}
