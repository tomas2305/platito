import { useMemo, useState } from 'react';
import {
  ActionIcon,
  Badge,
  Button,
  Collapse,
  Group,
  Paper,
  SegmentedControl,
  Select,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import type { Account, Category, Tag, Transaction, TransactionType } from '../types';
import { formatMonetaryValue } from '../utils/formatters';
import { getColorHex } from '../utils/colors';
import { formatPeriodLabel } from '../utils/dateFormatters';
import { AccountIcon } from './AccountIcon';
import { CategoryIcon } from './CategoryIcon';
import { PeriodNavigator } from './PeriodNavigator';

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
  externalTypeFilter?: TransactionType | null;
  externalAccountFilter?: number | null;
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

const formatDateHeader = (dateKey: string): string => {
  const date = new Date(dateKey + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
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
  externalTypeFilter = null,
  externalAccountFilter = null,
}: Props) => {
  const [range, setRange] = useState<RangeOption>('month');
  const [rangeOffset, setRangeOffset] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);
  const [expandedTxIds, setExpandedTxIds] = useState<Set<number>>(new Set());

  const toggleExpanded = (txId: number) => {
    setExpandedTxIds((prev) => {
      const next = new Set(prev);
      if (next.has(txId)) {
        next.delete(txId);
      } else {
        next.add(txId);
      }
      return next;
    });
  };

  const accountMap = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);
  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const tagMap = useMemo(() => new Map(tags.map((t) => [t.id, t])), [tags]);

  const categoriesForFilter = useMemo(() => {
    if (externalTypeFilter === null) return categories;
    return categories.filter((cat) => cat.type === externalTypeFilter);
  }, [categories, externalTypeFilter]);

  const periodStart = useMemo(() => startOfRange(range, rangeOffset), [range, rangeOffset]);
  const periodEnd = useMemo(() => endOfRange(periodStart, range), [periodStart, range]);
  const disableNext = rangeOffset === 0;

  const filtered = useMemo(() => {
    const now = new Date();
    return transactions.filter((tx) => {
      // Only apply type filter if not using external filter (or if provided externally)
      if (externalTypeFilter !== null && tx.type !== externalTypeFilter) return false;
      // Only apply account filter if not using external filter (or if provided externally)
      if (externalAccountFilter !== null && tx.accountId !== externalAccountFilter) return false;
      // Apply category filter if set
      if (categoryFilter !== null && tx.categoryId !== categoryFilter) return false;
      // Parse date as local time (YYYY-MM-DD)
      const txDate = new Date(tx.date + 'T00:00:00');
      if (Number.isNaN(txDate.getTime())) return false;
      if (txDate > now) return false;
      return txDate >= periodStart && txDate <= periodEnd;
    });
  }, [transactions, externalTypeFilter, externalAccountFilter, categoryFilter, periodStart, periodEnd]);

  const totalsByCurrency = useMemo(() => {
    const totals = new Map<string, number>();
    for (const tx of filtered) {
      const current = totals.get(tx.currency) ?? 0;
      totals.set(tx.currency, current + tx.amount);
    }
    return totals;
  }, [filtered]);

  const grouped = useMemo(() => {
    const sorted = [...filtered].sort((a, b) => {
      // First sort by date (newest first)
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      
      // Within same date, sort by ID (most recently created first)
      return (b.id ?? 0) - (a.id ?? 0);
    });
    
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

  const totalColor = useMemo(() => {
    if (externalTypeFilter === 'income') {
      return 'teal';
    }
    if (externalTypeFilter === 'expense') {
      return 'red';
    }
    return undefined;
  }, [externalTypeFilter]);

  return (
    <section>
      <Stack gap="md">
        {title && <Title order={3}>{title}</Title>}

        <Group gap="sm" wrap="wrap" align="flex-end" justify="space-between">
          <Group gap="sm" wrap="wrap" align="flex-end">
            {externalTypeFilter === null && (
              <SegmentedControl
                value="expense"
                onChange={() => {}}
                data={[
                  { label: 'Expense', value: 'expense' },
                  { label: 'Income', value: 'income' },
                ]}
              />
            )}

          {externalAccountFilter === null && (
            <Select
              placeholder="All accounts"
              searchable
              clearable
              value="all"
              onChange={() => {}}
              data={[
                { label: 'All accounts', value: 'all' },
                ...accounts.map((acc) => ({ label: acc.name, value: String(acc.id) }))
              ]}
              renderOption={({ option }) => {
                if (option.value === 'all') {
                  return <Text size="sm" fw={500}>All accounts</Text>;
                }
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
          )}

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
          <PeriodNavigator
            periodLabel={formatPeriodLabel(range, periodStart, periodEnd)}
            onPrev={() => setRangeOffset((prev) => prev + 1)}
            onNext={() => setRangeOffset((prev) => Math.max(0, prev - 1))}
            disableNext={disableNext}
          />
          
          <Select
            placeholder="All categories"
            searchable
            clearable
            value={categoryFilter ? String(categoryFilter) : null}
            onChange={(value) => {
              setCategoryFilter(value ? Number(value) : null);
            }}
            data={categoriesForFilter.map((cat) => ({
              label: cat.name,
              value: String(cat.id),
            }))}
            renderOption={({ option }) => {
              const cat = categoriesForFilter.find(c => String(c.id) === option.value);
              if (!cat) return null;
              return (
                <Group gap="xs">
                  <div
                    style={{
                      width: '4px',
                      height: '18px',
                      backgroundColor: getColorHex(cat.color),
                      borderRadius: '2px',
                    }}
                  />
                  <CategoryIcon name={cat.icon} size={18} />
                  <Text size="sm">{option.label}</Text>
                </Group>
              );
            }}
            style={{ minWidth: 200 }}
          />
          </Group>

          <Group gap="xs" align="center">
            <Text size="sm" c="dimmed">Total:</Text>
            <Text 
              size="lg" 
              fw={700}
              c={totalColor}
            >
              {totalsByCurrency.size === 0
                ? '0'
                : Array.from(totalsByCurrency.entries())
                    .map(([currency, total]) => `${formatMonetaryValue(String(total))} ${currency}`)
                    .join(' | ')}
            </Text>
          </Group>
        </Group>

        {groupKeys.length === 0 ? (
          <Text c="dimmed">No transactions in this range</Text>
        ) : (
          <Stack gap="md" style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '4px' }}>
            {groupKeys.map((dateKey) => (
              <Stack key={dateKey} gap="sm">
                <Text fw={600} size="sm" c="dimmed" ta="left">{formatDateHeader(dateKey)}</Text>
                {grouped[dateKey].map((tx) => {
                  const account = accountMap.get(tx.accountId);
                  const category = categoryMap.get(tx.categoryId);
                  const txTags = (tx.tagIds ?? [])
                    .map((id) => tagMap.get(id)?.name)
                    .filter(Boolean);
                  const categoryColor = category ? getColorHex(category.color) : '#999';
                  const isExpanded = expandedTxIds.has(tx.id!);
                  const hasDescription = !!tx.description;
                  const hasTags = txTags.length > 0;
                  const hasDetails = hasDescription || hasTags;

                  return (
                    <Paper
                      key={tx.id}
                      p="sm"
                      radius="md"
                      withBorder
                      style={{
                        backgroundColor: `${categoryColor}08`,
                        borderLeft: `3px solid ${categoryColor}`,
                      }}
                    >
                      <Stack gap="xs">
                        {/* Línea principal */}
                        <Group justify="space-between" align="center" wrap="nowrap" gap="xs">
                          <Group gap="sm" align="center" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                            {/* Precio */}
                            <Text fw={700} size="md" style={{ whiteSpace: 'nowrap', minWidth: '90px' }}>
                              {formatMonetaryValue(String(tx.amount))} {tx.currency}
                            </Text>
                            
                            {/* Categoría */}
                            <Group gap={6} align="center" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                              {category && <CategoryIcon name={category.icon} size={18} />}
                              <Text fw={500} size="sm" truncate>
                                {category?.name ?? 'Category'}
                              </Text>
                            </Group>

                            {/* Cuenta */}
                            {account && (
                              <Group gap={4} align="center" wrap="nowrap">
                                <AccountIcon name={account.icon} size={14} />
                                <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                                  {account.name}
                                </Text>
                              </Group>
                            )}
                          </Group>

                          {/* Acciones */}
                          <Group gap={4} wrap="nowrap">
                            {showActions && tx.id && (
                              <>
                                {onEdit && (
                                  <Button size="xs" variant="subtle" onClick={() => onEdit(tx)}>
                                    Edit
                                  </Button>
                                )}
                                {onDelete && (
                                  <Button size="xs" variant="subtle" color="red" onClick={() => onDelete(tx.id!)}>
                                    Delete
                                  </Button>
                                )}
                              </>
                            )}

                            {hasDetails && (
                              <ActionIcon
                                size="sm"
                                variant="subtle"
                                color="gray"
                                onClick={() => toggleExpanded(tx.id!)}
                              >
                                {isExpanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                              </ActionIcon>
                            )}
                          </Group>
                        </Group>

                        {/* Detalles expandibles */}
                        {hasDetails && (
                          <Collapse in={isExpanded}>
                            <Stack gap="xs" pt="xs" pl="md" style={{ borderTop: '1px solid #e9ecef' }}>
                              {tx.description && (
                                <Text size="sm" c="dimmed" style={{ fontStyle: 'italic' }}>
                                  {tx.description}
                                </Text>
                              )}

                              {txTags.length > 0 && (
                                <Group gap="xs" wrap="wrap">
                                  {txTags.map((tag) => (
                                    <Badge key={tag} variant="dot" size="sm" color="gray">
                                      {tag}
                                    </Badge>
                                  ))}
                                </Group>
                              )}
                            </Stack>
                          </Collapse>
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
