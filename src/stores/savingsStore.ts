import { getDB } from '../db';
import type { SavingsMetrics, Transfer, Transaction, ExchangeRates, Currency } from '../types';
import { getSavingsAccounts } from './accountsStore';
import { getSettings } from './settingsStore';
import { convertToARS } from '../utils/currency';

export const getTransfersToSavingsAccounts = async (
  startDate: Date,
  endDate: Date
): Promise<Transfer[]> => {
  const db = getDB();
  const savingsAccounts = await getSavingsAccounts();
  const savingsAccountIds = new Set(savingsAccounts.map(acc => acc.id).filter((id): id is number => id !== undefined));
  
  if (savingsAccountIds.size === 0) {
    return [];
  }

  const allTransfers = await db.transfers.toArray();
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  return allTransfers.filter(transfer => {
    const transferDate = transfer.date;
    return (
      transferDate >= startDateStr &&
      transferDate < endDateStr &&
      savingsAccountIds.has(transfer.toAccountId)
    );
  });
};

const calculatePeriodTransactions = (
  transactions: Transaction[],
  type: 'income' | 'expense',
  startDate: Date,
  endDate: Date,
  exchangeRates: ExchangeRates,
  displayCurrency: Currency
): number => {
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];
  const now = new Date();

  return transactions
    .filter(tx => {
      if (tx.type !== type) return false;
      const txDate = new Date(tx.date + 'T00:00:00');
      if (Number.isNaN(txDate.getTime())) return false;
      if (txDate > now) return false;
      return tx.date >= startDateStr && tx.date < endDateStr;
    })
    .reduce((sum, tx) => {
      const amountInARS = convertToARS(tx.amount, tx.currency, exchangeRates);
      const amountInDisplayCurrency = displayCurrency === 'ARS' 
        ? amountInARS 
        : amountInARS / (exchangeRates[displayCurrency]?.toARS ?? 1);
      return sum + amountInDisplayCurrency;
    }, 0);
};

export const calculateSavingsMetrics = async (
  year: number,
  month: number
): Promise<SavingsMetrics> => {
  const settings = await getSettings();
  if (!settings) {
    throw new Error('Settings not initialized');
  }

  const db = getDB();
  const transactions = await db.transactions.toArray();
  
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);
  
  const income = calculatePeriodTransactions(
    transactions,
    'income',
    startDate,
    endDate,
    settings.exchangeRates,
    settings.displayCurrency
  );

  const expenses = calculatePeriodTransactions(
    transactions,
    'expense',
    startDate,
    endDate,
    settings.exchangeRates,
    settings.displayCurrency
  );

  const netBalance = income - expenses;
  
  const transfersToSavings = await getTransfersToSavingsAccounts(startDate, endDate);
  const transfersToSavingsAmount = transfersToSavings.reduce((sum, transfer) => {
    const amountInARS = convertToARS(transfer.convertedAmount, 'ARS', settings.exchangeRates);
    const amountInDisplayCurrency = settings.displayCurrency === 'ARS' 
      ? amountInARS 
      : amountInARS / (settings.exchangeRates[settings.displayCurrency]?.toARS ?? 1);
    return sum + amountInDisplayCurrency;
  }, 0);

  const netContribution = Math.max(0, netBalance);
  const totalSaved = netContribution + transfersToSavingsAmount;
  
  const savingsRate = income > 0 ? Math.min(100, (totalSaved / income) * 100) : 0;
  
  const targetSavingsRate = settings.targetSavingsRate;
  const isTargetMet = targetSavingsRate === undefined || savingsRate >= targetSavingsRate;
  
  const targetSavingsAmount = targetSavingsRate === undefined ? 0 : (income * targetSavingsRate / 100);
  const availableBudget = income - expenses - targetSavingsAmount;
  const budgetUsageRate = income > 0 ? ((expenses + targetSavingsAmount) / income) * 100 : 0;

  const period = `${year}-${String(month).padStart(2, '0')}`;

  return {
    period,
    income,
    expenses,
    netBalance,
    transfersToSavings: transfersToSavingsAmount,
    totalSaved,
    savingsRate,
    targetSavingsRate,
    isTargetMet,
    availableBudget,
    budgetUsageRate,
  };
};

export const calculateYearSavingsMetrics = async (
  year: number
): Promise<SavingsMetrics[]> => {
  const metrics: SavingsMetrics[] = [];
  
  for (let month = 1; month <= 12; month++) {
    const monthMetrics = await calculateSavingsMetrics(year, month);
    if (monthMetrics.income > 0 || monthMetrics.expenses > 0 || monthMetrics.totalSaved > 0) {
      metrics.push(monthMetrics);
    }
  }
  
  return metrics;
};

export const calculateCurrentMonthSavingsMetrics = async (): Promise<SavingsMetrics> => {
  const now = new Date();
  return calculateSavingsMetrics(now.getFullYear(), now.getMonth() + 1);
};

export const calculateLast12MonthsSavingsMetrics = async (): Promise<SavingsMetrics[]> => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  const metrics: SavingsMetrics[] = [];
  
  for (let i = 11; i >= 0; i--) {
    const date = new Date(currentYear, currentMonth - 1 - i, 1);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    
    const monthMetrics = await calculateSavingsMetrics(year, month);
    metrics.push(monthMetrics);
  }
  
  return metrics;
};
