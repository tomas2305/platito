import { getDB } from '../db';
import type { Transfer, ExchangeRates } from '../types';
import { getAccountById } from './accountsStore';
import { convertAmount } from '../utils/currency';

export type CreateTransferInput = {
  fromAccountId: number;
  toAccountId: number;
  amount: number;
  date: string;
  description?: string;
};

const assertPositiveAmount = (amount: number): void => {
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    throw new Error('Amount must be greater than 0');
  }
};

export const getAllTransfers = async (): Promise<Transfer[]> => {
  const db = getDB();
  const transfers = await db.transfers.toArray();
  return transfers.sort((a, b) => b.date.localeCompare(a.date));
};

export const getTransferById = async (id: number): Promise<Transfer | undefined> => {
  const db = getDB();
  return db.transfers.get(id);
};

export const createTransfer = async (
  input: CreateTransferInput,
  exchangeRates: ExchangeRates
): Promise<number> => {
  const db = getDB();
  assertPositiveAmount(input.amount);

  if (input.fromAccountId === input.toAccountId) {
    throw new Error('Cannot transfer to the same account');
  }

  const fromAccount = await getAccountById(input.fromAccountId);
  if (!fromAccount) {
    throw new Error('Source account not found');
  }

  const toAccount = await getAccountById(input.toAccountId);
  if (!toAccount) {
    throw new Error('Destination account not found');
  }

  const convertedAmount = convertAmount(
    input.amount,
    fromAccount.currency,
    toAccount.currency,
    exchangeRates
  );

  const exchangeRate = convertedAmount / input.amount;

  const now = new Date().toISOString();

  const transfer: Omit<Transfer, 'id'> = {
    fromAccountId: input.fromAccountId,
    toAccountId: input.toAccountId,
    amount: input.amount,
    convertedAmount,
    exchangeRate,
    date: input.date,
    description: input.description || '',
    createdAt: now,
    updatedAt: now,
  };

  return db.transfers.add(transfer);
};

export const updateTransfer = async (
  id: number,
  patch: Partial<CreateTransferInput>,
  exchangeRates: ExchangeRates
): Promise<void> => {
  const db = getDB();
  const current = await db.transfers.get(id);
  if (!current) {
    throw new Error('Transfer not found');
  }

  const nextFromAccountId = patch.fromAccountId ?? current.fromAccountId;
  const nextToAccountId = patch.toAccountId ?? current.toAccountId;
  const nextAmount = patch.amount ?? current.amount;
  const nextDate = patch.date ?? current.date;
  const nextDescription = patch.description ?? current.description ?? '';

  assertPositiveAmount(nextAmount);

  if (nextFromAccountId === nextToAccountId) {
    throw new Error('Cannot transfer to the same account');
  }

  const fromAccount = await getAccountById(nextFromAccountId);
  if (!fromAccount) {
    throw new Error('Source account not found');
  }

  const toAccount = await getAccountById(nextToAccountId);
  if (!toAccount) {
    throw new Error('Destination account not found');
  }

  const convertedAmount = convertAmount(
    nextAmount,
    fromAccount.currency,
    toAccount.currency,
    exchangeRates
  );

  const exchangeRate = convertedAmount / nextAmount;

  await db.transfers.update(id, {
    fromAccountId: nextFromAccountId,
    toAccountId: nextToAccountId,
    amount: nextAmount,
    convertedAmount,
    exchangeRate,
    date: nextDate,
    description: nextDescription,
    updatedAt: new Date().toISOString(),
  });
};

export const deleteTransfer = async (id: number): Promise<void> => {
  const db = getDB();
  await db.transfers.delete(id);
};

export const getTransfersByDateRange = async (
  startDate: string,
  endDate: string
): Promise<Transfer[]> => {
  const db = getDB();
  const allTransfers = await db.transfers.toArray();
  return allTransfers
    .filter((transfer) => transfer.date >= startDate && transfer.date < endDate)
    .sort((a, b) => b.date.localeCompare(a.date));
};

export const getTransfersByAccount = async (
  accountId: number,
  direction: 'from' | 'to' | 'both' = 'both'
): Promise<Transfer[]> => {
  const db = getDB();
  const allTransfers = await db.transfers.toArray();
  
  return allTransfers
    .filter((transfer) => {
      if (direction === 'from') return transfer.fromAccountId === accountId;
      if (direction === 'to') return transfer.toAccountId === accountId;
      return transfer.fromAccountId === accountId || transfer.toAccountId === accountId;
    })
    .sort((a, b) => b.date.localeCompare(a.date));
};
