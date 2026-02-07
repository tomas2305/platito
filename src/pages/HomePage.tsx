import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Grid, Group, Select, Stack, Text, Title, ActionIcon } from '@mantine/core';
import { IconEye, IconEyeOff } from '@tabler/icons-react';
import { DashboardFilters } from '../components/DashboardFilters';
import { DashboardCharts } from '../components/DashboardCharts';
import { CategoryBreakdown } from '../components/CategoryBreakdown';
import { CurrencySelector } from '../components/CurrencySelector';
import { ActionToggle } from '../components/ActionToggle';
import { IncomeOutcomeComparison } from '../components/IncomeOutcomeComparison';
import { getAllAccounts } from '../stores/accountsStore';
import { getAllCategories } from '../stores/categoriesStore';
import { getAllTransactions } from '../stores/transactionsStore';
import { getAllTransfers } from '../stores/transfersStore';
import { AccountIcon } from '../components/AccountIcon';
import { autoUpdateExchangeRates, fetchAndUpdateExchangeRates, getSettings, initializeSettings } from '../stores/settingsStore';
import { convertAmount, convertToARS } from '../utils/currency';
import { formatNumberToMonetary } from '../utils/formatters';
import { formatPeriodLabel } from '../utils/dateFormatters';
import { getStartOfPeriod, getEndOfPeriod } from '../utils/periodHelpers';
import type { Account, AppSettings, Category, Currency, ExchangeRates, Transaction, Transfer, TransactionType, TimeWindow } from '../types';

