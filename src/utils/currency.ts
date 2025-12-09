import type { Currency, ExchangeRates } from '../types';

export const SUPPORTED_CURRENCIES: Currency[] = ['ARS', 'USD_BLUE', 'USD_MEP', 'USDT'];

export const convertToARS = (
  amount: number,
  currency: Currency,
  exchangeRates: ExchangeRates
): number => {
  const rate = exchangeRates[currency]?.toARS ?? 1;
  return amount * rate;
};

export const convertAmount = (
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency,
  exchangeRates: ExchangeRates
): number => {
  if (fromCurrency === toCurrency) return amount;

  const amountInARS = convertToARS(amount, fromCurrency, exchangeRates);
  if (toCurrency === 'ARS') return amountInARS;

  const targetRate = exchangeRates[toCurrency]?.toARS ?? 1;
  return amountInARS / targetRate;
};
