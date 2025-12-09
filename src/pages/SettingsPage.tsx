import { useEffect, useMemo, useState } from 'react';
import { getActiveDatabaseName, getDatabaseLabels, switchDatabase } from '../db';
import { seedTestingData } from '../db/testingData';
import { getAllAccounts } from '../stores/accountsStore';
import { getSettings, initializeSettings, resetDatabase, updateSettings } from '../stores/settingsStore';
import { ensureDefaultCategories } from '../stores/categoriesStore';
import type { AppSettings, Account, TimeWindow, Currency, ExchangeRates } from '../types';
import { SUPPORTED_CURRENCIES } from '../utils/currency';
import { formatMonetaryValue, parseMonetaryValue } from '../utils/formatters';
import { DatabaseImportExport } from '../components/DatabaseImportExport';

export const SettingsPage = () => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(null);
  const [displayCurrency, setDisplayCurrency] = useState<Currency>('ARS');
  const [errors, setErrors] = useState<string | null>(null);
  const [activeDb, setActiveDb] = useState<string>(getActiveDatabaseName());
  const dbLabels = getDatabaseLabels();

  useEffect(() => {
    const loadData = async () => {
      const [settingsData, accountsData] = await Promise.all([
        getSettings().then((s) => s ?? initializeSettings()),
        getAllAccounts(),
      ]);
      setSettings(settingsData || null);
      setExchangeRates(settingsData?.exchangeRates ?? null);
      setDisplayCurrency(settingsData?.displayCurrency ?? 'ARS');
      setAccounts(accountsData);
      setLoading(false);
    };
    loadData();
  }, []);

  const handleDefaultAccountChange = async (accountId: string) => {
    const id = accountId === '' ? undefined : Number(accountId);
    await updateSettings({ defaultAccountId: id });
    setSettings(prev => prev ? { ...prev, defaultAccountId: id } : null);
  };

  const handleTimeWindowChange = async (timeWindow: TimeWindow) => {
    await updateSettings({ defaultTimeWindow: timeWindow });
    setSettings(prev => prev ? { ...prev, defaultTimeWindow: timeWindow } : null);
  };

  const handleDisplayCurrencyChange = async (currency: Currency) => {
    await updateSettings({ displayCurrency: currency });
    setDisplayCurrency(currency);
    setSettings(prev => prev ? { ...prev, displayCurrency: currency } : null);
  };

  const validateRates = (rates: ExchangeRates): string | null => {
    for (const currency of SUPPORTED_CURRENCIES) {
      const value = rates[currency]?.toARS;
      if (currency === 'ARS') {
        if (value !== 1) return 'ARS must have toARS = 1';
      } else if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
        return `Invalid rate for ${currency}`;
      }
    }
    return null;
  };

  const handleRateChange = (currency: Currency, rawValue: string) => {
    setErrors(null);
    setExchangeRates((prev) => {
      const parsed = parseMonetaryValue(rawValue);
      const next = { ...(prev ?? {} as ExchangeRates) } as ExchangeRates;
      next[currency] = { toARS: currency === 'ARS' ? 1 : parsed };
      return next;
    });
  };

  const handleSaveRates = async () => {
    if (!exchangeRates) return;
    const error = validateRates(exchangeRates);
    if (error) {
      setErrors(error);
      return;
    }
    await updateSettings({ exchangeRates });
    setSettings(prev => prev ? { ...prev, exchangeRates } : null);
  };

  const handleResetDatabase = async () => {
    const confirmed = confirm('Reset all data to defaults? This removes accounts, transactions, tags, and categories.');
    if (!confirmed) return;
    setLoading(true);
    setErrors(null);
    await resetDatabase();
    const [settingsData, accountsData] = await Promise.all([
      getSettings(),
      getAllAccounts(),
    ]);
    setSettings(settingsData || null);
    setAccounts(accountsData);
    setExchangeRates(settingsData?.exchangeRates ?? null);
    setDisplayCurrency(settingsData?.displayCurrency ?? 'ARS');
    setLoading(false);
  };

  const handleSwitchDatabase = async (target: 'main' | 'testing') => {
    setLoading(true);
    setErrors(null);
    await switchDatabase(target);
    setActiveDb(getActiveDatabaseName());

    if (target === 'testing') {
      await seedTestingData();
    } else {
      await initializeSettings();
      await ensureDefaultCategories();
    }

    const [settingsData, accountsData] = await Promise.all([
      getSettings().then((s) => s ?? initializeSettings()),
      getAllAccounts(),
    ]);
    setSettings(settingsData || null);
    setAccounts(accountsData);
    setExchangeRates(settingsData?.exchangeRates ?? null);
    setDisplayCurrency(settingsData?.displayCurrency ?? 'ARS');
    setLoading(false);
  };

  const formattedExchangeRates = useMemo(() => {
    const rates: Record<Currency, string> = {
      ARS: '1',
      USD_BLUE: '1',
      USD_MEP: '1',
      USDT: '1',
    };
    for (const c of SUPPORTED_CURRENCIES) {
      const value = exchangeRates?.[c]?.toARS;
      rates[c] = c === 'ARS' ? '1' : formatMonetaryValue(String(value ?? ''));
    }
    return rates;
  }, [exchangeRates]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Settings</h1>

      <section style={{ marginTop: '16px' }}>
        <h2>Database</h2>
        <p style={{ fontSize: '0.9rem', color: '#555' }}>
          Active DB: {activeDb === dbLabels.testing ? 'Testing' : 'Main'} ({activeDb})
        </p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => handleSwitchDatabase('main')}
            disabled={loading || activeDb === dbLabels.main}
          >
            Use Main DB
          </button>
          <button
            type="button"
            onClick={() => handleSwitchDatabase('testing')}
            disabled={loading || activeDb === dbLabels.testing}
          >
            Use Testing DB
          </button>
        </div>
        <DatabaseImportExport activeDb={activeDb} />
        <p style={{ fontSize: '0.9rem', color: '#555' }}>
          Switching keeps each database isolated. Testing DB seeds sample data on first use.
        </p>
      </section>

      <section>
        <h2>Default Account</h2>
        <select
          value={settings?.defaultAccountId ?? ''}
          onChange={(e) => handleDefaultAccountChange(e.target.value)}
        >
          <option value="">None</option>
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.name}
            </option>
          ))}
        </select>
      </section>

      <section>
        <h2>Default Time Window</h2>
        <select
          value={settings?.defaultTimeWindow ?? 'month'}
          onChange={(e) => handleTimeWindowChange(e.target.value as TimeWindow)}
        >
          <option value="day">Day</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
          <option value="year">Year</option>
        </select>
      </section>

      <section>
        <h2>Display Currency</h2>
        <select
          value={displayCurrency}
          onChange={(e) => handleDisplayCurrencyChange(e.target.value as Currency)}
        >
          {SUPPORTED_CURRENCIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </section>

      <section>
        <h2>Exchange Rates (to ARS)</h2>
        <p style={{ fontSize: '0.9rem', color: '#555' }}>
          ARS is fixed to 1. Other currencies must be &gt; 0.
        </p>
        {SUPPORTED_CURRENCIES.map((c) => (
          <div key={c} style={{ marginBottom: '8px' }}>
            <label>
              {c} to ARS:
              {' '}
              <input
                type="text"
                inputMode="decimal"
                value={formattedExchangeRates[c]}
                onChange={(e) => handleRateChange(c, e.target.value)}
                disabled={c === 'ARS'}
              />
            </label>
          </div>
        ))}
        {errors && <p style={{ color: 'red' }}>{errors}</p>}
        <button type="button" onClick={handleSaveRates}>Save Rates</button>
      </section>

      <section style={{ marginTop: '16px' }}>
        <h2>Reset Data</h2>
        <p style={{ fontSize: '0.9rem', color: '#555' }}>
          This will clear accounts, transactions, tags, settings, and categories, then restore defaults.
        </p>
        <button type="button" onClick={handleResetDatabase} disabled={loading}>
          Reset Database
        </button>
      </section>
    </div>
  );
};
