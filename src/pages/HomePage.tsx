import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Grid, Group, Stack, Text, Title } from '@mantine/core';
import { DashboardFilters } from '../components/DashboardFilters';
import { DashboardCharts } from '../components/DashboardCharts';
import { CategoryBreakdown } from '../components/CategoryBreakdown';
import { ActionToggle } from '../components/ActionToggle';
import { getAllAccounts } from '../stores/accountsStore';
import { getAllCategories } from '../stores/categoriesStore';
import { getAllTransactions } from '../stores/transactionsStore';
import { autoUpdateExchangeRates, fetchAndUpdateExchangeRates, getSettings, initializeSettings } from '../stores/settingsStore';
import { convertAmount, convertToARS } from '../utils/currency';
import { formatMonetaryValue } from '../utils/formatters';
import { formatPeriodLabel } from '../utils/dateFormatters';
import type { Account, AppSettings, Category, Currency, ExchangeRates, Transaction, TransactionType, TimeWindow } from '../types';

export const HomePage = () => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalDisplay, setTotalDisplay] = useState<string>('0');
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<TransactionType>('expense');
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('month');
  const [rangeOffset, setRangeOffset] = useState(0);
  const [accountFilter, setAccountFilter] = useState<number | null>(null);
  const [fetchingRates, setFetchingRates] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);

  const isBalanceNegative = useMemo(() => {
    return totalDisplay.startsWith('-');
  }, [totalDisplay]);

  const computeTotal = (
    accountsList: Account[],
    transactionsList: Transaction[],
    rates: ExchangeRates,
    displayCurrency: Currency
  ): number => {
    // Calculate balance for each account including transactions
    const accountBalances = accountsList.map(acc => {
      // Start with initial balance
      let balance = acc.initialBalance;
      
      // Add/subtract transactions for this account
      const accountTransactions = transactionsList.filter(tx => tx.accountId === acc.id);
      for (const tx of accountTransactions) {
        // Convert transaction amount to account currency
        const amountInAccountCurrency = convertAmount(
          tx.amount,
          tx.currency,
          acc.currency,
          rates
        );
        
        if (tx.type === 'income') {
          balance += amountInAccountCurrency;
        } else {
          balance -= amountInAccountCurrency;
        }
      }
      
      return { currency: acc.currency, balance };
    });

    // Convert all balances to ARS
    const totalARS = accountBalances.reduce((sum, acc) => {
      return sum + convertToARS(acc.balance, acc.currency, rates);
    }, 0);

    if (displayCurrency === 'ARS') {
      return totalARS;
    }

    const divisor = rates[displayCurrency]?.toARS ?? 1;
    return divisor === 0 ? totalARS : totalARS / divisor;
  };

  useEffect(() => {
    const load = async () => {
      const [allAccounts, loadedSettings, allCategories, allTransactions] = await Promise.all([
        getAllAccounts(),
        getSettings().then((s) => s ?? initializeSettings()),
        getAllCategories(),
        getAllTransactions(),
      ]);

      setAccounts(allAccounts);
      setCategories(allCategories);
      setTransactions(allTransactions);
      setSettings(loadedSettings);

      if (loadedSettings.defaultAccountId && allAccounts.some(acc => acc.id === loadedSettings.defaultAccountId)) {
        setAccountFilter(loadedSettings.defaultAccountId);
      } else {
        setAccountFilter(null);
      }

      const newRates = await autoUpdateExchangeRates();
      const ratesToUse = newRates ?? loadedSettings.exchangeRates;
      
      if (newRates) {
        setSettings(prev => prev ? { ...prev, exchangeRates: newRates } : loadedSettings);
      }

      const total = computeTotal(
        allAccounts,
        allTransactions,
        ratesToUse,
        loadedSettings.displayCurrency,
      );
      setTotalDisplay(formatMonetaryValue(total.toFixed(2)));
      setLoading(false);
    };

    load();
  }, []);

  useEffect(() => {
    const MIN_UPDATE_INTERVAL_MS = 10000;

    const updateRemainingTime = () => {
      if (!settings?.lastFxUpdate) {
        setRemainingSeconds(0);
        return;
      }

      const timeSinceLastUpdate = Date.now() - new Date(settings.lastFxUpdate).getTime();
      const remaining = MIN_UPDATE_INTERVAL_MS - timeSinceLastUpdate;

      if (remaining <= 0) {
        setRemainingSeconds(0);
      } else {
        setRemainingSeconds(Math.ceil(remaining / 1000));
      }
    };

    updateRemainingTime();
    const interval = setInterval(updateRemainingTime, 1000);

    return () => clearInterval(interval);
  }, [settings?.lastFxUpdate]);

  const startOfPeriod = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (timeWindow === 'day') {
      const start = new Date(now);
      start.setDate(now.getDate() - rangeOffset);
      return start;
    }

    if (timeWindow === 'week') {
      const start = new Date(now);
      const day = (now.getDay() + 6) % 7;
      start.setDate(now.getDate() - day - rangeOffset * 7);
      return start;
    }

    if (timeWindow === 'month') {
      return new Date(now.getFullYear(), now.getMonth() - rangeOffset, 1);
    }

    return new Date(now.getFullYear() - rangeOffset, 0, 1);
  }, [timeWindow, rangeOffset]);

  const endOfPeriod = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (timeWindow === 'day') {
      const end = new Date(now);
      end.setDate(now.getDate() - rangeOffset + 1);
      return end;
    }

    if (timeWindow === 'week') {
      const start = new Date(now);
      const day = (now.getDay() + 6) % 7;
      start.setDate(now.getDate() - day - rangeOffset * 7);
      const end = new Date(start);
      end.setDate(start.getDate() + 7);
      return end;
    }

    if (timeWindow === 'month') {
      return new Date(now.getFullYear(), now.getMonth() - rangeOffset + 1, 1);
    }

    return new Date(now.getFullYear() - rangeOffset + 1, 0, 1);
  }, [timeWindow, rangeOffset]);

  const filtered = useMemo(() => {
    const now = new Date();
    return transactions.filter((tx) => {
      if (tx.type !== typeFilter) return false;
      if (accountFilter !== null && tx.accountId !== accountFilter) return false;
      // Parse date as local time (YYYY-MM-DD)
      const txDate = new Date(tx.date + 'T00:00:00');
      if (Number.isNaN(txDate.getTime())) return false;
      if (txDate > now) return false;
      return txDate >= startOfPeriod && txDate < endOfPeriod;
    });
  }, [transactions, typeFilter, accountFilter, startOfPeriod, endOfPeriod]);

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const byCategory = useMemo(() => {
    const data = new Map<number, { category: Category; amount: number }>();
    for (const tx of filtered) {
      const cat = categoryMap.get(tx.categoryId);
      if (!cat) continue;
      const current = data.get(tx.categoryId);
      if (current) {
        current.amount += tx.amount;
      } else {
        data.set(tx.categoryId, { category: cat, amount: tx.amount });
      }
    }
    return Array.from(data.values()).sort((a, b) => b.amount - a.amount);
  }, [filtered, categoryMap]);

  const totalAmount = useMemo(() => byCategory.reduce((sum, x) => sum + x.amount, 0), [byCategory]);

  const pieChartData = useMemo(() => {
    return byCategory.map((x) => {
      return {
        name: x.category.name,
        value: x.amount,
        fill: x.category.color,
      };
    });
  }, [byCategory]);

  const timeSeriesData = useMemo(() => {
    const NUM_PERIODS = 6;
    const periods: { date: string; amount: number }[] = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = NUM_PERIODS - 1; i >= 0; i--) {
      let periodStart: Date;
      let periodEnd: Date;
      let label: string;

      if (timeWindow === 'day') {
        periodStart = new Date(now);
        periodStart.setDate(now.getDate() - (rangeOffset + i));
        periodEnd = new Date(periodStart);
        periodEnd.setDate(periodStart.getDate() + 1);
        label = `${periodStart.getDate()} ${monthNames[periodStart.getMonth()]}`;
      } else if (timeWindow === 'week') {
        periodStart = new Date(now);
        const day = (now.getDay() + 6) % 7;
        periodStart.setDate(now.getDate() - day - (rangeOffset + i) * 7);
        periodEnd = new Date(periodStart);
        periodEnd.setDate(periodStart.getDate() + 7);
        label = `Week of ${periodStart.getDate()} ${monthNames[periodStart.getMonth()]}`;
      } else if (timeWindow === 'month') {
        const monthOffset = rangeOffset + i;
        periodStart = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth() - monthOffset + 1, 1);
        label = `${monthNames[periodStart.getMonth()]} ${periodStart.getFullYear()}`;
      } else {
        const yearOffset = rangeOffset + i;
        periodStart = new Date(now.getFullYear() - yearOffset, 0, 1);
        periodEnd = new Date(now.getFullYear() - yearOffset + 1, 0, 1);
        label = String(periodStart.getFullYear());
      }

      const amount = transactions
        .filter((tx) => {
          if (tx.type !== typeFilter) return false;
          if (accountFilter !== null && tx.accountId !== accountFilter) return false;
          // Parse date as local time (YYYY-MM-DD)
          const txDate = new Date(tx.date + 'T00:00:00');
          if (Number.isNaN(txDate.getTime())) return false;
          return txDate >= periodStart && txDate < periodEnd;
        })
        .reduce((sum, tx) => sum + tx.amount, 0);

      periods.push({ date: label, amount });
    }

    return periods;
  }, [transactions, typeFilter, accountFilter, timeWindow, rangeOffset]);

  const periodLabel = useMemo(() => {
    return formatPeriodLabel(timeWindow, startOfPeriod, endOfPeriod);
  }, [timeWindow, startOfPeriod, endOfPeriod]);

  const disableNext = rangeOffset === 0;

  const handlePrevPeriod = () => setRangeOffset((prev) => prev + 1);
  const handleNextPeriod = () => {
    if (!disableNext) setRangeOffset((prev) => prev - 1);
  };

  const handleFetchRates = async () => {
    setFetchingRates(true);
    try {
      const newRates = await fetchAndUpdateExchangeRates();
      const updatedSettings = await getSettings();
      setSettings(updatedSettings || null);
      
      const total = computeTotal(
        accounts,
        transactions,
        newRates,
        settings?.displayCurrency ?? 'ARS',
      );
      setTotalDisplay(formatMonetaryValue(total.toFixed(2)));
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error);
    } finally {
      setFetchingRates(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div style={{ padding: '12px', paddingTop: '16px' }}>
        <Grid gutter="md">
          <Grid.Col span={12}>
            <Card shadow="sm" padding="md" radius="md" withBorder>
              <Group justify="space-between" align="center">
                <div>
                  <Text size="sm" c="dimmed">Total Balance</Text>
                  <Text size="xl" fw={700} c={isBalanceNegative ? 'red' : undefined}>
                    {totalDisplay} {settings?.displayCurrency ?? 'ARS'}
                  </Text>
                </div>
                <Group gap="sm">
                  <Button 
                    variant="light" 
                    size="xs"
                    onClick={handleFetchRates}
                    loading={fetchingRates}
                    disabled={remainingSeconds > 0}
                  >
                    {remainingSeconds > 0 ? `${remainingSeconds}s` : 'Update Rates'}
                  </Button>
                  <ActionToggle />
                </Group>
              </Group>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, lg: 8 }}>
            <Card shadow="sm" padding="md" radius="md" withBorder>
              <Stack gap="md">
                <Title order={4} size="h5">Dashboard</Title>
                  <DashboardFilters
                    accounts={accounts}
                    typeFilter={typeFilter}
                    setTypeFilter={setTypeFilter}
                    accountFilter={accountFilter}
                    setAccountFilter={setAccountFilter}
                    timeWindow={timeWindow}
                    setTimeWindow={setTimeWindow}
                    periodLabel={periodLabel}
                    handlePrevPeriod={handlePrevPeriod}
                    handleNextPeriod={handleNextPeriod}
                    disableNext={disableNext}
                  />
                  <DashboardCharts
                    timeWindow={timeWindow}
                    timeSeriesData={timeSeriesData}
                    pieChartData={pieChartData}
                  />
                </Stack>
              </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, lg: 4 }}>
            <Card shadow="sm" padding="md" radius="md" withBorder>
              <Stack gap="md">
                <Title order={4} size="h5">Category Breakdown</Title>
                <CategoryBreakdown data={byCategory} total={totalAmount} />
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>
      </div>
    </div>
  );
};

