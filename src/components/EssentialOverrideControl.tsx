import { SegmentedControl, Stack, Text } from '@mantine/core';
import type { EssentialOverrideOption } from '../utils/essentialOverride';

interface Props {
  value: EssentialOverrideOption;
  onChange: (value: EssentialOverrideOption) => void;
  labelWeight?: number;
  labelColor?: string;
}

export const EssentialOverrideControl = ({ value, onChange, labelWeight, labelColor = 'dimmed' }: Props) => (
  <Stack gap={4}>
    <Text size="sm" c={labelWeight ? undefined : labelColor} fw={labelWeight}>Essential classification</Text>
    <SegmentedControl
      value={value}
      onChange={(v) => onChange(v as EssentialOverrideOption)}
      data={[
        { label: 'Use category default', value: 'default' },
        { label: 'Mark as essential', value: 'essential' },
        { label: 'Mark as discretionary', value: 'discretionary' },
      ]}
    />
  </Stack>
);
