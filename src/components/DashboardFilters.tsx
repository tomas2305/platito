import { Button, Group, SegmentedControl, Select, Text } from '@mantine/core';
import type { Account, TransactionType, TimeWindow } from '../types';
import { AccountIcon } from './AccountIcon';

interface DashboardFiltersProps {
  accounts: Account[];
  typeFilter: TransactionType;
  setTypeFilter: (type: TransactionType) => void;
  accountFilter: number | null;
  setAccountFilter: (id: number | null) => void;
  timeWindow: TimeWindow;
  setTimeWindow: (window: TimeWindow) => void;
  periodLabel: string;
  handlePrevPeriod: () => void;
  handleNextPeriod: () => void;
  disableNext: boolean;
}

export const DashboardFilters = ({
  accounts,
  typeFilter,
  setTypeFilter,
  accountFilter,
  setAccountFilter,
  timeWindow,
  setTimeWindow,
  periodLabel,
  handlePrevPeriod,
  handleNextPeriod,
  disableNext,
}: DashboardFiltersProps) => {
  return (
    <Group gap="md" wrap="wrap" align="center">
      <div>
        <Text size="sm" fw={500} mb={4}>Type</Text>
        <SegmentedControl
          value={typeFilter}
          onChange={(value) => setTypeFilter(value as TransactionType)}
          data={[
            { label: 'Expense', value: 'expense' },
            { label: 'Income', value: 'income' },
          ]}
        />
      </div>

      <Select
        label="Account"
        placeholder="All accounts"
        data={accounts.map((acc) => ({ value: String(acc.id), label: acc.name, icon: acc.icon }))}
        value={accountFilter ? String(accountFilter) : null}
        onChange={(value) => setAccountFilter(value ? Number(value) : null)}
        clearable
        searchable
        withinPortal
        renderOption={({ option }) => {
          const account = accounts.find(acc => String(acc.id) === option.value);
          return (
            <Group gap="sm">
              {account && <AccountIcon name={account.icon} size={20} />}
              <span>{option.label}</span>
            </Group>
          );
        }}
      />

      <div>
        <Text size="sm" fw={500} mb={4}>Time window</Text>
        <SegmentedControl
          value={timeWindow}
          onChange={(value) => setTimeWindow(value as TimeWindow)}
          data={[
            { label: 'Day', value: 'day' },
            { label: 'Week', value: 'week' },
            { label: 'Month', value: 'month' },
            { label: 'Year', value: 'year' },
          ]}
        />
      </div>

      <Group gap="xs" align="center">
        <Button variant="light" size="sm" onClick={handlePrevPeriod}>
          ← Prev
        </Button>
        <Text size="sm" fw={500} style={{ minWidth: 150, textAlign: 'center' }}>
          {periodLabel}
        </Text>
        <Button variant="light" size="sm" onClick={handleNextPeriod} disabled={disableNext}>
          Next →
        </Button>
      </Group>
    </Group>
  );
};
