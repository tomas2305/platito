import React from 'react';
import { Button } from '@mantine/core';
import type { Currency } from '../types';

interface CurrencySelectorProps {
  value: Currency;
  onChange: (currency: Currency) => void;
}

const CURRENCIES: Array<{ value: Currency; label: string }> = [
  { value: 'ARS', label: 'ARS' },
  { value: 'USD_MEP', label: 'MEP' },
];

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({ value, onChange }) => {
  return (
    <Button.Group>
      {CURRENCIES.map(({ value: currency, label }) => (
        <Button
          key={currency}
          size="xs"
          variant={value === currency ? 'filled' : 'light'}
          onClick={() => onChange(currency)}
        >
          {label}
        </Button>
      ))}
    </Button.Group>
  );
};
