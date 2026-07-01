import type {
  Account,
  AppSettings,
  BaselinePeriod,
  Category,
  CategoryContribution,
  Currency,
  EssentialBaselineMetrics,
  ExchangeRates,
  RunwayMetrics,
  Transaction,
  Transfer,
} from '../types';
import { getAllTransactions } from './transactionsStore';
import { getAllCategories } from './categoriesStore';
import { getSettings } from './settingsStore';
import { convertToARS } from '../utils/currency';
import { computeAccountBalance } from '../utils/balances';

const MIN_SAMPLE_MONTHS = 3;

const monthKeyOf = (year: number, month: number): string => `${year}-${String(month).padStart(2, '0')}`;

const getCompleteMonthsList = (
  period: BaselinePeriod,
  now: Date,
  transactions: Transaction[],
): Array<{ year: number; month: number }> => {
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const monthsBack = period === '1y' ? 12 : period === '6m' ? 6 : null;

  if (monthsBack !== null) {
    const months: Array<{ year: number; month: number }> = [];
    for (let i = monthsBack; i >= 1; i--) {
      const date = new Date(currentYear, currentMonth - 1 - i, 1);
      months.push({ year: date.getFullYear(), month: date.getMonth() + 1 });
    }
    return months;
  }

  if (transactions.length === 0) return [];

  const earliestDate = transactions.reduce((min, tx) => {
    const d = new Date(tx.date + 'T00:00:00');
    return Number.isNaN(d.getTime()) ? min : (d < min ? d : min);
  }, new Date(transactions[0].date + 'T00:00:00'));

  let year = earliestDate.getFullYear();
  let month = earliestDate.getMonth() + 1;

  const months: Array<{ year: number; month: number }> = [];
  while (year < currentYear || (year === currentYear && month < currentMonth)) {
    months.push({ year, month });
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return months;
};

const isTransactionEssential = (tx: Transaction, categoryMap: Map<number, Category>): boolean => {
  if (tx.type !== 'expense') return false;
  if (tx.essentialOverride !== undefined) return tx.essentialOverride;
  return categoryMap.get(tx.categoryId)?.isEssential ?? false;
};

const toDisplayCurrency = (
  amount: number,
  currency: Currency,
  exchangeRates: ExchangeRates,
  displayCurrency: Currency,
): number => {
  const amountInARS = convertToARS(amount, currency, exchangeRates);
  return displayCurrency === 'ARS' ? amountInARS : amountInARS / (exchangeRates[displayCurrency]?.toARS ?? 1);
};

const average = (values: number[]): number => (values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length);

const median = (values: number[]): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
};

const sampleStdDev = (values: number[]): number => {
  if (values.length <= 1) return 0;
  const avg = average(values);
  const variance = values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
};

