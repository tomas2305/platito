import { Button, Group, SegmentedControl, Select, Text } from '@mantine/core';
import type { Account, TransactionType, TimeWindow } from '../types';

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
        data={accounts.map((acc) => ({ value: String(acc.id), label: acc.name }))}
        value={accountFilter ? String(accountFilter) : null}
        onChange={(value) => setAccountFilter(value ? Number(value) : null)}
        clearable
        searchable
        withinPortal
      />

      <Select
        label="Time window"
        data={[
          { value: 'day', label: 'Day' },
          { value: 'week', label: 'Week' },
          { value: 'month', label: 'Month' },
          { value: 'year', label: 'Year' },
        ]}
        value={timeWindow}
        onChange={(value) => setTimeWindow(value as TimeWindow)}
        withinPortal
      />

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
