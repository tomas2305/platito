import { useState, useEffect, useCallback } from 'react';
import {
  Title,
  Text,
  Textarea,
  Button,
  Stack,
  Group,
  Paper,
  List,
  ThemeIcon,
  Badge,
  Divider,
  Box,
  Center,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAlertTriangle, IconX, IconCopy, IconUpload, IconWallet } from '@tabler/icons-react';
import { getAllAccounts } from '../stores/accountsStore';
import { getAllCategories } from '../stores/categoriesStore';
import { getAllTags } from '../stores/tagsStore';
import { getAllTransactions } from '../stores/transactionsStore';
import { getDB } from '../db';
import type { Account, Category, Tag, Transaction } from '../types';
import promptTemplate from '../prompts/bulk-import.md?raw';

interface BulkTransaction {
  accountId: number;
  categoryId: number;
  type: 'expense' | 'income';
  amount: number;
  currency: string;
  date: string;
  description: string;
  tagIds?: number[];
}

interface BulkTransfer {
  fromAccountId: number;
  toAccountId: number;
  amount: number;
  convertedAmount: number;
  exchangeRate: number;
  date: string;
  description?: string;
}

interface BulkPayload {
  transactions?: BulkTransaction[];
  transfers?: BulkTransfer[];
}

interface ValidationResult {
  ok: boolean;
  transactions: number;
  transfers: number;
  affectedAccountIds: number[];
  errors: string[];
  warnings: string[];
  parsed: BulkPayload | null;
}

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const VALID_CURRENCIES = ['ARS', 'USD_BLUE', 'USD_MEP', 'USDT'];
const VALID_TYPES = ['expense', 'income'];

function validatePayload(
  input: string,
  accounts: Account[],
  categories: Category[],
  tags: Tag[],
  existingTransactions: Transaction[],
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  let parsed: BulkPayload;
  try {
    parsed = JSON.parse(input);
  } catch {
    return { ok: false, transactions: 0, transfers: 0, affectedAccountIds: [], errors: ['Invalid JSON'], warnings: [], parsed: null };
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { ok: false, transactions: 0, transfers: 0, affectedAccountIds: [], errors: ['JSON must be an object'], warnings: [], parsed: null };
  }

  if (!parsed.transactions && !parsed.transfers) {
    return {
      ok: false,
      transactions: 0,
      transfers: 0,
      affectedAccountIds: [],
      errors: ['JSON must have at least "transactions" or "transfers"'],
      warnings: [],
      parsed: null,
    };
  }

  const accountMap = new Map(accounts.map(a => [a.id!, a]));
  const categoryMap = new Map(categories.map(c => [c.id!, c]));
  const tagIds = new Set(tags.map(t => t.id!));
  const affectedAccountIds = new Set<number>();

  // Validate transactions
  const txs = parsed.transactions ?? [];
  if (!Array.isArray(txs)) {
    errors.push('"transactions" must be an array');
  } else {
    txs.forEach((t, i) => {
      const prefix = `transactions[${i}]`;

      if (!accountMap.has(t.accountId)) {
        errors.push(`${prefix}: accountId ${t.accountId} does not exist`);
      } else {
        affectedAccountIds.add(t.accountId);
      }

      const cat = categoryMap.get(t.categoryId);
      if (!cat) {
        errors.push(`${prefix}: categoryId ${t.categoryId} does not exist`);
      } else if (cat.type !== t.type) {
        errors.push(`${prefix}: type "${t.type}" does not match category "${cat.name}" (${cat.type})`);
      }

      if (!VALID_TYPES.includes(t.type)) {
        errors.push(`${prefix}: type "${t.type}" is invalid (must be "expense" or "income")`);
      }

      if (!VALID_CURRENCIES.includes(t.currency)) {
        errors.push(`${prefix}: currency "${t.currency}" is invalid`);
      } else {
        const account = accountMap.get(t.accountId);
        if (account && account.currency !== t.currency) {
          errors.push(`${prefix}: currency "${t.currency}" does not match account "${account.name}" (${account.currency})`);
        }
      }

      if (typeof t.amount !== 'number' || t.amount <= 0) {
        errors.push(`${prefix}: amount must be a positive number`);
      }

      if (!DATE_REGEX.test(t.date)) {
        errors.push(`${prefix}: date "${t.date}" is invalid (use YYYY-MM-DD)`);
      }

      if (t.tagIds && Array.isArray(t.tagIds)) {
        t.tagIds.forEach(tid => {
          if (!tagIds.has(tid)) {
            errors.push(`${prefix}: tagId ${tid} does not exist`);
          }
        });
      }

      const isDuplicate = existingTransactions.some(
        existing =>
          existing.accountId === t.accountId &&
          existing.amount === t.amount &&
          existing.date === t.date,
      );
      if (isDuplicate) {
        warnings.push(`${prefix}: possible duplicate (same date, amount and account)`);
      }
    });
  }

  // Validate transfers
  const transfers = parsed.transfers ?? [];
  if (!Array.isArray(transfers)) {
    errors.push('"transfers" must be an array');
  } else {
    transfers.forEach((t, i) => {
      const prefix = `transfers[${i}]`;

      if (!accountMap.has(t.fromAccountId)) {
        errors.push(`${prefix}: fromAccountId ${t.fromAccountId} does not exist`);
      } else {
        affectedAccountIds.add(t.fromAccountId);
      }

      if (!accountMap.has(t.toAccountId)) {
        errors.push(`${prefix}: toAccountId ${t.toAccountId} does not exist`);
      } else {
        affectedAccountIds.add(t.toAccountId);
      }

      if (t.fromAccountId === t.toAccountId) {
        errors.push(`${prefix}: fromAccountId and toAccountId cannot be the same`);
      }

      if (typeof t.amount !== 'number' || t.amount <= 0) {
        errors.push(`${prefix}: amount must be a positive number`);
      }
      if (typeof t.convertedAmount !== 'number' || t.convertedAmount <= 0) {
        errors.push(`${prefix}: convertedAmount must be a positive number`);
      }
      if (typeof t.exchangeRate !== 'number' || t.exchangeRate <= 0) {
        errors.push(`${prefix}: exchangeRate must be a positive number`);
      }

      if (!DATE_REGEX.test(t.date)) {
        errors.push(`${prefix}: date "${t.date}" is invalid (use YYYY-MM-DD)`);
      }
    });
  }

  return {
    ok: errors.length === 0,
    transactions: Array.isArray(txs) ? txs.length : 0,
    transfers: Array.isArray(transfers) ? transfers.length : 0,
    affectedAccountIds: [...affectedAccountIds],
    errors,
    warnings,
    parsed: errors.length === 0 ? parsed : null,
  };
}

