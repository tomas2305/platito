import { getDB } from '../db';
import type { Account } from '../types';

export const createAccount = async (
  data: Omit<Account, 'id'>
): Promise<number> => {
  const db = getDB();
  return db.accounts.add(data);
};

export const updateAccount = async (
  id: number,
  patch: Partial<Omit<Account, 'id'>>
): Promise<void> => {
  const db = getDB();
  await db.accounts.update(id, patch);
};

export const getAllAccounts = async (): Promise<Account[]> => {
  const db = getDB();
  return db.accounts.toArray();
};

export const getActiveAccounts = async (): Promise<Account[]> => {
  const db = getDB();
  return db.accounts.filter(account => account.isArchived === false).toArray();
};

export const getArchivedAccounts = async (): Promise<Account[]> => {
  const db = getDB();
  return db.accounts.filter(account => account.isArchived === true).toArray();
};

export const archiveAccount = async (id: number): Promise<void> => {
  const db = getDB();
  await db.accounts.update(id, { isArchived: true });
};

export const unarchiveAccount = async (id: number): Promise<void> => {
  const db = getDB();
  await db.accounts.update(id, { isArchived: false });
};

export const deleteAccount = async (id: number): Promise<void> => {
  const db = getDB();
  await db.accounts.delete(id);
};

export const getAccountById = async (
  id: number
): Promise<Account | undefined> => {
  const db = getDB();
  return db.accounts.get(id);
};
