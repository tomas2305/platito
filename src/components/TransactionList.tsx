import { useMemo, useState } from 'react';
import type { Account, Category, Tag, Transaction, TransactionType } from '../types';
import { formatMonetaryValue } from '../utils/formatters';

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
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        {title && <h2 style={{ margin: 0 }}>{title}</h2>}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: title ? 'auto' : 0 }}>
          <label>
            Range:
            {' '}
            <select
              value={range}
              onChange={(e) => {
                setRange(e.target.value as RangeOption);
                setRangeOffset(0);
              }}
            >
              <option value="day">{RANGE_LABELS.day}</option>
              <option value="week">{RANGE_LABELS.week}</option>
              <option value="month">{RANGE_LABELS.month}</option>
              <option value="year">{RANGE_LABELS.year}</option>
            </select>
          </label>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <button type="button" onClick={() => setRangeOffset((prev) => prev + 1)}>
              Prev
            </button>
            <span style={{ minWidth: '180px', textAlign: 'center' }}>
              {formatPeriodLabel(range, periodStart, periodEnd)}
            </span>
            <button
              type="button"
              disabled={disableNext}
              onClick={() => setRangeOffset((prev) => Math.max(0, prev - 1))}
            >
              Next
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label>
            Type:
            {' '}
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as TransactionType)}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </label>
          <label>
            Account:
            {' '}
            <select
              value={accountFilter === 'all' ? 'all' : String(accountFilter)}
              onChange={(e) => {
                const value = e.target.value;
                setAccountFilter(value === 'all' ? 'all' : Number(value));
              }}
            >
              <option value="all">All</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </select>
          </label>
          <div>
            Total:{' '}
            {totalsByCurrency.size === 0
              ? '0'
              : Array.from(totalsByCurrency.entries())
                  .map(([currency, total]) => `${formatMonetaryValue(String(total))} ${currency}`)
                  .join(' | ')}
          </div>
        </div>
      </div>

      {groupKeys.length === 0 ? (
        <p>No transactions in this range</p>
      ) : (
        groupKeys.map((dateKey) => (
          <div key={dateKey} style={{ marginBottom: '12px' }}>
            <h3 style={{ margin: '8px 0' }}>{dateKey}</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {grouped[dateKey].map((tx) => {
                const account = accountMap.get(tx.accountId);
                const category = categoryMap.get(tx.categoryId);
                const txTags = (tx.tagIds ?? [])
                  .map((id) => tagMap.get(id)?.name)
                  .filter(Boolean)
                  .join(', ');

                return (
                  <li key={tx.id} style={{ border: '1px solid #ccc', borderRadius: '6px', padding: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <strong>{formatMonetaryValue(String(tx.amount))} {tx.currency}</strong>
                      <span>{category?.name ?? 'Category'}</span>
                      <span>•</span>
                      <span>{account?.name ?? 'Account'}</span>
                      <span style={{ marginLeft: 'auto' }}>{tx.type}</span>
                    </div>
                    {tx.description && <div style={{ color: '#555', marginTop: '4px' }}>{tx.description}</div>}
                    {txTags && <div style={{ color: '#666', fontSize: '0.9rem', marginTop: '4px' }}>Tags: {txTags}</div>}
                    {showActions && (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        {onEdit && <button type="button" onClick={() => onEdit(tx)}>Edit</button>}
                        {onDelete && tx.id && (
                          <button type="button" onClick={() => onDelete(tx.id!)}>Delete</button>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))
      )}
    </section>
  );
};
