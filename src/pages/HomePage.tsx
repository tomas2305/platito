import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllAccounts } from '../stores/accountsStore';
import { getSettings, initializeSettings } from '../stores/settingsStore';
import { convertToARS } from '../utils/currency';
import { formatMonetaryValue } from '../utils/formatters';
import type { Account, AppSettings, Currency, ExchangeRates } from '../types';

export const HomePage = () => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [totalDisplay, setTotalDisplay] = useState<string>('0');
  const [loading, setLoading] = useState(true);

  const computeTotal = (
    accountsList: Account[],
    rates: ExchangeRates,
    displayCurrency: Currency
  ): number => {
    const totalARS = accountsList.reduce((sum, acc) => {
      return sum + convertToARS(acc.initialBalance, acc.currency, rates);
    }, 0);

    if (displayCurrency === 'ARS') {
      return totalARS;
    }

    const divisor = rates[displayCurrency]?.toARS ?? 1;
    return divisor === 0 ? totalARS : totalARS / divisor;
  };

  useEffect(() => {
    const load = async () => {
      const [allAccounts, loadedSettings] = await Promise.all([
        getAllAccounts(),
        getSettings().then((s) => s ?? initializeSettings()),
      ]);

      setSettings(loadedSettings);

      const total = computeTotal(
        allAccounts,
        loadedSettings.exchangeRates,
        loadedSettings.displayCurrency,
      );
      setTotalDisplay(formatMonetaryValue(String(total)));
      setLoading(false);
    };

    load();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Platito</h1>
      <nav>
        <Link to="/accounts">Accounts</Link>
        {' | '}
        <Link to="/categories">Categories</Link>
        {' | '}
        <Link to="/transactions">Transactions</Link>
        {' | '}
        <Link to="/tags">Tags</Link>
        {' | '}
        <Link to="/settings">Settings</Link>
      </nav>
      <main>
        <p>Welcome to Platito - Your finance tracker</p>
        <section style={{ marginTop: '12px' }}>
          <h2>Total</h2>
          <p style={{ fontSize: '1.2rem', fontWeight: 600 }}>
            {totalDisplay} {settings?.displayCurrency ?? 'ARS'}
          </p>
        </section>
      </main>
    </div>
  );
};
