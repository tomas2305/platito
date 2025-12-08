import { db } from '../db';
import type { AppSettings } from '../types';

const SETTINGS_ID = 1;

export const initializeSettings = async (): Promise<AppSettings> => {
  const existing = await db.settings.get(SETTINGS_ID);
  
  if (existing) {
    return existing;
  }

  const newSettings: AppSettings = {
    id: SETTINGS_ID,
    defaultAccountId: undefined,
    defaultTimeWindow: 'month',
  };

  await db.settings.add(newSettings);
  return newSettings;
};

export const getSettings = async (): Promise<AppSettings | undefined> => {
  return db.settings.get(SETTINGS_ID);
};

export const updateSettings = async (
  patch: Partial<Omit<AppSettings, 'id'>>
): Promise<void> => {
  await db.settings.update(SETTINGS_ID, patch);
};
