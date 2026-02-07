import { Card, Group, Progress, Stack, Text } from '@mantine/core';
import { IconTrendingUp, IconTrendingDown } from '@tabler/icons-react';
import { formatNumberToMonetary } from '../utils/formatters';

interface IncomeOutcomeComparisonProps {
  income: number;
  outcome: number;
  previousIncome: number;
  previousOutcome: number;
  currency: string;
  periodLabel: string;
}

const calculateChange = (current: number, previous: number): { percentage: number; isIncrease: boolean; isNoChange: boolean } => {
  if (previous === 0) {
    return { percentage: current > 0 ? 100 : 0, isIncrease: current > 0, isNoChange: current === 0 };
  }
  const change = ((current - previous) / previous) * 100;
  return { percentage: Math.abs(change), isIncrease: change > 0, isNoChange: change === 0 };
};

export const IncomeOutcomeComparison = ({
  income,
  outcome,
  previousIncome,
  previousOutcome,
  currency,
  periodLabel,
}: IncomeOutcomeComparisonProps) => {
  const total = income + outcome;
  const incomePercentage = total > 0 ? (income / total) * 100 : 50;
  const outcomePercentage = total > 0 ? (outcome / total) * 100 : 50;
  const balance = income - outcome;
  const isPositive = balance >= 0;
  
  const incomeChange = calculateChange(income, previousIncome);
  const outcomeChange = calculateChange(outcome, previousOutcome);

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Text size="sm" fw={500}>Period: {periodLabel}</Text>
        <Group gap="xs">
          <Text size="sm" c="dimmed">Balance:</Text>
          <Text size="lg" fw={700} c={isPositive ? 'green' : 'red'}>
            {isPositive ? '+' : ''}{formatNumberToMonetary(balance)} {currency}
          </Text>
        </Group>
      </Group>

      <Progress.Root size={32}>
        <Progress.Section value={incomePercentage} color="teal">
          <Progress.Label>Income ({incomePercentage.toFixed(1)}%)</Progress.Label>
        </Progress.Section>
        <Progress.Section value={outcomePercentage} color="red">
          <Progress.Label>Outcome ({outcomePercentage.toFixed(1)}%)</Progress.Label>
        </Progress.Section>
      </Progress.Root>

      <Group justify="space-between" grow>
        <Card padding="sm" radius="md" withBorder style={{ backgroundColor: 'rgba(18, 184, 134, 0.05)' }}>
          <Stack gap={4}>
            <Text size="xs" c="dimmed">Total Income</Text>
            <Text size="lg" fw={600} c="teal">
              {formatNumberToMonetary(income)} {currency}
            </Text>
            {!incomeChange.isNoChange && (
              <Group gap={2} style={{ color: incomeChange.isIncrease ? 'green' : 'red' }}>
                {incomeChange.isIncrease ? <IconTrendingUp size={14} /> : <IconTrendingDown size={14} />}
                <Text size="xs" fw={500}>
                  {incomeChange.isIncrease ? '+' : '-'}{incomeChange.percentage.toFixed(1)}% vs previous
                </Text>
              </Group>
            )}
          </Stack>
        </Card>

        <Card padding="sm" radius="md" withBorder style={{ backgroundColor: 'rgba(250, 82, 82, 0.05)' }}>
          <Stack gap={4}>
            <Text size="xs" c="dimmed">Total Outcome</Text>
            <Text size="lg" fw={600} c="red">
              {formatNumberToMonetary(outcome)} {currency}
            </Text>
            {!outcomeChange.isNoChange && (
              <Group gap={2} style={{ color: outcomeChange.isIncrease ? 'red' : 'green' }}>
                {outcomeChange.isIncrease ? <IconTrendingUp size={14} /> : <IconTrendingDown size={14} />}
                <Text size="xs" fw={500}>
                  {outcomeChange.isIncrease ? '+' : '-'}{outcomeChange.percentage.toFixed(1)}% vs previous
                </Text>
              </Group>
            )}
          </Stack>
        </Card>
      </Group>
    </Stack>
  );
};
