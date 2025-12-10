import { useEffect, useMemo, useState } from 'react';
import { Group, Title } from '@mantine/core';
import { DashboardFilters } from '../components/DashboardFilters';
import { DashboardCharts } from '../components/DashboardCharts';
import { CategoryBreakdown } from '../components/CategoryBreakdown';
import { ActionToggle } from '../components/ActionToggle';
import { getAllAccounts } from '../stores/accountsStore';
import { getAllCategories } from '../stores/categoriesStore';
import { getAllTransactions } from '../stores/transactionsStore';
import { getSettings, initializeSettings } from '../stores/settingsStore';
import { convertToARS } from '../utils/currency';
import { formatMonetaryValue } from '../utils/formatters';
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

  const computeTotal = (
    accountsList: Account[],
    rates: ExchangeRates,
    displayCurrency: Currency
  ): number => {
    const totalARS = accountsList.reduce((sum, acc) => {
      return sum + convertToARS(acc.initialBalance, acc.currency, rates);
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

      // Set default account filter if available
      if (loadedSettings.defaultAccountId && allAccounts.some(acc => acc.id === loadedSettings.defaultAccountId)) {
        setAccountFilter(loadedSettings.defaultAccountId);
      } else {
        setAccountFilter(null);
      }

      const total = computeTotal(
        allAccounts,
        loadedSettings.exchangeRates,
        loadedSettings.displayCurrency,
      );
      setTotalDisplay(formatMonetaryValue(String(total)));
      setLoading(false);
    };

    load();
  }, []);

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

  const filtered = useMemo(() => {
    const now = new Date();
    return transactions.filter((tx) => {
      if (tx.type !== typeFilter) return false;
      if (accountFilter !== null && tx.accountId !== accountFilter) return false;
      const txDate = new Date(tx.date);
      if (Number.isNaN(txDate.getTime())) return false;
      if (txDate > now) return false;
      return txDate >= startOfPeriod;
    });
  }, [transactions, typeFilter, accountFilter, startOfPeriod]);

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
    return byCategory.map((x, idx) => {
      const hues = [0, 30, 60, 120, 180, 240, 270, 330];
      const hue = hues[idx % hues.length];
      return {
        name: x.category.name,
        value: x.amount,
        fill: `hsl(${hue}, 70%, 60%)`,
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
          const txDate = new Date(tx.date);
          if (Number.isNaN(txDate.getTime())) return false;
          return txDate >= periodStart && txDate < periodEnd;
        })
        .reduce((sum, tx) => sum + tx.amount, 0);

      periods.push({ date: label, amount });
    }

    return periods;
  }, [transactions, typeFilter, accountFilter, timeWindow, rangeOffset]);

  const periodLabel = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (timeWindow === 'day') {
      const d = new Date(now);
      d.setDate(now.getDate() - rangeOffset);
      return d.toISOString().slice(0, 10);
    }

    if (timeWindow === 'week') {
      const start = new Date(now);
      const day = (now.getDay() + 6) % 7;
      start.setDate(now.getDate() - day - rangeOffset * 7);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return `${start.toISOString().slice(0, 10)} to ${end.toISOString().slice(0, 10)}`;
    }

    if (timeWindow === 'month') {
      const d = new Date(now.getFullYear(), now.getMonth() - rangeOffset, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }

    return String(now.getFullYear() - rangeOffset);
  }, [timeWindow, rangeOffset]);

  const disableNext = rangeOffset === 0;

  const handlePrevPeriod = () => setRangeOffset((prev) => prev + 1);
  const handleNextPeriod = () => {
    if (!disableNext) setRangeOffset((prev) => prev - 1);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <Group justify="space-between" align="center" style={{ padding: '16px', paddingBottom: 0 }}>
        <Title order={2} size="h4">Platito</Title>
        <ActionToggle />
      </Group>
      <main style={{ padding: '16px' }}>
        <section style={{ marginTop: '12px' }}>
          <h2>Total Balance</h2>
          <p style={{ fontSize: '1.2rem', fontWeight: 600 }}>
            {totalDisplay} {settings?.displayCurrency ?? 'ARS'}
          </p>
        </section>

        <section style={{ marginTop: '24px' }}>
          <h2>Dashboard</h2>
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
          <div style={{ marginTop: '24px' }}>
            <h3>Category Breakdown</h3>
            <CategoryBreakdown data={byCategory} total={totalAmount} />
          </div>
        </section>
      </main>
    </div>
  );
};

