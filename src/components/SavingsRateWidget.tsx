import { Card, Group, Progress, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconPigMoney, IconTrendingUp, IconTrendingDown, IconMinus } from '@tabler/icons-react';
import { formatNumberToMonetary } from '../utils/formatters';
import type { SavingsMetrics } from '../types';

interface SavingsRateWidgetProps {
  metrics: SavingsMetrics;
  previousMetrics?: SavingsMetrics;
  currency: string;
}

const getSavingsColor = (
  savingsRate: number,
  targetRate?: number
): { color: string; backgroundColor: string } => {
  if (targetRate === undefined) {
    return { color: 'blue', backgroundColor: 'rgba(34, 139, 230, 0.05)' };
  }

  const difference = savingsRate - targetRate;
  
  if (difference >= 0) {
    return { color: 'teal', backgroundColor: 'rgba(18, 184, 134, 0.05)' };
  }
  
  if (Math.abs(difference) <= 10) {
    return { color: 'yellow', backgroundColor: 'rgba(250, 176, 5, 0.05)' };
  }
  
  return { color: 'red', backgroundColor: 'rgba(250, 82, 82, 0.05)' };
};

const getTrendIndicator = (current: number, previous?: number) => {
  if (previous === undefined || current === previous) {
    return { icon: IconMinus, label: 'No change' };
  }
  
  if (current > previous) {
    return { icon: IconTrendingUp, label: `+${(current - previous).toFixed(1)}%` };
  }
  
  return { icon: IconTrendingDown, label: `-${(previous - current).toFixed(1)}%` };
};

export const SavingsRateWidget = ({ metrics, previousMetrics, currency }: SavingsRateWidgetProps) => {
  const { savingsRate, targetSavingsRate, totalSaved, income, isTargetMet, period } = metrics;
  const { color, backgroundColor } = getSavingsColor(savingsRate, targetSavingsRate);
  const trend = getTrendIndicator(savingsRate, previousMetrics?.savingsRate);
  const TrendIcon = trend.icon;
  
  const [year, month] = period.split('-');
  const monthName = new Date(Number(year), Number(month) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <Card padding="lg" radius="md" withBorder style={{ backgroundColor }}>
      <Stack gap="md">
        <Group justify="space-between" align="flex-start">
          <Group gap="sm">
            <ThemeIcon size="xl" radius="md" color={color} variant="light">
              <IconPigMoney size={28} />
            </ThemeIcon>
            <div>
              <Text size="md" c="dimmed" fw={600}>Savings Rate</Text>
              <Text size="sm" c="dimmed" fw={700}>
                {monthName}
              </Text>
              <Text size="sm" c="dimmed">
                Saved {formatNumberToMonetary(totalSaved)} {currency} of {formatNumberToMonetary(income)} {currency}
              </Text>
            </div>
          </Group>
          <Text size="3rem" fw={700} c={color}>
            {savingsRate.toFixed(1)}%
          </Text>
        </Group>

        {targetSavingsRate !== undefined && (
          <Stack gap="xs">
            <Group justify="space-between">
              <Text size="sm" c="dimmed">Target: {targetSavingsRate}%</Text>
              <Text size="sm" fw={500} c={isTargetMet ? 'teal' : 'red'}>
                {isTargetMet ? 'Target Met' : `${(targetSavingsRate - savingsRate).toFixed(1)}% below target`}
              </Text>
            </Group>
            <Progress value={savingsRate} size="xl" radius="xl" color={color} />
          </Stack>
        )}

        {previousMetrics && trend.icon !== IconMinus && (
          <Group gap={4} justify="center">
            <TrendIcon size={18} color={trend.icon === IconTrendingUp ? 'green' : 'red'} />
            <Text size="sm" c={trend.icon === IconTrendingUp ? 'teal' : 'red'} fw={500}>
              {trend.label} vs previous period
            </Text>
          </Group>
        )}
      </Stack>
    </Card>
  );
};
