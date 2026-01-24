import { Group, Paper, Stack, Text } from '@mantine/core';
import type { Category } from '../types';
import { getColorHex } from '../utils/colors';
import { CategoryIcon } from './CategoryIcon';

interface CategoryListProps {
  data: Array<{ category: Category; amount: number }>;
  total: number;
}

export const CategoryBreakdown = ({ data, total }: CategoryListProps) => {
  if (data.length === 0) {
    return <Text c="dimmed">No transactions</Text>;
  }

  return (
    <Stack gap="sm" style={{ maxHeight: '600px', overflowY: 'auto', paddingRight: '8px' }}>
      <Paper p="md" radius="md" withBorder>
        <Group justify="space-between">
          <Text fw={700}>Total</Text>
          <Text fw={700}>{total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
        </Group>
      </Paper>
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
              <Group gap="sm" align="flex-start">
                <CategoryIcon name={item.category.icon} size={24} />
                <Stack gap={4} align="flex-start">
                  <Text fw={600}>{item.category.name}</Text>
                  <Text size="sm" c="dimmed">{pct}% of total</Text>
                </Stack>
              </Group>
              <Text fw={600}>{item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            </Group>
          </Paper>
        );
      })}
    </Stack>
  );
};
