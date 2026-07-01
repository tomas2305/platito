import { Card, Divider, Group, Paper, Progress, SegmentedControl, SimpleGrid, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconHomeShield, IconTrendingUp, IconTrendingDown, IconMinus } from '@tabler/icons-react';
import { formatNumberToMonetary } from '../utils/formatters';
import { getColorHex } from '../utils/colors';
import type { BaselinePeriod, EssentialBaselineMetrics } from '../types';

interface EssentialBaselineWidgetProps {
  metrics: EssentialBaselineMetrics;
  trend: number | null;
  period: BaselinePeriod;
  onPeriodChange: (period: BaselinePeriod) => void;
  currency: string;
}

const PERIOD_OPTIONS: Array<{ label: string; value: BaselinePeriod }> = [
  { label: '1 Year', value: '1y' },
  { label: '6 Months', value: '6m' },
  { label: 'Ever', value: 'ever' },
];

const getIncomeShareColor = (percentOfIncome: number): string => {
  if (percentOfIncome <= 0.5) return 'teal';
  if (percentOfIncome <= 0.7) return 'yellow';
  return 'red';
};

const getTrendIndicator = (trend: number | null) => {
  if (trend === null || Math.abs(trend) < 0.005) {
    return { icon: IconMinus, color: 'gray', label: 'No change' };
  }
  if (trend > 0) {
    return { icon: IconTrendingUp, color: 'red', label: `+${(trend * 100).toFixed(1)}%` };
  }
  return { icon: IconTrendingDown, color: 'teal', label: `${(trend * 100).toFixed(1)}%` };
};

const StatBox = ({
  label,
  value,
  valueColor,
  icon: Icon,
}: {
  label: string;
  value: string;
  valueColor?: string;
  icon?: typeof IconTrendingUp;
}) => (
  <Paper radius="md" p="sm" bg="var(--mantine-color-gray-0)">
    <Text size="xs" c="dimmed" tt="uppercase" fw={600}>{label}</Text>
    <Group gap={4} wrap="nowrap" align="center">
      {Icon && <Icon size={14} color={valueColor ? `var(--mantine-color-${valueColor}-6)` : undefined} />}
      <Text size="md" fw={700} c={valueColor} truncate>{value}</Text>
    </Group>
  </Paper>
);

export const EssentialBaselineWidget = ({ metrics, trend, period, onPeriodChange, currency }: EssentialBaselineWidgetProps) => {
  const {
    monthlyAverage,
    monthlyMedian,
    stdDev,
    min,
    max,
    categoryBreakdown,
    percentOfIncome,
    isLowSample,
    monthsIncluded,
  } = metrics;

  const incomeColor = getIncomeShareColor(percentOfIncome);
  const trendInfo = getTrendIndicator(trend);
  const TrendIcon = trendInfo.icon;
  const maxCategoryAmount = categoryBreakdown[0]?.monthlyAverage || 1;

  return (
    <Card padding="lg" radius="md" withBorder>
      <Stack gap="md">
        <Group justify="space-between" align="flex-start">
          <Group gap="sm">
            <ThemeIcon size={48} radius="md" color={incomeColor} variant="light">
              <IconHomeShield size={26} />
            </ThemeIcon>
            <div>
              <Text size="lg" fw={700}>Essential Baseline</Text>
              <Text size="sm" c="dimmed">Monthly floor spend</Text>
            </div>
          </Group>
          <SegmentedControl
            size="sm"
            value={period}
            onChange={(value) => onPeriodChange(value as BaselinePeriod)}
            data={PERIOD_OPTIONS}
          />
        </Group>

        <Divider />

        <Text size="2.75rem" fw={800} c={incomeColor} lh={1}>
          {formatNumberToMonetary(monthlyAverage)} {currency}
        </Text>

        <SimpleGrid cols={3} spacing="sm">
          <StatBox label="Median" value={formatNumberToMonetary(monthlyMedian)} />
          <StatBox label="% of income" value={`${(percentOfIncome * 100).toFixed(1)}%`} valueColor={incomeColor} />
          <StatBox label="6M vs 1Y" value={trendInfo.label} valueColor={trendInfo.color} icon={TrendIcon} />
        </SimpleGrid>

        <Text size="sm" c="dimmed">
          Range: {formatNumberToMonetary(min)} – {formatNumberToMonetary(max)} {currency} (σ {formatNumberToMonetary(stdDev)})
        </Text>

        {categoryBreakdown.length > 0 && (
          <>
            <Divider />
            <Stack gap={8}>
              <Text size="xs" fw={600} c="dimmed" tt="uppercase">By category</Text>
              {categoryBreakdown.slice(0, 5).map((item) => (
                <Group key={item.categoryId} gap="sm" wrap="nowrap" align="center">
                  <Text size="sm" style={{ width: 120, flexShrink: 0 }} truncate>{item.categoryName}</Text>
                  <Progress
                    value={(item.monthlyAverage / maxCategoryAmount) * 100}
                    color={getColorHex(item.categoryColor)}
                    size="md"
                    radius="xl"
                    style={{ flex: 1 }}
                  />
                  <Text size="sm" fw={600} style={{ width: 110, textAlign: 'right', flexShrink: 0 }}>
                    {formatNumberToMonetary(item.monthlyAverage)}
                  </Text>
                </Group>
              ))}
            </Stack>
          </>
        )}

        {isLowSample && (
          <Text size="xs" c="dimmed">Sample size is small ({monthsIncluded} month{monthsIncluded === 1 ? '' : 's'} of data).</Text>
        )}
      </Stack>
    </Card>
  );
};
