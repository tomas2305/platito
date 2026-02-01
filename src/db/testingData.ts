import { getDB } from './index';
import { ensureDefaultCategories } from '../stores/categoriesStore';
import { createTransaction } from '../stores/transactionsStore';
import { createTransfer } from '../stores/transfersStore';
import { initializeSettings, getSettings } from '../stores/settingsStore';
import type { Category, TransactionType } from '../types';
import testingDataJSON from './testingData.json';

const findCategoryId = async (name: string, type: Category['type']): Promise<number> => {
  const db = getDB();
  const found = await db.categories
    .where('name')
    .equals(name)
    .and((cat) => cat.type === type)
    .first();

  if (!found?.id) {
    throw new Error(`Testing data setup failed: missing category ${name} (${type})`);
  }

  return found.id;
};

const findOrCreateTag = async (name: string): Promise<number> => {
  const db = getDB();
  const found = await db.tags
    .where('name')
    .equals(name)
    .first();

  if (found?.id) {
    return found.id;
  }

  return db.tags.add({ name });
};

const isoDaysAgo = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const seedTestingData = async (): Promise<void> => {
  const db = getDB();
  const [accCount, txCount] = await Promise.all([
    db.accounts.count(),
    db.transactions.count(),
  ]);

  if (accCount > 0 || txCount > 0) {
    return;
  }

  await initializeSettings();
  await ensureDefaultCategories();

  // Add a few test-only categories if they don't exist
  const testCategories = [
    { name: 'Test Expenses', type: 'expense' as TransactionType, icon: 'alert' },
    { name: 'Test Income', type: 'income' as TransactionType, icon: 'badge-dollar' },
    { name: 'Sandbox', type: 'expense' as TransactionType, icon: 'flask' },
  ];

  for (const cat of testCategories) {
    const existing = await db.categories
      .where('name')
      .equals(cat.name)
      .and((c) => c.type === cat.type)
      .first();
    if (!existing) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await db.categories.add({ ...cat, isDefault: false } as any);
    }
  }

  // Create accounts from JSON
  const accountIds: number[] = [];
  for (const acc of testingDataJSON.accounts) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const id = await db.accounts.add(acc as any);
    accountIds.push(id);
  }

  // Create tags from JSON
  const tagIdMap = new Map<string, number>();
  for (const tag of testingDataJSON.tags) {
    const id = await findOrCreateTag(tag.name);
    tagIdMap.set(tag.name, id);
  }

  // Create transactions from JSON
  for (const txData of testingDataJSON.transactions) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const categoryId = await findCategoryId(txData.categoryName, txData.type as any);
    const accountId = accountIds[txData.accountIndex];

    if (!accountId) {
      console.warn(`Account index ${txData.accountIndex} not found, skipping transaction`);
      continue;
    }

    const tagIds = txData.tagNames
      .map((name) => tagIdMap.get(name))
      .filter((id): id is number => id !== undefined);

    await createTransaction({
      accountId,
      categoryId,
      amount: txData.amount,
      description: txData.description,
      date: isoDaysAgo(txData.daysAgo),
      tagIds,
    });
  }

  // Create sample transfers
  const settings = await getSettings();
  if (settings && accountIds.length >= 2) {
    const exchangeRates = settings.exchangeRates;
    
    // Transfer 1: ARS account to USD account (30 days ago)
    await createTransfer(
      {
        fromAccountId: accountIds[0],
        toAccountId: accountIds[1],
        amount: 100000,
        date: isoDaysAgo(30),
        description: 'Compra de dólares',
      },
      exchangeRates
    );

    // Transfer 2: USD account to USDT account (15 days ago)
    await createTransfer(
      {
        fromAccountId: accountIds[1],
        toAccountId: accountIds[2],
        amount: 50,
        date: isoDaysAgo(15),
        description: 'Inversión en USDT',
      },
      exchangeRates
    );

    // Transfer 3: ARS account to USD_MEP account (5 days ago)
    if (accountIds[3]) {
      await createTransfer(
        {
          fromAccountId: accountIds[0],
          toAccountId: accountIds[3],
          amount: 50000,
          date: isoDaysAgo(5),
          description: 'Compra de dólares MEP',
        },
        exchangeRates
      );
    }
  }
};
