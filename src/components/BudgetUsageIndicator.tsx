import { Card, Group, Progress, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconWallet } from '@tabler/icons-react';
import { formatNumberToMonetary } from '../utils/formatters';
import type { SavingsMetrics } from '../types';

interface BudgetUsageIndicatorProps {
  metrics: SavingsMetrics;
  currency: string;
}

const getBudgetColor = (usageRate: number): string => {
  if (usageRate <= 80) return 'teal';
  if (usageRate <= 100) return 'yellow';
  return 'red';
};

const getBudgetStatus = (usageRate: number): string => {
  if (usageRate <= 80) return 'Healthy';
  if (usageRate <= 100) return 'Tight';
  return 'Overspending';
};

export const BudgetUsageIndicator = ({ metrics, currency }: BudgetUsageIndicatorProps) => {
  const { budgetUsageRate, availableBudget, income, expenses, totalSaved, period } = metrics;
  const color = getBudgetColor(budgetUsageRate);
  const status = getBudgetStatus(budgetUsageRate);
  
  const [year, month] = period.split('-');
  const monthName = new Date(Number(year), Number(month) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  
  // Calculate percentages for each segment, capped so they never sum past 100
  const rawSaved = income > 0 ? (totalSaved / income) * 100 : 0;
  const rawExpenses = income > 0 ? (expenses / income) * 100 : 0;
  const rawAvailable = income > 0 ? Math.max(0, (availableBudget / income) * 100) : 0;
  const totalRaw = rawSaved + rawExpenses + rawAvailable;
  const scale = totalRaw > 100 ? 100 / totalRaw : 1;
  const savedPercentage = rawSaved * scale;
  const expensesPercentage = rawExpenses * scale;
  const availablePercentage = rawAvailable * scale;

  return (
    <Card padding="lg" radius="md" withBorder>
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Group gap="sm">
            <ThemeIcon size="xl" radius="md" color={color} variant="light">
              <IconWallet size={28} />
            </ThemeIcon>
            <div>
              <Text size="md" fw={600}>Budget Usage</Text>
              <Text size="sm" c="dimmed" fw={700}>{monthName}</Text>
              <Text size="sm" c="dimmed">{status}</Text>
            </div>
          </Group>
          <Text size="2rem" fw={700} c={color}>
            {budgetUsageRate.toFixed(1)}%
          </Text>
        </Group>

        <div>
          <Progress.Root size="xl" radius="xl">
            <Progress.Section value={savedPercentage} color="teal">
              <Progress.Label>{savedPercentage > 10 ? `${savedPercentage.toFixed(0)}%` : ''}</Progress.Label>
            </Progress.Section>
            <Progress.Section value={expensesPercentage} color="red">
              <Progress.Label>{expensesPercentage > 10 ? `${expensesPercentage.toFixed(0)}%` : ''}</Progress.Label>
            </Progress.Section>
            <Progress.Section value={availablePercentage} color="gray">
              <Progress.Label>{availablePercentage > 10 ? `${availablePercentage.toFixed(0)}%` : ''}</Progress.Label>
            </Progress.Section>
          </Progress.Root>
          <Group justify="space-between" mt="xs">
            <Text size="sm" c="teal" fw={600}>● Saved: {formatNumberToMonetary(totalSaved)}</Text>
            <Text size="sm" c="red" fw={600}>● Spent: {formatNumberToMonetary(expenses)}</Text>
            <Text size="sm" c="gray" fw={600}>● Available: {formatNumberToMonetary(Math.max(0, availableBudget))}</Text>
          </Group>
        </div>

        <Group justify="space-between">
          <div>
            <Text size="sm" c="dimmed">Total Income</Text>
            <Text size="lg" fw={600}>
              {formatNumberToMonetary(income)} {currency}
            </Text>
          </div>
        </Group>
      </Stack>
    </Card>
  );
};
