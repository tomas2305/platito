import { Card, Group, Progress, Stack, Text } from '@mantine/core';
import { formatNumberToMonetary } from '../utils/formatters';

interface IncomeOutcomeComparisonProps {
  income: number;
  outcome: number;
  currency: string;
  periodLabel: string;
}

export const IncomeOutcomeComparison = ({
  income,
  outcome,
  currency,
  periodLabel,
}: IncomeOutcomeComparisonProps) => {
  const total = income + outcome;
  const incomePercentage = total > 0 ? (income / total) * 100 : 50;
  const outcomePercentage = total > 0 ? (outcome / total) * 100 : 50;
  const balance = income - outcome;
  const isPositive = balance >= 0;

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
            <Text size="xs" c="dimmed">{incomePercentage.toFixed(1)}% of total</Text>
          </Stack>
        </Card>

        <Card padding="sm" radius="md" withBorder style={{ backgroundColor: 'rgba(250, 82, 82, 0.05)' }}>
          <Stack gap={4}>
            <Text size="xs" c="dimmed">Total Outcome</Text>
            <Text size="lg" fw={600} c="red">
              {formatNumberToMonetary(outcome)} {currency}
            </Text>
            <Text size="xs" c="dimmed">{outcomePercentage.toFixed(1)}% of total</Text>
          </Stack>
        </Card>
      </Group>
    </Stack>
  );
};
