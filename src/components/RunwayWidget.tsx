import { Card, Divider, Group, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconLifebuoy } from '@tabler/icons-react';
import { formatNumberToMonetary } from '../utils/formatters';
import type { RunwayMetrics } from '../types';

interface RunwayWidgetProps {
  metrics: RunwayMetrics;
  currency: string;
}

const getRunwayColor = (months: number | null): string => {
  if (months === null) return 'gray';
  if (months < 3) return 'red';
  if (months < 6) return 'yellow';
  return 'teal';
};

const formatMonths = (months: number | null): string => (months === null ? '—' : `${months.toFixed(1)} months`);

const formatYears = (months: number | null): string | null => (months === null ? null : `≈ ${(months / 12).toFixed(1)} years`);

const RunwayRangeBar = ({ nowMonths, maxMonths }: { nowMonths: number; maxMonths: number }) => {
  const nowPercent = maxMonths > 0 ? Math.min(100, (nowMonths / maxMonths) * 100) : 0;

  return (
    <div style={{ position: 'relative', paddingTop: 32, paddingBottom: 4 }}>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: `${nowPercent}%`,
          transform: 'translateX(-50%)',
          whiteSpace: 'nowrap',
        }}
      >
        <Text
          size="xs"
          fw={600}
          c="teal"
          style={{
            backgroundColor: 'var(--mantine-color-teal-0)',
            border: '1px solid var(--mantine-color-teal-3)',
            borderRadius: 6,
            padding: '2px 8px',
          }}
        >
          Now
        </Text>
      </div>
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          whiteSpace: 'nowrap',
        }}
      >
        <Text
          size="xs"
          fw={600}
          c="dimmed"
          style={{
            backgroundColor: 'var(--mantine-color-gray-0)',
            border: '1px solid var(--mantine-color-gray-3)',
            borderRadius: 6,
            padding: '2px 8px',
          }}
        >
          Max
        </Text>
      </div>
      <div
        style={{
          position: 'relative',
          height: 10,
          borderRadius: 999,
          backgroundColor: 'var(--mantine-color-teal-1)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: `${nowPercent}%`,
            backgroundColor: 'var(--mantine-color-teal-6)',
            borderRadius: 999,
          }}
        />
      </div>
    </div>
  );
};

export const RunwayWidget = ({ metrics, currency }: RunwayWidgetProps) => {
  const { totalBalance, conservativeRunwayMonths, currentHabitsRunwayMonths } = metrics;
  const conservativeColor = getRunwayColor(conservativeRunwayMonths);
  const currentHabitsColor = getRunwayColor(currentHabitsRunwayMonths);

  const gap = conservativeRunwayMonths !== null && currentHabitsRunwayMonths !== null
    ? conservativeRunwayMonths - currentHabitsRunwayMonths
    : null;

  return (
    <Card padding="lg" radius="md" withBorder>
      <Stack gap="md">
        <Group gap="sm">
          <ThemeIcon size={48} radius="md" color={conservativeColor} variant="light">
            <IconLifebuoy size={26} />
          </ThemeIcon>
          <div>
            <Text size="lg" fw={700}>Runway</Text>
            <Text size="sm" c="dimmed">
              Total balance: {formatNumberToMonetary(totalBalance)} {currency}
            </Text>
          </div>
        </Group>

        <Divider />

        <Group justify="space-between">
          <div>
            <Text size="sm" c="dimmed">Conservative (essential only)</Text>
            <Text size="xl" fw={700} c={conservativeColor}>{formatMonths(conservativeRunwayMonths)}</Text>
            {formatYears(conservativeRunwayMonths) && (
              <Text size="xs" c="dimmed">{formatYears(conservativeRunwayMonths)}</Text>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <Text size="sm" c="dimmed">Current habits (total spend)</Text>
            <Text size="xl" fw={700} c={currentHabitsColor}>{formatMonths(currentHabitsRunwayMonths)}</Text>
            {formatYears(currentHabitsRunwayMonths) && (
              <Text size="xs" c="dimmed">{formatYears(currentHabitsRunwayMonths)}</Text>
            )}
          </div>
        </Group>

        {conservativeRunwayMonths !== null && currentHabitsRunwayMonths !== null && (
          <RunwayRangeBar nowMonths={currentHabitsRunwayMonths} maxMonths={conservativeRunwayMonths} />
        )}

        <Divider />

        {gap !== null && (
          <Text size="sm" c="dimmed">
            Decision range: <Text component="span" fw={700} c="dark">{gap.toFixed(1)} months (≈ {(gap / 12).toFixed(1)} years)</Text> between cutting all discretionary spend and keeping current habits.
          </Text>
        )}
      </Stack>
    </Card>
  );
};
