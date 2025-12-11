import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Group,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
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
    <Stack gap="lg">
      <Title order={2}>Settings</Title>

      <Card shadow="sm" radius="md" padding="lg" withBorder>
        <Stack gap="sm">
          <Title order={3}>Database</Title>
          <Text size="sm" c="dimmed">
            Active DB: {activeDb === dbLabels.testing ? 'Testing' : 'Main'} ({activeDb})
          </Text>
          <Group gap="sm" wrap="wrap">
            <Button
              type="button"
              onClick={() => handleSwitchDatabase('main')}
              disabled={loading || activeDb === dbLabels.main}
            >
              Use Main DB
            </Button>
            <Button
              type="button"
              variant="light"
              onClick={() => handleSwitchDatabase('testing')}
              disabled={loading || activeDb === dbLabels.testing}
            >
              Use Testing DB
            </Button>
          </Group>
          <DatabaseImportExport activeDb={activeDb} />
          <Text size="sm" c="dimmed">
            Switching keeps each database isolated. Testing DB seeds sample data on first use.
          </Text>
        </Stack>
      </Card>

      <Card shadow="xs" radius="md" padding="lg" withBorder>
        <Stack gap="md">
          <Title order={3}>Defaults</Title>
          <Stack gap="sm">
            <Select
              label="Default account"
              placeholder="None"
              value={settings?.defaultAccountId ? String(settings.defaultAccountId) : ''}
              onChange={(value) => handleDefaultAccountChange(value ?? '')}
              data={[{ label: 'None', value: '' }, ...accounts.map((acc) => ({ label: acc.name, value: String(acc.id) }))]}
            />

            <Select
              label="Default time window"
              value={settings?.defaultTimeWindow ?? 'month'}
              onChange={(value) => value && handleTimeWindowChange(value as TimeWindow)}
              data={[
                { value: 'day', label: 'Day' },
                { value: 'week', label: 'Week' },
                { value: 'month', label: 'Month' },
                { value: 'year', label: 'Year' },
              ]}
            />

            <Select
              label="Display currency"
              value={displayCurrency}
              onChange={(value) => value && handleDisplayCurrencyChange(value as Currency)}
              data={SUPPORTED_CURRENCIES.map((c) => ({ label: c, value: c }))}
            />
          </Stack>
        </Stack>
      </Card>

      <Card shadow="xs" radius="md" padding="lg" withBorder>
        <Stack gap="sm">
          <Title order={3}>Exchange Rates (to ARS)</Title>
          <Text size="sm" c="dimmed">
            ARS is fixed to 1. Other currencies must be &gt; 0.
          </Text>
          <Stack gap="sm">
            {SUPPORTED_CURRENCIES.map((c) => (
              <TextInput
                key={c}
                label={`${c} to ARS`}
                type="text"
                inputMode="decimal"
                value={formattedExchangeRates[c]}
                onChange={(e) => handleRateChange(c, e.target.value)}
                disabled={c === 'ARS'}
              />
            ))}
          </Stack>
          {errors && <Text c="red" size="sm">{errors}</Text>}
          <Button type="button" onClick={handleSaveRates}>Save Rates</Button>
        </Stack>
      </Card>

      <Card shadow="xs" radius="md" padding="lg" withBorder>
        <Stack gap="sm">
          <Title order={3}>Reset Data</Title>
          <Text size="sm" c="dimmed">
            This will clear accounts, transactions, tags, settings, and categories, then restore defaults.
          </Text>
          <Button type="button" color="red" variant="light" onClick={handleResetDatabase} disabled={loading}>
            Reset Database
          </Button>
        </Stack>
      </Card>
    </Stack>
  );
};
