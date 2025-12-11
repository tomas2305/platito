import { Button, Group, Text } from '@mantine/core';

interface PeriodNavigatorProps {
  periodLabel: string;
  onPrev: () => void;
  onNext: () => void;
  disableNext?: boolean;
}

export const PeriodNavigator = ({
  periodLabel,
  onPrev,
  onNext,
  disableNext = false,
}: PeriodNavigatorProps) => {
  return (
    <Group gap="xs" align="center">
      <Button variant="light" size="sm" onClick={onPrev}>
        ← Prev
      </Button>
      <Text size="sm" fw={500} style={{ minWidth: 150, textAlign: 'center' }}>
        {periodLabel}
      </Text>
      <Button variant="light" size="sm" onClick={onNext} disabled={disableNext}>
        Next →
      </Button>
    </Group>
  );
};