export function BulkImportPage() {
  const [jsonInput, setJsonInput] = useState('');
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [existingTransactions, setExistingTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    Promise.all([getAllAccounts(), getAllCategories(), getAllTags(), getAllTransactions()]).then(
      ([accs, cats, tgs, txs]) => {
        setAccounts(accs);
        setCategories(cats);
        setTags(tgs);
        setExistingTransactions(txs);
      },
    );
  }, []);

  const handleJsonChange = useCallback(
    (value: string) => {
      setJsonInput(value);
      if (!value.trim()) {
        setValidation(null);
        return;
      }
      setValidation(validatePayload(value, accounts, categories, tags, existingTransactions));
    },
    [accounts, categories, tags, existingTransactions],
  );

  const generatePrompt = () => {
    const accountsContext = accounts
      .filter(a => !a.isArchived)
      .map(a => `- ID ${a.id}: "${a.name}" (${a.currency})`)
      .join('\n');

    const categoriesContext = categories
      .map(c => `- ID ${c.id}: "${c.name}" (type: ${c.type})`)
      .join('\n');

    const tagsContext = tags.length
      ? tags.map(t => `- ID ${t.id}: "${t.name}"`).join('\n')
      : '(no tags)';

    return promptTemplate
      .replace('{{ACCOUNTS}}', accountsContext)
      .replace('{{CATEGORIES}}', categoriesContext)
      .replace('{{TAGS}}', tagsContext);
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(generatePrompt());
      notifications.show({
        title: 'Prompt copied',
        message: 'Paste it into Claude or any agent you use',
        color: 'blue',
        autoClose: 3000,
      });
    } catch {
      notifications.show({ title: 'Error', message: 'Could not copy to clipboard', color: 'red' });
    }
  };

  const handleImport = async () => {
    if (!validation?.parsed) return;
    setImporting(true);
    try {
      const db = getDB();
      const { transactions = [], transfers = [] } = validation.parsed;
      const now = new Date().toISOString();

      await db.transaction('rw', [db.transactions, db.transfers], async () => {
        if (transactions.length) {
          await db.transactions.bulkAdd(
            transactions.map(t => ({ ...t, tagIds: t.tagIds ?? [] })),
          );
        }
        if (transfers.length) {
          await db.transfers.bulkAdd(
            transfers.map(t => ({ ...t, createdAt: now, updatedAt: now })),
          );
        }
      });

      notifications.show({
        title: 'Import successful',
        message: `${transactions.length} transactions and ${transfers.length} transfers added`,
        color: 'green',
        autoClose: 5000,
      });

      setJsonInput('');
      setValidation(null);
      getAllTransactions().then(setExistingTransactions);
    } catch (err) {
      notifications.show({
        title: 'Import failed',
        message: err instanceof Error ? err.message : 'Unknown error',
        color: 'red',
      });
    } finally {
      setImporting(false);
    }
  };

  const accountMap = new Map(accounts.map(a => [a.id!, a]));

  return (
    <Center p="xl">
      <Box w="100%" maw={680}>
        <Stack gap="xl">
          <Stack gap={4} align="center">
            <Title order={2}>Bulk Import</Title>
            <Text c="dimmed" size="sm" ta="center">
              Use an AI agent to generate the JSON, then paste it here to import transactions and transfers.
            </Text>
          </Stack>

          <Stack gap="xs">
            <Group justify="space-between" align="center" wrap="nowrap">
              <Text fw={500}>Step 1 — Copy the prompt</Text>
              <Button
                leftSection={<IconCopy size={16} />}
                variant="light"
                size="sm"
                onClick={handleCopyPrompt}
                disabled={accounts.length === 0}
                style={{ flexShrink: 0 }}
              >
                Copy prompt
              </Button>
            </Group>
            <Text size="sm" c="dimmed">
              The prompt includes your current accounts, categories and tags so the agent uses the correct IDs.
            </Text>
          </Stack>

          <Stack gap="xs">
            <Text fw={500}>Step 2 — Paste the JSON</Text>
            <Textarea
              placeholder={`{\n  "transactions": [...],\n  "transfers": [...]\n}`}
              value={jsonInput}
              onChange={e => handleJsonChange(e.currentTarget.value)}
              minRows={8}
              autosize
              maxRows={20}
              styles={{ input: { fontFamily: 'monospace', fontSize: 13 } }}
            />
          </Stack>

          {validation && (
            <Paper withBorder p="md" radius="md">
              <Stack gap="sm">
                <Group gap="xs">
                  <Badge variant="light" color="blue">
                    {validation.transactions} transaction{validation.transactions !== 1 ? 's' : ''}
                  </Badge>
                  <Badge variant="light" color="violet">
                    {validation.transfers} transfer{validation.transfers !== 1 ? 's' : ''}
                  </Badge>
                  {validation.ok ? (
                    <Badge variant="light" color="green">
                      No errors
                    </Badge>
                  ) : (
                    <Badge variant="light" color="red">
                      {validation.errors.length} error{validation.errors.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                  {validation.warnings.length > 0 && (
                    <Badge variant="light" color="yellow">
                      {validation.warnings.length} warning{validation.warnings.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </Group>

                {validation.affectedAccountIds.length > 0 && (
                  <>
                    <Divider />
                    <Stack gap={6}>
                      <Group gap={6}>
                        <IconWallet size={14} color="gray" />
                        <Text size="sm" c="dimmed" fw={500}>
                          Affected accounts
                        </Text>
                      </Group>
                      <Group gap="xs">
                        {validation.affectedAccountIds.map(id => {
                          const account = accountMap.get(id);
                          return account ? (
                            <Badge key={id} variant="outline" color="gray" size="sm">
                              {account.name} · {account.currency}
                            </Badge>
                          ) : null;
                        })}
                      </Group>
                    </Stack>
                  </>
                )}

                {validation.errors.length > 0 && (
                  <>
                    <Divider />
                    <List
                      spacing="xs"
                      size="sm"
                      icon={
                        <ThemeIcon color="red" size={18} radius="xl">
                          <IconX size={12} />
                        </ThemeIcon>
                      }
                    >
                      {validation.errors.map((e, i) => (
                        <List.Item key={i}>{e}</List.Item>
                      ))}
                    </List>
                  </>
                )}

                {validation.warnings.length > 0 && (
                  <>
                    <Divider />
                    <List
                      spacing="xs"
                      size="sm"
                      icon={
                        <ThemeIcon color="yellow" size={18} radius="xl">
                          <IconAlertTriangle size={12} />
                        </ThemeIcon>
                      }
                    >
                      {validation.warnings.map((w, i) => (
                        <List.Item key={i}>{w}</List.Item>
                      ))}
                    </List>
                  </>
                )}

                {validation.ok && (
                  <Group justify="flex-end" mt="xs">
                    <Button
                      leftSection={<IconUpload size={16} />}
                      onClick={handleImport}
                      loading={importing}
                      color={validation.warnings.length > 0 ? 'yellow' : 'green'}
                    >
                      Import{validation.warnings.length > 0 ? ' anyway' : ''}
                    </Button>
                  </Group>
                )}
              </Stack>
            </Paper>
          )}
        </Stack>
      </Box>
    </Center>
  );
}