export const computeEssentialBaselineFromData = (
  period: BaselinePeriod,
  now: Date,
  transactions: Transaction[],
  categories: Category[],
  settings: AppSettings,
): EssentialBaselineMetrics => {
  const categoryMap = new Map(categories.filter(c => c.id !== undefined).map(c => [c.id as number, c]));
  const months = getCompleteMonthsList(period, now, transactions);
  const monthsIncluded = months.length;

  if (monthsIncluded === 0) {
    return {
      period,
      monthsIncluded: 0,
      isLowSample: true,
      monthlyAverage: 0,
      monthlyMedian: 0,
      stdDev: 0,
      min: 0,
      max: 0,
      categoryBreakdown: [],
      avgMonthlyIncome: 0,
      percentOfIncome: 0,
      totalMonthlyAverage: 0,
    };
  }

  const monthKeys = new Set(months.map(m => monthKeyOf(m.year, m.month)));
  const essentialByMonth = new Map<string, number>();
  const totalExpenseByMonth = new Map<string, number>();
  const incomeByMonth = new Map<string, number>();
  const essentialByCategory = new Map<number, number>();

  for (const key of monthKeys) {
    essentialByMonth.set(key, 0);
    totalExpenseByMonth.set(key, 0);
    incomeByMonth.set(key, 0);
  }

  const { exchangeRates, displayCurrency } = settings;

  for (const tx of transactions) {
    const txDate = new Date(tx.date + 'T00:00:00');
    if (Number.isNaN(txDate.getTime()) || txDate > now) continue;

    const key = monthKeyOf(txDate.getFullYear(), txDate.getMonth() + 1);
    if (!monthKeys.has(key)) continue;

    const amount = toDisplayCurrency(tx.amount, tx.currency, exchangeRates, displayCurrency);

    if (tx.type === 'income') {
      incomeByMonth.set(key, (incomeByMonth.get(key) ?? 0) + amount);
      continue;
    }

    totalExpenseByMonth.set(key, (totalExpenseByMonth.get(key) ?? 0) + amount);

    if (isTransactionEssential(tx, categoryMap)) {
      essentialByMonth.set(key, (essentialByMonth.get(key) ?? 0) + amount);
      essentialByCategory.set(tx.categoryId, (essentialByCategory.get(tx.categoryId) ?? 0) + amount);
    }
  }

  const essentialValues = Array.from(essentialByMonth.values());
  const totalExpenseValues = Array.from(totalExpenseByMonth.values());
  const incomeValues = Array.from(incomeByMonth.values());

  const monthlyAverage = average(essentialValues);
  const avgMonthlyIncome = average(incomeValues);

  const categoryBreakdown: CategoryContribution[] = Array.from(essentialByCategory.entries())
    .map(([categoryId, total]) => ({
      categoryId,
      categoryName: categoryMap.get(categoryId)?.name ?? 'Unknown',
      categoryColor: categoryMap.get(categoryId)?.color ?? 'gray',
      monthlyAverage: total / monthsIncluded,
    }))
    .sort((a, b) => b.monthlyAverage - a.monthlyAverage);

  return {
    period,
    monthsIncluded,
    isLowSample: monthsIncluded < MIN_SAMPLE_MONTHS,
    monthlyAverage,
    monthlyMedian: median(essentialValues),
    stdDev: sampleStdDev(essentialValues),
    min: Math.min(...essentialValues),
    max: Math.max(...essentialValues),
    categoryBreakdown,
    avgMonthlyIncome,
    percentOfIncome: avgMonthlyIncome > 0 ? monthlyAverage / avgMonthlyIncome : 0,
    totalMonthlyAverage: average(totalExpenseValues),
  };
};

export const calculateEssentialBaselineMetrics = async (period: BaselinePeriod): Promise<EssentialBaselineMetrics> => {
  const [transactions, categories, settings] = await Promise.all([
    getAllTransactions(),
    getAllCategories(),
    getSettings(),
  ]);
  if (!settings) throw new Error('Settings not initialized');
  return computeEssentialBaselineFromData(period, new Date(), transactions, categories, settings);
};

export const calculateBaselineTrend = (
  recent6m: EssentialBaselineMetrics,
  longer1y: EssentialBaselineMetrics,
): number => (longer1y.monthlyAverage > 0 ? (recent6m.monthlyAverage - longer1y.monthlyAverage) / longer1y.monthlyAverage : 0);

export const computeTotalBalance = (
  accounts: Account[],
  transactions: Transaction[],
  transfers: Transfer[],
  exchangeRates: ExchangeRates,
  displayCurrency: Currency,
): number => accounts.reduce(
  (sum, acc) => sum + computeAccountBalance(acc, transactions, transfers, exchangeRates, displayCurrency),
  0,
);

export const computeRunwayMetrics = (baseline: EssentialBaselineMetrics, totalBalance: number): RunwayMetrics => ({
  totalBalance,
  conservativeRunwayMonths: baseline.monthlyAverage > 0 ? totalBalance / baseline.monthlyAverage : null,
  currentHabitsRunwayMonths: baseline.totalMonthlyAverage > 0 ? totalBalance / baseline.totalMonthlyAverage : null,
});
