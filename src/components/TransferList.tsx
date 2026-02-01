import { useMemo, useState } from 'react';
import { ActionIcon, Badge, Button, Card, Collapse, Group, Paper, Stack, Text } from '@mantine/core';
import { IconArrowRight, IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import type { Account, Transfer } from '../types';
import { formatNumberToMonetary } from '../utils/formatters';
import { AccountIcon } from './AccountIcon';

type Props = {
  transfers: Transfer[];
  accounts: Account[];
  onEdit?: (transfer: Transfer) => void;
  onDelete?: (id: number) => void;
  showActions?: boolean;
};

const formatDateHeader = (dateKey: string): string => {
  const date = new Date(dateKey + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

export const TransferList = ({ transfers, accounts, onEdit, onDelete, showActions = true }: Props) => {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const accountMap = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);

  const toggleExpanded = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const byDate = useMemo(() => {
    const grouped = new Map<string, Transfer[]>();
    for (const transfer of transfers) {
      const dateKey = transfer.date;
      const existing = grouped.get(dateKey) || [];
      grouped.set(dateKey, [...existing, transfer]);
    }
    return Array.from(grouped.entries())
      .map(([date, list]) => ({ date, transfers: list }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transfers]);

  if (transfers.length === 0) {
    return (
      <Card p="xl" radius="md" withBorder>
        <Text c="dimmed" ta="center">
          No transfers found
        </Text>
      </Card>
    );
  }

  return (
    <Stack gap="md" style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '4px' }}>
      {byDate.map(({ date, transfers: dayTransfers }) => (
        <Stack gap="sm" key={date}>
          <Text fw={600} size="sm" c="dimmed" ta="left">{formatDateHeader(date)}</Text>
          {dayTransfers.map((transfer) => {
            const fromAccount = accountMap.get(transfer.fromAccountId);
            const toAccount = accountMap.get(transfer.toAccountId);
            const isExpanded = transfer.id ? expandedIds.has(transfer.id) : false;
            const hasDetails = true; // Siempre hay exchange rate para mostrar

            return (
              <Paper
                key={transfer.id}
                p="sm"
                radius="md"
                withBorder
                style={{
                  backgroundColor: '#0ea5e908',
                  borderLeft: '3px solid #0ea5e9',
                }}
              >
                <Stack gap="xs">
                  <Group justify="space-between" align="center" wrap="nowrap" gap="xs">
                    <Group gap="sm" align="center" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                      {/* Montos primero (izquierda) */}
                      <Group gap="xs">
                        <Text fw={700} size="md" c="red" style={{ whiteSpace: 'nowrap' }}>
                          -{formatNumberToMonetary(transfer.amount)} {fromAccount?.currency || '?'}
                        </Text>
                        <Text size="xs" c="dimmed">→</Text>
                        <Text fw={700} size="md" c="teal" style={{ whiteSpace: 'nowrap' }}>
                          +{formatNumberToMonetary(transfer.convertedAmount)} {toAccount?.currency || '?'}
                        </Text>
                      </Group>

                      {/* Cuentas al final (derecha) */}
                      <Group gap="xs" align="center" wrap="nowrap" ml="auto">
                        {fromAccount ? (
                          <Group gap={4} align="center" wrap="nowrap">
                            <AccountIcon name={fromAccount.icon} size={18} />
                            <Text size="sm" fw={500}>{fromAccount.name}</Text>
                          </Group>
                        ) : (
                          <Badge color="red" size="sm">Deleted</Badge>
                        )}
                        
                        <IconArrowRight size={14} style={{ flexShrink: 0, color: 'var(--mantine-color-dimmed)' }} />
                        
                        {toAccount ? (
                          <Group gap={4} align="center" wrap="nowrap">
                            <AccountIcon name={toAccount.icon} size={18} />
                            <Text size="sm" fw={500}>{toAccount.name}</Text>
                          </Group>
                        ) : (
                          <Badge color="red" size="sm">Deleted</Badge>
                        )}
                      </Group>
                    </Group>

                    {/* Acciones */}
                    <Group gap={4} wrap="nowrap">
                      {showActions && (
                        <>
                          {onEdit && (
                            <Button
                              size="xs"
                              variant="subtle"
                              onClick={() => onEdit(transfer)}
                            >
                              Edit
                            </Button>
                          )}
                          {onDelete && transfer.id && (
                            <Button
                              size="xs"
                              variant="subtle"
                              color="red"
                              onClick={() => {
                                if (confirm('Delete this transfer?')) {
                                  onDelete(transfer.id!);
                                }
                              }}
                            >
                              Delete
                            </Button>
                          )}
                        </>
                      )}

                      {transfer.id && (
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          color="gray"
                          onClick={() => toggleExpanded(transfer.id!)}
                        >
                          {isExpanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                        </ActionIcon>
                      )}
                    </Group>
                  </Group>

                  {/* Detalles expandibles - siempre tiene exchange rate */}
                  <Collapse in={isExpanded}>
                    <Stack gap="xs" pt="xs" pl="md" style={{ borderTop: '1px solid #e9ecef' }}>
                      {transfer.description && (
                        <Text size="sm" c="dimmed" style={{ fontStyle: 'italic' }}>
                          {transfer.description}
                        </Text>
                      )}
                      <Text size="xs" c="dimmed">
                        Rate: 1 {fromAccount?.currency || '?'} = {formatNumberToMonetary(transfer.exchangeRate)} {toAccount?.currency || '?'}
                      </Text>
                    </Stack>
                  </Collapse>
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      ))}
    </Stack>
  );
};
