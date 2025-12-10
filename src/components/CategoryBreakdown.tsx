import { Group, Paper, Stack, Text } from '@mantine/core';
import type { Category } from '../types';
import { getColorHex } from '../utils/colors';

interface CategoryListProps {
  data: Array<{ category: Category; amount: number }>;
  total: number;
}

export const CategoryBreakdown = ({ data, total }: CategoryListProps) => {
  if (data.length === 0) {
    return <Text c="dimmed">No transactions</Text>;
  }

  return (
    <Stack gap="sm">
      {data.map((item) => {
        const pct = total > 0 ? ((item.amount / total) * 100).toFixed(1) : '0.0';
        const color = getColorHex(item.category.color);
        return (
          <Paper
            key={item.category.id}
            p="md"
            radius="md"
            withBorder
            style={{
              backgroundColor: `${color}20`,
              borderLeft: `4px solid ${color}`,
            }}
          >
            <Group justify="space-between" align="flex-start">
              <Stack gap={4}>
                <Text fw={600}>{item.category.name}</Text>
                <Text size="sm" c="dimmed">{pct}% of total</Text>
              </Stack>
              <Text fw={600}>{item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            </Group>
          </Paper>
        );
      })}
      <Paper p="md" radius="md" withBorder>
        <Group justify="space-between">
          <Text fw={700}>Total</Text>
          <Text fw={700}>{total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
        </Group>
      </Paper>
    </Stack>
  );
};
