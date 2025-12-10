import { useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Group,
  Paper,
  SegmentedControl,
  Select,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import type { Account, Category, Tag, Transaction, TransactionType } from '../types';
import { formatMonetaryValue } from '../utils/formatters';
import { getColorHex } from '../utils/colors';
import { AccountIcon } from './AccountIcon';
import { CategoryIcon } from './CategoryIcon';

export type RangeOption = 'day' | 'week' | 'month' | 'year';

type Props = {
  title?: string;
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  tags: Tag[];
  onEdit?: (tx: Transaction) => void;
  onDelete?: (id: number) => void;
  showActions?: boolean;
};

const RANGE_LABELS: Record<RangeOption, string> = {
  day: 'Today',
  week: 'This week',
  month: 'This month',
  year: 'This year',
};

const startOfRange = (range: RangeOption, offset: number): Date => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (range === 'day') {
    const start = new Date(now);
    start.setDate(start.getDate() - offset);
    return start;
  }

  if (range === 'week') {
    const start = new Date(now);
    const day = (now.getDay() + 6) % 7; // Monday as start
    start.setDate(now.getDate() - day - offset * 7);
    return start;
  }

  if (range === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    start.setMonth(start.getMonth() - offset);
    return start;
  }

  return new Date(now.getFullYear() - offset, 0, 1);
};

const endOfRange = (start: Date, range: RangeOption): Date => {
  const end = new Date(start);
  if (range === 'day') {
    end.setDate(end.getDate() + 1);
  } else if (range === 'week') {
    end.setDate(end.getDate() + 7);
  } else if (range === 'month') {
    end.setMonth(end.getMonth() + 1);
  } else {
    end.setFullYear(end.getFullYear() + 1);
  }
  end.setMilliseconds(end.getMilliseconds() - 1);
  return end;
};

const formatDateKey = (date: Date): string => date.toISOString().slice(0, 10);

