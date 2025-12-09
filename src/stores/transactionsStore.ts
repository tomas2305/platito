import { db } from '../db';
import type { Transaction } from '../types';
import { getAccountById } from './accountsStore';
import { getCategoryById } from './categoriesStore';

export type CreateTransactionInput = {
  accountId: number;
  categoryId: number;
  amount: number;
  description: string;
  date: string; // ISO string
  tagIds: number[];
};

const assertPositiveAmount = (amount: number): void => {
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    throw new Error('Amount must be greater than 0');
  }
};

export const getAllTransactions = async (): Promise<Transaction[]> => {
  const txs = await db.transactions.toArray();
  return txs.sort((a, b) => b.date.localeCompare(a.date));
};

export const createTransaction = async (input: CreateTransactionInput): Promise<number> => {
  assertPositiveAmount(input.amount);

  const account = await getAccountById(input.accountId);
  if (!account) {
    throw new Error('Account not found');
  }

  const category = await getCategoryById(input.categoryId);
  if (!category) {
    throw new Error('Category not found');
  }

  const transaction: Omit<Transaction, 'id'> = {
    accountId: account.id!,
    categoryId: category.id!,
    type: category.type,
    amount: input.amount,
    currency: account.currency,
    date: input.date,
    description: input.description,
    tagIds: input.tagIds ?? [],
  };

  return db.transactions.add(transaction);
};

export const updateTransaction = async (
  id: number,
  patch: Partial<CreateTransactionInput>,
): Promise<void> => {
  const current = await db.transactions.get(id);
  if (!current) {
    throw new Error('Transaction not found');
  }

  const nextAccountId = patch.accountId ?? current.accountId;
  const nextCategoryId = patch.categoryId ?? current.categoryId;
  const nextAmount = patch.amount ?? current.amount;
  const nextDate = patch.date ?? current.date;
  const nextDescription = patch.description ?? current.description;
  const nextTagIds = patch.tagIds ?? current.tagIds;

  assertPositiveAmount(nextAmount);

  const account = await getAccountById(nextAccountId);
  if (!account) {
    throw new Error('Account not found');
  }

  const category = await getCategoryById(nextCategoryId);
  if (!category) {
    throw new Error('Category not found');
  }

  await db.transactions.update(id, {
    accountId: account.id!,
    categoryId: category.id!,
    type: category.type,
    amount: nextAmount,
    currency: account.currency,
    date: nextDate,
    description: nextDescription,
    tagIds: nextTagIds,
  });
};

export const deleteTransaction = async (id: number): Promise<void> => {
  await db.transactions.delete(id);
};
