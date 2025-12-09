import { db } from '../db';
import type { Account } from '../types';

export const createAccount = async (
  data: Omit<Account, 'id'>
): Promise<number> => {
  return db.accounts.add(data);
};

export const updateAccount = async (
  id: number,
  patch: Partial<Omit<Account, 'id'>>
): Promise<void> => {
  await db.accounts.update(id, patch);
};

export const getAllAccounts = async (): Promise<Account[]> => {
  return db.accounts.toArray();
};

export const getActiveAccounts = async (): Promise<Account[]> => {
  return db.accounts.filter(account => account.isArchived === false).toArray();
};

export const getArchivedAccounts = async (): Promise<Account[]> => {
  return db.accounts.filter(account => account.isArchived === true).toArray();
};

export const archiveAccount = async (id: number): Promise<void> => {
  await db.accounts.update(id, { isArchived: true });
};

export const unarchiveAccount = async (id: number): Promise<void> => {
  await db.accounts.update(id, { isArchived: false });
};

export const deleteAccount = async (id: number): Promise<void> => {
  await db.accounts.delete(id);
};

export const getAccountById = async (
  id: number
): Promise<Account | undefined> => {
  return db.accounts.get(id);
};
