import { useEffect, useMemo, useState } from 'react';
import { Card, Grid, Group, Select, Stack, Text, Title } from '@mantine/core';
import { TransferForm } from '../components/TransferForm';
import { TransferList } from '../components/TransferList';
import { PeriodNavigator } from '../components/PeriodNavigator';
import type { Account, Transfer, Transaction, TimeWindow, ExchangeRates } from '../types';
import { getActiveAccounts } from '../stores/accountsStore';
import { getSettings } from '../stores/settingsStore';
import { getAllTransactions } from '../stores/transactionsStore';
import {
  createTransfer,
  deleteTransfer,
  getAllTransfers,
  updateTransfer,
} from '../stores/transfersStore';
import { formatPeriodLabel } from '../utils/dateFormatters';

export const TransfersPage = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingTransfer, setEditingTransfer] = useState<Transfer | null>(null);
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('month');
  const [rangeOffset, setRangeOffset] = useState(0);
  const [accountFilter, setAccountFilter] = useState<number | null>(null);

  const loadData = async () => {
    const [accts, tfrs, txs, settings] = await Promise.all([
      getActiveAccounts(),
      getAllTransfers(),
      getAllTransactions(),
      getSettings(),
    ]);
    setAccounts(accts);
    setTransfers(tfrs);
    setTransactions(txs);
    setExchangeRates(settings?.exchangeRates || null);
  };

  useEffect(() => {
    (async () => {
      const [accts, tfrs, txs, settings] = await Promise.all([
        getActiveAccounts(),
        getAllTransfers(),
        getAllTransactions(),
        getSettings(),
      ]);
      setAccounts(accts);
      setTransfers(tfrs);
      setTransactions(txs);
      setExchangeRates(settings?.exchangeRates || null);
      setLoading(false);
    })();
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
    return transfers.filter((transfer) => {
      if (accountFilter !== null) {
        if (transfer.fromAccountId !== accountFilter && transfer.toAccountId !== accountFilter) {
          return false;
        }
      }
      const transferDate = new Date(transfer.date + 'T00:00:00');
      if (Number.isNaN(transferDate.getTime())) return false;
      if (transferDate > now) return false;
      return transferDate >= startOfPeriod && transferDate < endOfPeriod;
    });
  }, [transfers, accountFilter, startOfPeriod, endOfPeriod]);

  const periodLabel = useMemo(() => {
    return formatPeriodLabel(timeWindow, startOfPeriod, endOfPeriod);
  }, [timeWindow, startOfPeriod, endOfPeriod]);

  const disableNext = rangeOffset === 0;

  const handlePrevPeriod = () => setRangeOffset((prev) => prev + 1);
  const handleNextPeriod = () => {
    if (!disableNext) setRangeOffset((prev) => prev - 1);
  };

  const handleCreate = async (data: {
    fromAccountId: number;
    toAccountId: number;
    amount: number;
    date: string;
    description?: string;
  }) => {
    if (!exchangeRates) {
      throw new Error('Exchange rates not loaded');
    }
    await createTransfer(data, exchangeRates);
    await loadData();
  };

  const handleUpdate = async (data: {
    fromAccountId: number;
    toAccountId: number;
    amount: number;
    date: string;
    description?: string;
  }) => {
    if (!editingTransfer?.id || !exchangeRates) {
      throw new Error('Invalid transfer or exchange rates');
    }
    await updateTransfer(editingTransfer.id, data, exchangeRates);
    setEditingTransfer(null);
    await loadData();
  };

  const handleEdit = (transfer: Transfer) => {
    setEditingTransfer(transfer);
  };

  const handleDelete = async (id: number) => {
    await deleteTransfer(id);
    await loadData();
  };

  const handleCancelEdit = () => {
    setEditingTransfer(null);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!exchangeRates) {
    return (
      <div style={{ padding: '16px' }}>
        <Text c="red">Failed to load exchange rates. Please check your settings.</Text>
      </div>
    );
  }

  return (
    <div style={{ padding: '12px', paddingTop: '16px' }}>
      <Grid gutter="md">
        <Grid.Col span={12}>
          <Stack gap="md">
            <Title order={2}>Transfers</Title>
            
            <TransferForm
              accounts={accounts}
              exchangeRates={exchangeRates}
              transactions={transactions}
              transfers={transfers}
              transfer={editingTransfer || undefined}
              onSubmit={editingTransfer ? handleUpdate : handleCreate}
              onCancel={editingTransfer ? handleCancelEdit : undefined}
            />
          </Stack>
        </Grid.Col>

        <Grid.Col span={12}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Stack gap="md">
              <Group justify="space-between" align="center">
                <Title order={4}>Transfer History</Title>
                <Group gap="sm">
                  <Select
                    placeholder="All Accounts"
                    value={accountFilter ? String(accountFilter) : null}
                    onChange={(value) => setAccountFilter(value ? Number(value) : null)}
                    data={accounts.map((acc) => ({
                      value: String(acc.id),
                      label: acc.name,
                    }))}
                    clearable
                    searchable
                    style={{ minWidth: 180 }}
                  />
                  
                  <Select
                    value={timeWindow}
                    onChange={(value) => {
                      setTimeWindow(value as TimeWindow);
                      setRangeOffset(0);
                    }}
                    data={[
                      { value: 'day', label: 'Day' },
                      { value: 'week', label: 'Week' },
                      { value: 'month', label: 'Month' },
                      { value: 'year', label: 'Year' },
                    ]}
                    style={{ minWidth: 120 }}
                  />
                  
                  <PeriodNavigator
                    periodLabel={periodLabel}
                    onPrev={handlePrevPeriod}
                    onNext={handleNextPeriod}
                    disableNext={disableNext}
                  />
                </Group>
              </Group>

              <TransferList
                transfers={filtered}
                accounts={accounts}
                onEdit={handleEdit}
                onDelete={handleDelete}
                showActions={true}
              />
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>
    </div>
  );
};
