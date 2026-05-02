import { Group, SegmentedControl, Text, Paper } from '@mantine/core';
import type { TransactionType, TimeWindow } from '../types';
import { PeriodNavigator } from './PeriodNavigator';

interface DashboardFiltersProps {
  typeFilter: TransactionType;
  setTypeFilter: (type: TransactionType) => void;
  timeWindow: TimeWindow;
  setTimeWindow: (window: TimeWindow) => void;
  periodLabel: string;
  handlePrevPeriod: () => void;
  handleNextPeriod: () => void;
  disableNext: boolean;
}

export const DashboardFilters = ({
  typeFilter,
  setTypeFilter,
  timeWindow,
  setTimeWindow,
  periodLabel,
  handlePrevPeriod,
  handleNextPeriod,
  disableNext,
}: DashboardFiltersProps) => {
  return (
    <Paper
      shadow="sm"
      radius="md"
      withBorder
      style={{
        padding: '20px 24px',
      }}
    >
      <Group gap="xl" wrap="wrap" align="center" justify="center">
        <div>
          <Text size="sm" fw={500} mb={8} c="dimmed">Type</Text>
          <SegmentedControl
            value={typeFilter}
            onChange={(value) => setTypeFilter(value as TransactionType)}
            data={[
              { label: 'Expense', value: 'expense' },
              { label: 'Income', value: 'income' },
            ]}
          />
        </div>

        <div>
          <Text size="sm" fw={500} mb={8} c="dimmed">Time window</Text>
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

        <PeriodNavigator
          periodLabel={periodLabel}
          onPrev={handlePrevPeriod}
          onNext={handleNextPeriod}
          disableNext={disableNext}
        />
      </Group>
    </Paper>
  );
};