const formatDateHeader = (dateKey: string): string => {
  const date = new Date(dateKey + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

const formatPeriodLabel = (range: RangeOption, start: Date, end: Date): string => {
  if (range === 'day') {
    return formatDateKey(start);
  }
  if (range === 'week') {
    return `${formatDateKey(start)} - ${formatDateKey(end)}`;
  }
  if (range === 'month') {
    return start.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  }
  return String(start.getFullYear());
};

export const TransactionList = ({
  title,
  transactions,
  accounts,
  categories,
  tags,
  onEdit,
  onDelete,
  showActions = false,
}: Props) => {
  const [range, setRange] = useState<RangeOption>('month');
  const [rangeOffset, setRangeOffset] = useState(0);
  const [typeFilter, setTypeFilter] = useState<TransactionType>('expense');
  const [accountFilter, setAccountFilter] = useState<number | 'all'>('all');

  const accountMap = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);
  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const tagMap = useMemo(() => new Map(tags.map((t) => [t.id, t])), [tags]);

  const periodStart = useMemo(() => startOfRange(range, rangeOffset), [range, rangeOffset]);
  const periodEnd = useMemo(() => endOfRange(periodStart, range), [periodStart, range]);
  const disableNext = rangeOffset === 0;

  const filtered = useMemo(() => {
    const now = new Date();
    return transactions.filter((tx) => {
      if (tx.type !== typeFilter) return false;
      if (accountFilter !== 'all' && tx.accountId !== accountFilter) return false;
      const txDate = new Date(tx.date);
      if (Number.isNaN(txDate.getTime())) return false;
      if (txDate > now) return false;
      return txDate >= periodStart && txDate <= periodEnd;
    });
  }, [transactions, typeFilter, accountFilter, periodStart, periodEnd]);

  const totalsByCurrency = useMemo(() => {
    const totals = new Map<string, number>();
    for (const tx of filtered) {
      const current = totals.get(tx.currency) ?? 0;
      totals.set(tx.currency, current + tx.amount);
    }
    return totals;
  }, [filtered]);

  const grouped = useMemo(() => {
    const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date));
    return sorted.reduce<Record<string, Transaction[]>>((acc, tx) => {
      const key = tx.date.slice(0, 10);
      acc[key] = acc[key] ? [...acc[key], tx] : [tx];
      return acc;
    }, {});
  }, [filtered]);

  const groupKeys = useMemo(
    () => Object.keys(grouped).sort((a, b) => b.localeCompare(a)),
    [grouped],
  );

  return (
    <section>
      <Stack gap="md">
        {title && (
          <Group justify="space-between" align="center">
            <Title order={3}>{title}</Title>
            <Text size="sm" fw={600}>
              Total:{' '}
              {totalsByCurrency.size === 0
                ? '0'
                : Array.from(totalsByCurrency.entries())
                    .map(([currency, total]) => `${formatMonetaryValue(String(total))} ${currency}`)
                    .join(' | ')}
            </Text>
          </Group>
        )}

        <Group gap="sm" wrap="wrap" align="flex-end">
          <SegmentedControl
            value={typeFilter}
            onChange={(value) => setTypeFilter(value as TransactionType)}
            data={[
              { label: 'Expense', value: 'expense' },
              { label: 'Income', value: 'income' },
            ]}
          />

          <Select
            placeholder="All accounts"
            searchable
            value={accountFilter === 'all' ? null : String(accountFilter)}
            onChange={(value) => {
              setAccountFilter(value ? Number(value) : 'all');
            }}
            data={accounts.map((acc) => ({ label: acc.name, value: String(acc.id) }))}
            renderOption={({ option }) => {
              const acc = accounts.find(a => String(a.id) === option.value);
              return (
                <Group gap="xs">
                  {acc && <AccountIcon name={acc.icon} size={18} />}
                  <Text size="sm">{option.label}</Text>
                </Group>
              );
            }}
            style={{ minWidth: 200 }}
          />

          <Select
            placeholder="Range"
            value={range}
            onChange={(value) => {
              if (value) {
                setRange(value as RangeOption);
                setRangeOffset(0);
              }
            }}
            data={[
              { value: 'day', label: RANGE_LABELS.day },
              { value: 'week', label: RANGE_LABELS.week },
              { value: 'month', label: RANGE_LABELS.month },
              { value: 'year', label: RANGE_LABELS.year },
            ]}
          />

          <Group gap={4}>
            <Button
              variant="light"
              size="sm"
              onClick={() => setRangeOffset((prev) => prev + 1)}
            >
              Prev
            </Button>
            <Text size="sm" fw={500} style={{ minWidth: 160, textAlign: 'center' }}>
              {formatPeriodLabel(range, periodStart, periodEnd)}
            </Text>
            <Button
              variant="light"
              size="sm"
              disabled={disableNext}
              onClick={() => setRangeOffset((prev) => Math.max(0, prev - 1))}
            >
              Next
            </Button>
          </Group>
        </Group>

        {groupKeys.length === 0 ? (
          <Text c="dimmed">No transactions in this range</Text>
        ) : (
          <Stack gap="md">
            {groupKeys.map((dateKey) => (
              <Stack key={dateKey} gap="sm">
                <Text fw={600} size="sm" c="dimmed">{formatDateHeader(dateKey)}</Text>
                {grouped[dateKey].map((tx) => {
                  const account = accountMap.get(tx.accountId);
                  const category = categoryMap.get(tx.categoryId);
                  const txTags = (tx.tagIds ?? [])
                    .map((id) => tagMap.get(id)?.name)
                    .filter(Boolean);
                  const categoryColor = category ? getColorHex(category.color) : '#999';

                  return (
                    <Paper
                      key={tx.id}
                      p="md"
                      radius="md"
                      withBorder
                      style={{
                        backgroundColor: `${categoryColor}15`,
                        borderLeft: `4px solid ${categoryColor}`,
                      }}
                    >
                      <Stack gap="xs">
                        <Group justify="space-between" align="center">
                          <Stack gap={4} align="flex-start">
                            <Text fw={700} size="xl">{formatMonetaryValue(String(tx.amount))} {tx.currency}</Text>
                            <Group gap={8} align="center" wrap="wrap">
                              <Group gap={4} align="center">
                                {category && <CategoryIcon name={category.icon} size={16} />}
                                <Text size="sm" fw={500}>{category?.name ?? 'Category'}</Text>
                              </Group>
                              <Text size="sm" c="dimmed">•</Text>
                              <Group gap={4} align="center">
                                {account && <AccountIcon name={account.icon} size={16} />}
                                <Text size="sm">{account?.name ?? 'Account'}</Text>
                              </Group>
                            </Group>
                          </Stack>
                          <Badge variant="light" color={tx.type === 'income' ? 'green' : 'red'}>
                            {tx.type}
                          </Badge>
                        </Group>

                        {tx.description && (
                          <Text size="sm" style={{ fontStyle: 'italic', opacity: 0.8 }}>
                            {tx.description}
                          </Text>
                        )}

                        {txTags.length > 0 && (
                          <Group gap="xs" wrap="wrap">
                            {txTags.map((tag) => (
                              <Badge key={tag} variant="dot" size="sm">
                                {tag}
                              </Badge>
                            ))}
                          </Group>
                        )}

                        {showActions && (tx.id) && (
                          <Group gap="xs">
                            {onEdit && <Button size="xs" variant="light" onClick={() => onEdit(tx)}>Edit</Button>}
                            {onDelete && (
                              <Button size="xs" variant="light" color="red" onClick={() => onDelete(tx.id!)}>Delete</Button>
                            )}
                          </Group>
                        )}
                      </Stack>
                    </Paper>
                  );
                })}
              </Stack>
            ))}
          </Stack>
        )}
      </Stack>
    </section>
  );
};
