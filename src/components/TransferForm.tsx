import { useEffect, useState } from 'react';
import { ActionIcon, Button, Card, Group, Select, Stack, Text, Textarea, TextInput } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { IconArrowsExchange } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import type { Account, Transfer, ExchangeRates, Transaction } from '../types';
import { formatMonetaryValue, formatNumberToMonetary, parseMonetaryValue } from '../utils/formatters';
import { convertAmount } from '../utils/currency';

interface FormState {
  fromAccountId: string;
  toAccountId: string;
  amount: string;
  description: string;
  date: Date | null;
}

interface Props {
  accounts: Account[];
  exchangeRates: ExchangeRates;
  transactions: Transaction[];
  transfers: Transfer[];
  transfer?: Transfer;
  onSubmit: (data: { fromAccountId: number; toAccountId: number; amount: number; date: string; description?: string }) => Promise<void>;
  onCancel?: () => void;
}

const formatDateToISO = (date: Date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new TypeError('Invalid date');
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDefaultFromAccountId = (transfer: Transfer | undefined, accounts: Account[]): string => {
  if (transfer?.fromAccountId) return String(transfer.fromAccountId);
  if (accounts[0]) return String(accounts[0].id);
  return '';
};

const getDefaultToAccountId = (transfer: Transfer | undefined, accounts: Account[]): string => {
  if (transfer?.toAccountId) return String(transfer.toAccountId);
  if (accounts[1]) return String(accounts[1].id);
  return '';
};

export const TransferForm = ({ accounts, exchangeRates, transactions, transfers, transfer, onSubmit, onCancel }: Props) => {
  const [form, setForm] = useState<FormState>({
    fromAccountId: getDefaultFromAccountId(transfer, accounts),
    toAccountId: getDefaultToAccountId(transfer, accounts),
    amount: transfer ? formatNumberToMonetary(transfer.amount) : '',
    description: transfer?.description || '',
    date: transfer ? new Date(transfer.date + 'T00:00:00') : new Date(),
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fromAccount = accounts.find(a => String(a.id) === form.fromAccountId);
  const toAccount = accounts.find(a => String(a.id) === form.toAccountId);

  const convertedAmount = fromAccount && toAccount && form.amount
    ? convertAmount(parseMonetaryValue(form.amount), fromAccount.currency, toAccount.currency, exchangeRates)
    : 0;

  const computeAccountBalance = (account: Account): number => {
    let balance = account.initialBalance;
    
    const accountTransactions = transactions.filter(tx => tx.accountId === account.id);
    for (const tx of accountTransactions) {
      if (tx.type === 'income') {
        balance += tx.amount;
      } else {
        balance -= tx.amount;
      }
    }
    
    const accountTransfers = transfers.filter(
      t => t.fromAccountId === account.id || t.toAccountId === account.id
    );
    for (const trans of accountTransfers) {
      if (trans.fromAccountId === account.id) {
        balance -= trans.amount;
      }
      if (trans.toAccountId === account.id) {
        balance += trans.convertedAmount;
      }
    }
    
    return balance;
  };

  const fromAccountBalance = fromAccount ? computeAccountBalance(fromAccount) : 0;
  const toAccountBalance = toAccount ? computeAccountBalance(toAccount) : 0;

  const handleSwap = () => {
    setForm({
      ...form,
      fromAccountId: form.toAccountId,
      toAccountId: form.fromAccountId,
    });
  };

  useEffect(() => {
    if (transfer) {
      setForm({
        fromAccountId: String(transfer.fromAccountId),
        toAccountId: String(transfer.toAccountId),
        amount: formatNumberToMonetary(transfer.amount),
        description: transfer.description || '',
        date: new Date(transfer.date + 'T00:00:00'),
      });
    }
  }, [transfer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const fromAccountId = Number(form.fromAccountId);
    const toAccountId = Number(form.toAccountId);
    const amount = parseMonetaryValue(form.amount);

    if (!fromAccountId || !toAccountId) {
      setError('Please select both accounts');
      return;
    }

    if (fromAccountId === toAccountId) {
      setError('Cannot transfer to the same account');
      return;
    }

    if (!form.amount || form.amount.trim() === '' || Number.isNaN(amount) || amount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    // Only validate balance when creating a new transfer, not when editing
    if (!transfer && amount > fromAccountBalance) {
      setError(`Insufficient balance. Available: ${formatNumberToMonetary(fromAccountBalance)} ${fromAccount?.currency || ''}`);
      return;
    }

    if (!form.date || !(form.date instanceof Date) || Number.isNaN(form.date.getTime())) {
      setError('Please select a valid date');
      return;
    }

    const futureDate = new Date();
    futureDate.setHours(23, 59, 59, 999);
    if (form.date > futureDate) {
      setError('Date cannot be in the future');
      return;
    }

    try {
      setLoading(true);
      await onSubmit({
        fromAccountId,
        toAccountId,
        amount,
        date: formatDateToISO(form.date),
        description: form.description.trim() || undefined,
      });

      if (!transfer) {
        setForm({
          fromAccountId: form.fromAccountId,
          toAccountId: form.toAccountId,
          amount: '',
          description: '',
          date: form.date,
        });
      }

      notifications.show({
        title: 'Success',
        message: transfer ? 'Transfer updated successfully' : 'Transfer created successfully',
        color: 'green',
      });

      if (transfer && onCancel) {
        onCancel();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save transfer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <Group grow align="center" wrap="nowrap">
            <Select
              label="From Account"
              placeholder="Select source account"
              value={form.fromAccountId}
              onChange={(value) => setForm({ ...form, fromAccountId: value || '' })}
              data={accounts.map(acc => ({
                value: String(acc.id),
                label: `${acc.name} (${acc.currency})`,
              }))}
              required
              searchable
            />

            <ActionIcon
              variant="light"
              size="lg"
              onClick={handleSwap}
              title="Swap accounts"
              style={{ marginTop: '25px' }}
            >
              <IconArrowsExchange size={18} />
            </ActionIcon>

            <Select
              label="To Account"
              placeholder="Select destination account"
              value={form.toAccountId}
              onChange={(value) => setForm({ ...form, toAccountId: value || '' })}
              data={accounts
                .filter(acc => String(acc.id) !== form.fromAccountId)
                .map(acc => ({
                  value: String(acc.id),
                  label: `${acc.name} (${acc.currency})`,
                }))}
              required
              searchable
            />
          </Group>

          {(fromAccount || toAccount) && (
            <Group grow>
              <Stack gap={2}>
                {fromAccount && (
                  <>
                    <Text size="xs" c="dimmed">
                      Current balance: {formatNumberToMonetary(fromAccountBalance)} {fromAccount.currency}
                    </Text>
                    {form.amount && parseMonetaryValue(form.amount) > 0 && (
                      <Text size="xs" c="red" fw={500}>
                        Final balance: {formatNumberToMonetary(fromAccountBalance - parseMonetaryValue(form.amount))} {fromAccount.currency}
                      </Text>
                    )}
                  </>
                )}
              </Stack>
              <Stack gap={2}>
                {toAccount && (
                  <>
                    <Text size="xs" c="dimmed">
                      Current balance: {formatNumberToMonetary(toAccountBalance)} {toAccount.currency}
                    </Text>
                    {form.amount && parseMonetaryValue(form.amount) > 0 && convertedAmount > 0 && (
                      <Text size="xs" c="teal" fw={500}>
                        Final balance: {formatNumberToMonetary(toAccountBalance + convertedAmount)} {toAccount.currency}
                      </Text>
                    )}
                  </>
                )}
              </Stack>
            </Group>
          )}

          <Group grow align="flex-start">
            <TextInput
              label={`Amount (${fromAccount?.currency || 'Source Currency'})`}
              placeholder="0,00"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: formatMonetaryValue(e.target.value) })}
              required
              inputMode="decimal"
            />

            <DateInput
              label="Date"
              value={form.date}
              onChange={(date: Date | string | null) => {
                // DateInput can return a string in YYYY-MM-DD format, convert to Date
                let dateValue: Date | null = null;
                if (date) {
                  if (typeof date === 'string') {
                    dateValue = new Date(date + 'T00:00:00');
                  } else if (date instanceof Date) {
                    dateValue = date;
                  }
                }
                setForm({ ...form, date: dateValue });
              }}
              required
              maxDate={new Date()}
              valueFormat="DD/MM/YYYY"
            />
          </Group>

          {fromAccount && toAccount && form.amount && parseMonetaryValue(form.amount) > 0 && (
            <Card p="sm" bg="blue.0" style={{ border: '1px solid var(--mantine-color-blue-2)' }}>
              <Text size="sm" c="dimmed">
                Transfer preview: <Text span fw={600}>{formatNumberToMonetary(parseMonetaryValue(form.amount))} {fromAccount.currency}</Text>
                {' → '}
                <Text span fw={600}>{formatNumberToMonetary(convertedAmount)} {toAccount.currency}</Text>
              </Text>
              <Text size="xs" c="dimmed" mt={4}>
                Exchange rate: 1 {fromAccount.currency} = {(convertedAmount / parseMonetaryValue(form.amount)).toFixed(6).replace('.', ',')} {toAccount.currency}
              </Text>
            </Card>
          )}

          <Textarea
            label="Description (optional)"
            placeholder="Add notes about this transfer"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            minRows={2}
            maxRows={4}
          />

          {error && (
            <Text c="red" size="sm">
              {error}
            </Text>
          )}

          <Group justify="flex-end" gap="sm">
            {transfer && onCancel && (
              <Button variant="subtle" onClick={onCancel} disabled={loading}>
                Cancel
              </Button>
            )}
            <Button type="submit" loading={loading}>
              {transfer ? 'Update Transfer' : 'Create Transfer'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Card>
  );
};
