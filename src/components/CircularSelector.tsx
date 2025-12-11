import { Button, Group, Modal, Stack, Text } from '@mantine/core';
import { useState } from 'react';
import { getColorHex } from '../utils/colors';

export interface CircularSelectorItem {
  id: number | string;
  name: string;
  color: string;
  icon: React.ReactNode;
}

interface CircularSelectorProps {
  readonly label: string;
  readonly items: CircularSelectorItem[];
  readonly selectedId: string | number | null;
  readonly onSelect: (id: string | number) => void;
  readonly maxVisible?: number;
  readonly style?: React.CSSProperties;
}

export function CircularSelector({
  label,
  items,
  selectedId,
  onSelect,
  maxVisible = 15,
  style,
}: CircularSelectorProps) {
  const [modalOpened, setModalOpened] = useState(false);
  
  // If something is selected that's not in the first maxVisible items, show it first
  const orderedItems = selectedId && !items.slice(0, maxVisible).some(item => item.id === selectedId)
    ? [items.find(item => item.id === selectedId)!, ...items.filter(item => item.id !== selectedId)]
    : items;
  
  const visibleItems = orderedItems.slice(0, maxVisible);
  const hasMore = orderedItems.length > maxVisible;

  return (
    <>
      <Stack gap="xs" style={{ flexBasis: '100%', width: '100%', ...style }}>
        <Text component="label" fw={500} size="sm" style={{ textAlign: 'left' }}>
          {label}
        </Text>
        <Group gap="md">
          {visibleItems.map((item) => (
            <Button
              key={item.id}
              onClick={() => onSelect(item.id)}
              variant={selectedId === item.id ? 'light' : 'subtle'}
              color={getColorHex(item.color)}
              style={{
                width: 110,
                height: 110,
                borderRadius: '50%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                border: selectedId === item.id ? `2px solid ${getColorHex(item.color)}` : 'none',
              }}
            >
              <Stack gap={4} align="center" style={{ width: '100%' }}>
                {item.icon}
                <Text size="xs" fw={500} ta="center" style={{ wordBreak: 'break-word', fontSize: '11px' }}>
                  {item.name}
                </Text>
              </Stack>
            </Button>
          ))}
          {hasMore && (
            <Button
              onClick={() => setModalOpened(true)}
              variant="subtle"
              style={{
                width: 110,
                height: 110,
                borderRadius: '50%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
              }}
            >
              <Stack gap={4} align="center" style={{ width: '100%' }}>
                <Text size="lg" fw={700}>+{orderedItems.length - maxVisible}</Text>
                <Text size="xs" fw={500} ta="center">
                  More
                </Text>
              </Stack>
            </Button>
          )}
        </Group>
      </Stack>

      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title={`Select ${label.toLowerCase()}`}
        size="lg"
      >
        <Group gap="md" wrap="wrap">
          {orderedItems.map((item) => (
            <Button
              key={item.id}
              onClick={() => {
                onSelect(item.id);
                setModalOpened(false);
              }}
              variant={selectedId === item.id ? 'light' : 'subtle'}
              color={getColorHex(item.color)}
              style={{
                width: 100,
                height: 100,
                borderRadius: '50%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                border: selectedId === item.id ? `2px solid ${getColorHex(item.color)}` : 'none',
              }}
            >
              <Stack gap={4} align="center" style={{ width: '100%' }}>
                {item.icon}
                <Text size="xs" fw={500} ta="center" style={{ wordBreak: 'break-word', fontSize: '10px' }}>
                  {item.name}
                </Text>
              </Stack>
            </Button>
          ))}
        </Group>
      </Modal>
    </>
  );
}
