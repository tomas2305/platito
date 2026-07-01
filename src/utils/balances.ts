import type { Account, Currency, ExchangeRates, Transaction, Transfer } from '../types';
import { convertAmount, convertToARS } from './currency';

export const computeAccountBalance = (
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
