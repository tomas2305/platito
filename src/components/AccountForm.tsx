import { useState, useEffect } from 'react';
import { Button, Group, Modal, Select, Stack, Text, TextInput, Title } from '@mantine/core';
import type { Account, Currency } from '../types';
import { SUPPORTED_CURRENCIES } from '../utils/currency';
import { COLOR_PALETTE, type ColorName } from '../utils/colors';
import { formatMonetaryValue, parseMonetaryValue } from '../utils/formatters';
import { AccountIcon } from './AccountIcon';

interface AccountFormProps {
  account?: Account;
  opened: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Account, 'id'>) => Promise<void>;
}

const ICONS = [
  'IconCash',
  'IconWallet',
  'IconBuildingBank',
  'IconDeviceMobile',
  'IconCreditCard',
  'IconPig',
  'IconTrendingUp',
  'IconCurrencyDollar',
  'IconCurrencyEuro',
  'IconCoins',
];

export const AccountForm = ({ account, opened, onClose, onSubmit }: AccountFormProps) => {
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState<Currency>('ARS');
  const [initialBalance, setInitialBalance] = useState('');
  const [color, setColor] = useState<ColorName>('green');
  const [icon, setIcon] = useState('IconCash');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (account) {
      setName(account.name);
      setCurrency(account.currency);
      setInitialBalance(formatMonetaryValue(String(account.initialBalance)));
      setColor(account.color);
      setIcon(account.icon);
    } else {
      setName('');
      setCurrency('ARS');
      setInitialBalance('');
      setColor('green');
      setIcon('IconCash');
    }
  }, [account, opened]);

  const handleBalanceChange = (value: string) => {
    const formatted = formatMonetaryValue(value);
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
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Title order={4}>{account ? 'Edit Account' : 'Create Account'}</Title>}
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <TextInput
            label="Name"
            placeholder="Account name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={loading}
          />

          <Select
            label="Currency"
            data={SUPPORTED_CURRENCIES.map((c) => ({ value: c, label: c }))}
            value={currency}
            onChange={(value) => setCurrency(value as Currency)}
            disabled={loading || Boolean(account)}
            required
          />

          <TextInput
            label="Initial Balance"
            placeholder="0"
            type="text"
            inputMode="decimal"
            value={initialBalance}
            onChange={(e) => handleBalanceChange(e.target.value)}
            disabled={loading}
          />

          <div>
            <Text size="sm" fw={500} mb={8}>Icon</Text>
            <Group gap="sm">
              {ICONS.map((iconName) => (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => setIcon(iconName)}
                  style={{
                    width: '50px',
                    height: '50px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: icon === iconName ? '3px solid var(--mantine-color-blue-6)' : '2px solid var(--mantine-color-gray-4)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    backgroundColor: 'transparent',
                  }}
                  disabled={loading}
                  aria-label={iconName}
                >
                  <AccountIcon name={iconName} size={28} />
                </button>
              ))}
            </Group>
          </div>

          <div>
            <Text size="sm" fw={500} mb={8}>Color</Text>
            <Group gap="sm">
              {COLOR_PALETTE.map((colorOption) => (
                <button
                  key={colorOption.name}
                  type="button"
                  onClick={() => setColor(colorOption.name)}
                  style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: colorOption.hex,
                    border: color === colorOption.name ? '3px solid var(--mantine-color-blue-6)' : '2px solid transparent',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  disabled={loading}
                  aria-label={colorOption.name}
                />
              ))}
            </Group>
          </div>

          <Group justify="flex-end" gap="sm" mt="md">
            <Button variant="subtle" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {account ? 'Update' : 'Create'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};
