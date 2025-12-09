import { db } from '../db';
import type { AppSettings, Currency, ExchangeRates } from '../types';
import { ensureDefaultCategories } from './categoriesStore';

const SETTINGS_ID = 1;

const AVAILABLE_CURRENCIES: Currency[] = ['ARS', 'USD_BLUE', 'USD_MEP', 'USDT'];

const DEFAULT_EXCHANGE_RATES: ExchangeRates = {
  ARS: { toARS: 1 },
  USD_BLUE: { toARS: 1 },
  USD_MEP: { toARS: 1 },
  USDT: { toARS: 1 },
};

const withDefaults = (settings: Partial<AppSettings>): AppSettings => ({
  id: SETTINGS_ID,
  defaultAccountId: settings.defaultAccountId,
  defaultTimeWindow: settings.defaultTimeWindow ?? 'month',
  displayCurrency: settings.displayCurrency ?? 'ARS',
  exchangeRates: normalizeExchangeRates(settings.exchangeRates),
});

const normalizeExchangeRates = (
  exchangeRates?: ExchangeRates
): ExchangeRates => {
  const normalized: ExchangeRates = { ...DEFAULT_EXCHANGE_RATES };

  if (exchangeRates) {
    for (const currency of AVAILABLE_CURRENCIES) {
      const candidate = exchangeRates[currency]?.toARS;
      if (isValidRate(candidate, currency)) {
        const value = currency === 'ARS' ? 1 : (candidate ?? 1);
        normalized[currency] = { toARS: value };
      }
    }
  }

  normalized.ARS = { toARS: 1 };
  return normalized;
};

const isValidRate = (value: number | undefined, currency: Currency): boolean => {
  if (currency === 'ARS') return true;
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
};

const validateSettings = (settings: Partial<AppSettings>): void => {
  if (settings.displayCurrency && !AVAILABLE_CURRENCIES.includes(settings.displayCurrency)) {
    throw new Error('Invalid display currency');
  }

  if (settings.exchangeRates) {
    for (const currency of AVAILABLE_CURRENCIES) {
      const rate = settings.exchangeRates?.[currency]?.toARS;
      if (currency === 'ARS') {
        if (rate !== undefined && rate !== 1) {
          throw new Error('ARS toARS must be 1');
        }
      } else if (!isValidRate(rate, currency)) {
        throw new Error(`Invalid rate for ${currency}`);
      }
    }
  }
};

export const initializeSettings = async (): Promise<AppSettings> => {
  const existing = await db.settings.get(SETTINGS_ID);
  
  if (existing) {
    const normalized = withDefaults(existing);
    await db.settings.update(SETTINGS_ID, normalized);
    return normalized;
  }

  const newSettings = withDefaults({});
  await db.settings.add(newSettings);
  return newSettings;
};

export const getSettings = async (): Promise<AppSettings | undefined> => {
  const existing = await db.settings.get(SETTINGS_ID);
  if (!existing) return undefined;

  const normalized = withDefaults(existing);
  if (existing !== normalized) {
    await db.settings.update(SETTINGS_ID, normalized);
  }
  return normalized;
};

export const updateSettings = async (
  patch: Partial<Omit<AppSettings, 'id'>>
): Promise<void> => {
  validateSettings(patch);

  const current = await getSettings();
  const merged = withDefaults({ ...current, ...patch });

  // Enforce ARS base rule
  merged.exchangeRates.ARS = { toARS: 1 };

  await db.settings.update(SETTINGS_ID, merged);
};

export const resetDatabase = async (): Promise<void> => {
  await db.transaction('rw', [db.accounts, db.categories, db.tags, db.transactions, db.settings], async () => {
    await db.transactions.clear();
    await db.accounts.clear();
    await db.categories.clear();
    await db.tags.clear();
    await db.settings.clear();
  });

  await initializeSettings();
  await ensureDefaultCategories();
};