export const HomePage = () => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [totalDisplay, setTotalDisplay] = useState<string>('0');
  const [accountBalanceDisplay, setAccountBalanceDisplay] = useState<string>('0');
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<TransactionType>('expense');
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('month');
  const [rangeOffset, setRangeOffset] = useState(0);
  const [accountFilter, setAccountFilter] = useState<number | null>(null);
  const [fetchingRates, setFetchingRates] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [isBalanceHidden, setIsBalanceHidden] = useState(true);

  const isBalanceNegative = useMemo(() => {
    return totalDisplay.startsWith('-');
  }, [totalDisplay]);

  const computeTotal = (
    accountsList: Account[],
    transactionsList: Transaction[],
    transfersList: Transfer[],
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
      
      // Add/subtract transfers for this account
      const accountTransfers = transfersList.filter(
        t => t.fromAccountId === acc.id || t.toAccountId === acc.id
      );
      for (const transfer of accountTransfers) {
        if (transfer.fromAccountId === acc.id) {
          balance -= transfer.amount;
        }
        if (transfer.toAccountId === acc.id) {
          balance += transfer.convertedAmount;
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

  const computeAccountBalance = (
    account: Account,
    transactionsList: Transaction[],
    transfersList: Transfer[],
    rates: ExchangeRates,
    displayCurrency: Currency
  ): number => {
    let balance = account.initialBalance;
    
    const accountTransactions = transactionsList.filter(tx => tx.accountId === account.id);
    for (const tx of accountTransactions) {
      const amountInAccountCurrency = convertAmount(
        tx.amount,
        tx.currency,
        account.currency,
        rates
      );
      
      if (tx.type === 'income') {
        balance += amountInAccountCurrency;
      } else {
        balance -= amountInAccountCurrency;
      }
    }
    
    const accountTransfers = transfersList.filter(
      t => t.fromAccountId === account.id || t.toAccountId === account.id
    );
    for (const transfer of accountTransfers) {
      if (transfer.fromAccountId === account.id) {
        balance -= transfer.amount;
      }
      if (transfer.toAccountId === account.id) {
        balance += transfer.convertedAmount;
      }
    }
    
    const balanceInARS = convertToARS(balance, account.currency, rates);
    
    if (displayCurrency === 'ARS') {
      return balanceInARS;
    }
    
    const divisor = rates[displayCurrency]?.toARS ?? 1;
    return divisor === 0 ? balanceInARS : balanceInARS / divisor;
  };

  useEffect(() => {
    const load = async () => {
      const [allAccounts, loadedSettings, allCategories, allTransactions, allTransfers] = await Promise.all([
        getAllAccounts(),
        getSettings().then((s) => s ?? initializeSettings()),
        getAllCategories(),
        getAllTransactions(),
        getAllTransfers(),
      ]);

      setAccounts(allAccounts);
      setCategories(allCategories);
      setTransactions(allTransactions);
      setTransfers(allTransfers);
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
        allTransfers,
        ratesToUse,
        loadedSettings.displayCurrency,
      );
      setTotalDisplay(formatNumberToMonetary(total));

      if (loadedSettings.defaultAccountId && allAccounts.some(acc => acc.id === loadedSettings.defaultAccountId)) {
        const selectedAccount = allAccounts.find(acc => acc.id === loadedSettings.defaultAccountId);
        if (selectedAccount) {
          const accountBalance = computeAccountBalance(
            selectedAccount,
            allTransactions,
            allTransfers,
            ratesToUse,
            loadedSettings.displayCurrency
          );
          setAccountBalanceDisplay(formatNumberToMonetary(accountBalance));
        }
      }

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

  const startOfPeriod = useMemo(() => getStartOfPeriod(timeWindow, rangeOffset), [timeWindow, rangeOffset]);
  const endOfPeriod = useMemo(() => getEndOfPeriod(timeWindow, rangeOffset), [timeWindow, rangeOffset]);
  
  const startOfPreviousPeriod = useMemo(() => getStartOfPeriod(timeWindow, rangeOffset + 1), [timeWindow, rangeOffset]);
  const endOfPreviousPeriod = useMemo(() => getEndOfPeriod(timeWindow, rangeOffset + 1), [timeWindow, rangeOffset]);

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

  const periodIncomeTotal = useMemo(() => {
    if (!settings) return 0;
    return transactions
      .filter((tx) => {
        if (tx.type !== 'income') return false;
        if (accountFilter !== null && tx.accountId !== accountFilter) return false;
        const txDate = new Date(tx.date + 'T00:00:00');
        if (Number.isNaN(txDate.getTime())) return false;
        const now = new Date();
        if (txDate > now) return false;
        return txDate >= startOfPeriod && txDate < endOfPeriod;
      })
      .reduce((sum, tx) => {
        const amountInARS = convertToARS(tx.amount, tx.currency, settings.exchangeRates);
        const amountInDisplayCurrency = settings.displayCurrency === 'ARS' 
          ? amountInARS 
          : amountInARS / (settings.exchangeRates[settings.displayCurrency]?.toARS ?? 1);
        return sum + amountInDisplayCurrency;
      }, 0);
  }, [transactions, accountFilter, startOfPeriod, endOfPeriod, settings]);

  const periodOutcomeTotal = useMemo(() => {
    if (!settings) return 0;
    return transactions
      .filter((tx) => {
        if (tx.type !== 'expense') return false;
        if (accountFilter !== null && tx.accountId !== accountFilter) return false;
        const txDate = new Date(tx.date + 'T00:00:00');
        if (Number.isNaN(txDate.getTime())) return false;
        const now = new Date();
        if (txDate > now) return false;
        return txDate >= startOfPeriod && txDate < endOfPeriod;
      })
      .reduce((sum, tx) => {
        const amountInARS = convertToARS(tx.amount, tx.currency, settings.exchangeRates);
        const amountInDisplayCurrency = settings.displayCurrency === 'ARS' 
          ? amountInARS 
          : amountInARS / (settings.exchangeRates[settings.displayCurrency]?.toARS ?? 1);
        return sum + amountInDisplayCurrency;
      }, 0);
  }, [transactions, accountFilter, startOfPeriod, endOfPeriod, settings]);

  const previousPeriodIncomeTotal = useMemo(() => {
    if (!settings) return 0;
    return transactions
      .filter((tx) => {
        if (tx.type !== 'income') return false;
        if (accountFilter !== null && tx.accountId !== accountFilter) return false;
        const txDate = new Date(tx.date + 'T00:00:00');
        if (Number.isNaN(txDate.getTime())) return false;
        return txDate >= startOfPreviousPeriod && txDate < endOfPreviousPeriod;
      })
      .reduce((sum, tx) => {
        const amountInARS = convertToARS(tx.amount, tx.currency, settings.exchangeRates);
        const amountInDisplayCurrency = settings.displayCurrency === 'ARS' 
          ? amountInARS 
          : amountInARS / (settings.exchangeRates[settings.displayCurrency]?.toARS ?? 1);
        return sum + amountInDisplayCurrency;
      }, 0);
  }, [transactions, accountFilter, startOfPreviousPeriod, endOfPreviousPeriod, settings]);

  const previousPeriodOutcomeTotal = useMemo(() => {
    if (!settings) return 0;
    return transactions
      .filter((tx) => {
        if (tx.type !== 'expense') return false;
        if (accountFilter !== null && tx.accountId !== accountFilter) return false;
        const txDate = new Date(tx.date + 'T00:00:00');
        if (Number.isNaN(txDate.getTime())) return false;
        return txDate >= startOfPreviousPeriod && txDate < endOfPreviousPeriod;
      })
      .reduce((sum, tx) => {
        const amountInARS = convertToARS(tx.amount, tx.currency, settings.exchangeRates);
        const amountInDisplayCurrency = settings.displayCurrency === 'ARS' 
          ? amountInARS 
          : amountInARS / (settings.exchangeRates[settings.displayCurrency]?.toARS ?? 1);
        return sum + amountInDisplayCurrency;
      }, 0);
  }, [transactions, accountFilter, startOfPreviousPeriod, endOfPreviousPeriod, settings]);

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

  const timelineData = useMemo(() => {
    if (timeWindow !== 'month') return [];
    
    const daysInMonth = new Date(
      startOfPeriod.getFullYear(),
      startOfPeriod.getMonth() + 1,
      0
    ).getDate();
    
    const dailyCounts = new Array(daysInMonth).fill(0);
    
    transactions.forEach((tx) => {
      if (accountFilter !== null && tx.accountId !== accountFilter) return;
      
      const txDate = new Date(tx.date + 'T00:00:00');
      if (Number.isNaN(txDate.getTime())) return;
      
      if (txDate >= startOfPeriod && txDate < endOfPeriod) {
        const day = txDate.getDate();
        if (day >= 1 && day <= daysInMonth) {
          dailyCounts[day - 1]++;
        }
      }
    });
    
    return dailyCounts.map((count, index) => ({
      day: String(index + 1),
      count
    }));
  }, [transactions, accountFilter, startOfPeriod, endOfPeriod, timeWindow]);

  const disableNext = rangeOffset === 0;

  const handlePrevPeriod = () => setRangeOffset((prev) => prev + 1);
  const handleNextPeriod = () => {
    if (!disableNext) setRangeOffset((prev) => prev - 1);
  };

  const handleCurrencyChange = async (currency: Currency) => {
    if (!settings) return;
    
    const { updateSettings } = await import('../stores/settingsStore');
    await updateSettings({ displayCurrency: currency });
    const updatedSettings = await getSettings();
    setSettings(updatedSettings || null);
    
    const total = computeTotal(
      accounts,
      transactions,
      transfers,
      updatedSettings?.exchangeRates || settings.exchangeRates,
      currency,
    );
    setTotalDisplay(formatNumberToMonetary(total));

    if (accountFilter !== null) {
      const selectedAccount = accounts.find(acc => acc.id === accountFilter);
      if (selectedAccount && updatedSettings) {
        const accountBalance = computeAccountBalance(
          selectedAccount,
          transactions,
          transfers,
          updatedSettings.exchangeRates,
          currency
        );
        setAccountBalanceDisplay(formatNumberToMonetary(accountBalance));
      }
    }
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
        transfers,
        newRates,
        settings?.displayCurrency ?? 'ARS',
      );
      setTotalDisplay(formatNumberToMonetary(total));

      if (accountFilter !== null) {
        const selectedAccount = accounts.find(acc => acc.id === accountFilter);
        if (selectedAccount) {
          const accountBalance = computeAccountBalance(
            selectedAccount,
            transactions,
            transfers,
            newRates,
            settings?.displayCurrency ?? 'ARS'
          );
          setAccountBalanceDisplay(formatNumberToMonetary(accountBalance));
        }
      }
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
              <Group justify="space-between" align="center" wrap="wrap">
                <Group gap="xl">
                  <div>
                    <Group gap="xs" align="center">
                      <Text size="sm" c="dimmed">Total Balance</Text>
                      <ActionIcon
                        variant="subtle"
                        size="sm"
                        onClick={() => setIsBalanceHidden(!isBalanceHidden)}
                      >
                        {isBalanceHidden ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                      </ActionIcon>
                    </Group>
                    <Text size="xl" fw={700} c={isBalanceNegative ? 'red' : undefined}>
                      {isBalanceHidden ? '••••••' : `${totalDisplay} ${settings?.displayCurrency ?? 'ARS'}`}
                    </Text>
                  </div>
                  
                  <Select
                    placeholder="Select account"
                    data={accounts.map((acc) => ({ value: String(acc.id), label: acc.name, icon: acc.icon }))}
                    value={accountFilter ? String(accountFilter) : null}
                    onChange={(value) => {
                      const newAccountId = value ? Number(value) : null;
                      setAccountFilter(newAccountId);
                      
                      if (newAccountId !== null && settings) {
                        const selectedAccount = accounts.find(acc => acc.id === newAccountId);
                        if (selectedAccount) {
                          const accountBalance = computeAccountBalance(
                            selectedAccount,
                            transactions,
                            transfers,
                            settings.exchangeRates,
                            settings.displayCurrency
                          );
                          setAccountBalanceDisplay(formatNumberToMonetary(accountBalance));
                        }
                      }
                    }}
                    clearable
                    searchable
                    renderOption={({ option }) => {
                      const account = accounts.find(acc => String(acc.id) === option.value);
                      return (
                        <Group gap="sm">
                          {account && <AccountIcon name={account.icon} size={20} />}
                          <span>{option.label}</span>
                        </Group>
                      );
                    }}
                    styles={{ root: { minWidth: 200 } }}
                  />
                  
                  {accountFilter !== null && (() => {
                    const selectedAccount = accounts.find(acc => acc.id === accountFilter);
                    return selectedAccount ? (
                      <Group gap="xs">
                        <AccountIcon name={selectedAccount.icon} size={24} />
                        <div>
                          <Text size="xs" c="dimmed">{selectedAccount.name}</Text>
                          <Text size="md" fw={600}>
                            {isBalanceHidden ? '••••••' : `${accountBalanceDisplay} ${settings?.displayCurrency ?? 'ARS'}`}
                          </Text>
                        </div>
                      </Group>
                    ) : null;
                  })()}
                </Group>
                
                <Group gap="sm">
                  {settings && (
                    <CurrencySelector 
                      value={settings.displayCurrency} 
                      onChange={handleCurrencyChange}
                    />
                  )}
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

          <Grid.Col span={{ base: 12, lg: 7 }} style={{ display: 'flex' }}>
            <Card shadow="sm" padding="md" radius="md" withBorder style={{ flex: 1 }}>
              <Stack gap="md">
                <Title order={4} size="h5">Dashboard</Title>
                  <DashboardFilters
                    typeFilter={typeFilter}
                    setTypeFilter={setTypeFilter}
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
                    timelineData={timelineData}
                    isBalanceHidden={isBalanceHidden}
                    periodLabel={periodLabel}
                  />
                </Stack>
              </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, lg: 5 }} style={{ display: 'flex' }}>
            <Card shadow="sm" padding="md" radius="md" withBorder style={{ flex: 1 }}>
              <Stack gap="md">
                <Title order={4} size="h5">Category Breakdown</Title>
                {isBalanceHidden ? (
                  <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                    <Title order={3} c="dimmed">••••••</Title>
                  </div>
                ) : (
                  <CategoryBreakdown data={byCategory} total={totalAmount} />
                )}
              </Stack>
            </Card>
          </Grid.Col>

          <Grid.Col span={12}>
            <Card shadow="sm" padding="md" radius="md" withBorder>
              <Stack gap="md">
                <Title order={4} size="h5">Income vs Outcome</Title>
                {isBalanceHidden ? (
                  <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                    <Title order={3} c="dimmed">••••••</Title>
                  </div>
                ) : (
                  <IncomeOutcomeComparison
                    income={periodIncomeTotal}
                    outcome={periodOutcomeTotal}
                    previousIncome={previousPeriodIncomeTotal}
                    previousOutcome={previousPeriodOutcomeTotal}
                    currency={settings?.displayCurrency ?? 'ARS'}
                    periodLabel={periodLabel}
                  />
                )}
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>
      </div>
    </div>
  );
};

