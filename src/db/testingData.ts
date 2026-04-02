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
    
    // February - Transfer to USD Savings
    await createTransfer(
      {
        fromAccountId: accountIds[0],
        toAccountId: accountIds[2],
        amount: 200000,
        date: isoDaysAgo(7),
        description: 'February savings',
      },
      exchangeRates
    );

    // February - Transfer to Emergency Fund
    if (accountIds[4]) {
      await createTransfer(
        {
          fromAccountId: accountIds[0],
          toAccountId: accountIds[4],
          amount: 100000,
          date: isoDaysAgo(8),
          description: 'February emergency fund',
        },
        exchangeRates
      );
    }

    // January - Transfer to USD Savings
    await createTransfer(
      {
        fromAccountId: accountIds[0],
        toAccountId: accountIds[2],
        amount: 180000,
        date: isoDaysAgo(37),
        description: 'January savings',
      },
      exchangeRates
    );

    // January - Transfer to Emergency Fund
    if (accountIds[4]) {
      await createTransfer(
        {
          fromAccountId: accountIds[0],
          toAccountId: accountIds[4],
          amount: 120000,
          date: isoDaysAgo(38),
          description: 'January emergency fund',
        },
        exchangeRates
      );
    }

    // December - Transfer to USD Savings
    await createTransfer(
      {
        fromAccountId: accountIds[0],
        toAccountId: accountIds[2],
        amount: 150000,
        date: isoDaysAgo(67),
        description: 'December savings',
      },
      exchangeRates
    );

    // December - Transfer to Emergency Fund
    if (accountIds[4]) {
      await createTransfer(
        {
          fromAccountId: accountIds[0],
          toAccountId: accountIds[4],
          amount: 100000,
          date: isoDaysAgo(68),
          description: 'December emergency fund',
        },
        exchangeRates
      );
    }

    // November - Transfer to USD Savings
    await createTransfer(
      {
        fromAccountId: accountIds[0],
        toAccountId: accountIds[2],
        amount: 140000,
        date: isoDaysAgo(97),
        description: 'November savings',
      },
      exchangeRates
    );

    // October - Transfer to USD Savings
    await createTransfer(
      {
        fromAccountId: accountIds[0],
        toAccountId: accountIds[2],
        amount: 130000,
        date: isoDaysAgo(127),
        description: 'October savings',
      },
      exchangeRates
    );

    // September - Transfer to Emergency Fund (reduced to not meet target)
    if (accountIds[4]) {
      await createTransfer(
        {
          fromAccountId: accountIds[0],
          toAccountId: accountIds[4],
          amount: 5000,
          date: isoDaysAgo(157),
          description: 'September emergency fund',
        },
        exchangeRates
      );
    }

    // August - Transfer to USD Savings
    await createTransfer(
      {
        fromAccountId: accountIds[0],
        toAccountId: accountIds[2],
        amount: 120000,
        date: isoDaysAgo(187),
        description: 'August savings',
      },
      exchangeRates
    );

    // July - no transfer to emergency fund (to not meet target)
    // Skipped to create scenario where savings rate is low

    // June - Transfer to USD Savings
    await createTransfer(
      {
        fromAccountId: accountIds[0],
        toAccountId: accountIds[2],
        amount: 110000,
        date: isoDaysAgo(247),
        description: 'June savings',
      },
      exchangeRates
    );

    // May - Transfer to USD Savings (reduced to not meet target)
    await createTransfer(
      {
        fromAccountId: accountIds[0],
        toAccountId: accountIds[2],
        amount: 8000,
        date: isoDaysAgo(277),
        description: 'May savings',
      },
      exchangeRates
    );

    // April - Transfer to Emergency Fund
    if (accountIds[4]) {
      await createTransfer(
        {
          fromAccountId: accountIds[0],
          toAccountId: accountIds[4],
          amount: 70000,
          date: isoDaysAgo(307),
          description: 'April emergency fund',
        },
        exchangeRates
      );
    }

    // March - Transfer to USD Savings (reduced to not meet target)
    await createTransfer(
      {
        fromAccountId: accountIds[0],
        toAccountId: accountIds[2],
        amount: 5000,
        date: isoDaysAgo(337),
        description: 'March savings',
      },
      exchangeRates
    );

    // Regular transfer between accounts
    await createTransfer(
      {
        fromAccountId: accountIds[0],
        toAccountId: accountIds[1],
        amount: 50000,
        date: isoDaysAgo(30),
        description: 'Credit card payment',
      },
      exchangeRates
    );

    // Transfer to MEP account
    if (accountIds[3]) {
      await createTransfer(
        {
          fromAccountId: accountIds[0],
          toAccountId: accountIds[3],
          amount: 80000,
          date: isoDaysAgo(5),
          description: 'USD MEP investment',
        },
        exchangeRates
      );
    }
  }
};
