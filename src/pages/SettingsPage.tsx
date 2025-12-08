import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../db';
import { getSettings, updateSettings } from '../stores/settingsStore';
import type { AppSettings, Account, TimeWindow } from '../types';

export const SettingsPage = () => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const [settingsData, accountsData] = await Promise.all([
        getSettings(),
        db.accounts.toArray(),
      ]);
      setSettings(settingsData || null);
      setAccounts(accountsData);
      setLoading(false);
    };
    loadData();
  }, []);

  const handleDefaultAccountChange = async (accountId: string) => {
    const id = accountId === '' ? undefined : Number(accountId);
    await updateSettings({ defaultAccountId: id });
    setSettings(prev => prev ? { ...prev, defaultAccountId: id } : null);
  };

  const handleTimeWindowChange = async (timeWindow: TimeWindow) => {
    await updateSettings({ defaultTimeWindow: timeWindow });
    setSettings(prev => prev ? { ...prev, defaultTimeWindow: timeWindow } : null);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Settings</h1>
      <nav>
        <Link to="/">Home</Link>
      </nav>

      <section>
        <h2>Default Account</h2>
        <select
          value={settings?.defaultAccountId ?? ''}
          onChange={(e) => handleDefaultAccountChange(e.target.value)}
        >
          <option value="">None</option>
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.name}
            </option>
          ))}
        </select>
      </section>

      <section>
        <h2>Default Time Window</h2>
        <select
          value={settings?.defaultTimeWindow ?? 'month'}
          onChange={(e) => handleTimeWindowChange(e.target.value as TimeWindow)}
        >
          <option value="day">Day</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
          <option value="year">Year</option>
        </select>
      </section>
    </div>
  );
};
