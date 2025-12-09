import { useState, useEffect } from 'react';
import type { Account, Currency } from '../types';
import { SUPPORTED_CURRENCIES } from '../utils/currency';
import { formatMonetaryValue, parseMonetaryValue } from '../utils/formatters';

interface AccountFormProps {
  account?: Account;
  onSubmit: (data: Omit<Account, 'id'>) => Promise<void>;
  onCancel: () => void;
}

const ICONS = ['wallet', 'bank', 'credit-card', 'piggy-bank', 'cash'];
const COLORS = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336', '#607D8B'];

export const AccountForm = ({ account, onSubmit, onCancel }: AccountFormProps) => {
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState<Currency>('ARS');
  const [initialBalance, setInitialBalance] = useState('');
  const [color, setColor] = useState('#4CAF50');
  const [icon, setIcon] = useState('wallet');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (account) {
      setName(account.name);
      setCurrency(account.currency);
      setInitialBalance(formatMonetaryValue(String(account.initialBalance)));
      setColor(account.color);
      setIcon(account.icon);
    }
  }, [account]);

  const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formatted = formatMonetaryValue(rawValue);
    setInitialBalance(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit({
        name,
        currency,
        initialBalance: parseMonetaryValue(initialBalance),
        color,
        icon,
        isArchived: account?.isArchived ?? false,
      });
    } finally {
      setLoading(false);
    }
  };

  const getButtonText = () => {
    if (loading) return 'Saving...';
    return account ? 'Update' : 'Create';
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>{account ? 'Edit Account' : 'Create Account'}</h3>

      <div>
        <label>
          Name:
          {' '}
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={loading}
          />
        </label>
      </div>

      <div>
        <label>
          Currency:
          {' '}
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as Currency)}
            disabled={loading || Boolean(account)}
          >
            {SUPPORTED_CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <label>
          Initial Balance:
          {' '}
          <input
            type="text"
            inputMode="decimal"
            value={initialBalance}
            onChange={handleBalanceChange}
            disabled={loading}
            placeholder="0"
          />
        </label>
      </div>

      <div>
        <label>
          Icon:
          {' '}
          <select value={icon} onChange={(e) => setIcon(e.target.value)} disabled={loading}>
            {ICONS.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <label>
          Color:
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: c,
                  border: color === c ? '3px solid black' : '1px solid #ccc',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
                disabled={loading}
              />
            ))}
          </div>
        </label>
      </div>

      <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
        <button type="submit" disabled={loading}>
          {getButtonText()}
        </button>
        <button type="button" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
      </div>
    </form>
  );
};
