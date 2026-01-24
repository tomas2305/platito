import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActionIcon,
  Button,
  Card,
  Checkbox,
  Group,
  Modal,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { CategoryIcon } from './CategoryIcon';
import { CircularSelector } from './CircularSelector';
import type { Account, Category, Tag, Transaction, TransactionType } from '../types';
import { formatMonetaryValue, parseMonetaryValue } from '../utils/formatters';

interface FormState {
  amount: string;
  accountId: string;
  categoryId: string;
  transactionType: TransactionType;
  tagIds: number[];
  description: string;
  date: Date | null;
}

interface Props {
  accounts: Account[];
  categories: Category[];
  tags: Tag[];
  transactions: Transaction[];
  onSubmit: (data: Omit<Transaction, 'currency' | 'type' | 'id'>) => Promise<void>;
  onCreateTag: (name: string) => Promise<number>;
  preselectedAccountId: number | null;
  preselectedType: TransactionType;
}

const LAST_DATE_KEY = 'platito_last_transaction_date';

const today = () => new Date();

const getLastUsedDate = (): Date => {
  try {
    const stored = localStorage.getItem(LAST_DATE_KEY);
    if (stored) {
      const date = new Date(stored + 'T00:00:00');
      if (!Number.isNaN(date.getTime())) {
        return date;
      }
    }
  } catch {
    // Ignore localStorage errors
  }
  return today();
};

const saveLastUsedDate = (date: Date | null) => {
  try {
    if (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      localStorage.setItem(LAST_DATE_KEY, `${year}-${month}-${day}`);
    }
  } catch {
    // Ignore localStorage errors
  }
};

const formatDateToISO = (date: Date | null) => {
  const d = date ?? new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const TransactionForm = ({
  accounts,
  categories,
  tags,
  transactions,
  onSubmit,
  onCreateTag,
  preselectedAccountId,
  preselectedType,
}: Props) => {
  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const top10Tags = useMemo(() => {
    const tagCounts = new Map<number, number>();
    for (const tx of transactions) {
      for (const tagId of tx.tagIds || []) {
        tagCounts.set(tagId, (tagCounts.get(tagId) || 0) + 1);
      }
    }
    return tags
      .map((tag) => ({ tag, count: tagCounts.get(tag.id!) || 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(({ tag }) => tag);
  }, [tags, transactions]);

  const firstExpenseCategory = categories.find(c => c.type === preselectedType);
  
  const fallbackAccountId = accounts[0] ? String(accounts[0].id) : '';
  const defaultAccountId = preselectedAccountId ? String(preselectedAccountId) : fallbackAccountId;
  
  const [form, setForm] = useState<FormState>({
    amount: '',
    accountId: defaultAccountId,
    categoryId: firstExpenseCategory ? String(firstExpenseCategory.id) : '',
    transactionType: preselectedType,
    tagIds: [],
    description: '',
    date: getLastUsedDate(),
  });

  const [error, setError] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [tagsModalOpened, setTagsModalOpened] = useState(false);

  // Track previous preselected values to avoid unnecessary updates
  const prevPreselectedRef = useRef({ accountId: preselectedAccountId, type: preselectedType });

  // Sync form with preselected values
  useEffect(() => {
    const prev = prevPreselectedRef.current;
    const hasChanged = 
      prev.accountId !== preselectedAccountId || 
      prev.type !== preselectedType;
    
    if (!hasChanged) return;
    
    prevPreselectedRef.current = { accountId: preselectedAccountId, type: preselectedType };
    
      // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm((current) => {
      const needsUpdate = 
        (preselectedAccountId && String(preselectedAccountId) !== current.accountId) ||
        (preselectedType !== current.transactionType);
      
      if (!needsUpdate) return current;
      
      const newAccountId = preselectedAccountId ? String(preselectedAccountId) : current.accountId;
      const categoriesForNewType = categories.filter(c => c.type === preselectedType);
      const keepCurrentCategory = categoriesForNewType.some(c => String(c.id) === current.categoryId);
      const newCategoryId = keepCurrentCategory ? current.categoryId : String(categoriesForNewType[0]?.id ?? '');
      
      return {
        ...current,
        accountId: newAccountId,
        transactionType: preselectedType,
        categoryId: newCategoryId,
      };
    });
  }, [preselectedAccountId, preselectedType, categories]);

  const categoriesForType = useMemo(() => {
    const filtered = categories.filter((cat) => cat.type === form.transactionType);
    
    // Get the last 10 transactions of the current type
    const recentTransactions = transactions
      .filter((tx) => tx.type === form.transactionType)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 10);
    
    // Create an order map based on last usage
    const lastUsedOrder = new Map<number, number>();
    recentTransactions.forEach((tx, index) => {
      if (!lastUsedOrder.has(tx.categoryId)) {
        lastUsedOrder.set(tx.categoryId, index);
      }
    });
    
    // Sort: recently used first, then alphabetically
    return filtered.sort((a, b) => {
      const aOrder = lastUsedOrder.get(a.id!);
      const bOrder = lastUsedOrder.get(b.id!);
      
      // If both are in recent history
      if (aOrder !== undefined && bOrder !== undefined) {
        return aOrder - bOrder;
      }
      // If only 'a' is in history
      if (aOrder !== undefined) return -1;
      // If only 'b' is in history
      if (bOrder !== undefined) return 1;
      // If neither is in history, sort alphabetically
      return a.name.localeCompare(b.name);
    });
  }, [categories, form.transactionType, transactions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.accountId || !form.categoryId) {
      setError('Account and category are required');
      return;
    }

    const selectedCategory = categoryMap.get(Number(form.categoryId));
    if (!selectedCategory || selectedCategory.type !== form.transactionType) {
      setError('Category must match the selected type');
      return;
    }

    const amountValue = parseMonetaryValue(form.amount);
    if (amountValue <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    const payload = {
      accountId: Number(form.accountId),
      categoryId: Number(form.categoryId),
      amount: amountValue,
      description: form.description.trim(),
      date: formatDateToISO(form.date),
      tagIds: form.tagIds,
    };

    try {
      await onSubmit(payload);
      
      // Save the used date
      saveLastUsedDate(form.date);
      
      const selectedAccount = accounts.find(acc => acc.id === Number(form.accountId));
      const formattedAmount = formatMonetaryValue(String(amountValue));
      const formattedDate = form.date?.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }) || '';
      
      notifications.show({
        title: '✓ Transaction created',
        message: (
          <Text size="sm">
            <Text component="span" fw={700}>{formattedAmount} {selectedAccount?.currency || ''}</Text>
            {' · '}
            <Text component="span" fw={700}>{selectedCategory.name}</Text>
            {' · '}
            <Text component="span" fw={700}>{formattedDate}</Text>
          </Text>
        ),
        color: 'green',
        autoClose: 4000,
      });

      setForm({
        amount: '',
        accountId: form.accountId,
        categoryId: form.categoryId,
        transactionType: form.transactionType,
        tagIds: form.tagIds,
        description: '',
        date: form.date, // Keep the same date
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving transaction');
      notifications.show({
        title: 'Error',
        message: err instanceof Error ? err.message : 'Error saving transaction',
        color: 'red',
      });
    }
  };

  const handleQuickAddTag = async () => {
    const trimmed = newTagName.trim();
    if (!trimmed) return;
    try {
      const id = await onCreateTag(trimmed);
      setForm((prev) => ({ ...prev, tagIds: [...prev.tagIds, id] }));
      setNewTagName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating tag');
    }
  };

  const toggleTag = (tagId: number) => {
    setForm((prev) => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter((id) => id !== tagId)
        : [...prev.tagIds, tagId],
    }));
  };

  return (
    <>
      <Card shadow="sm" radius="md" padding="lg" withBorder>
        <Stack gap="md">
          <Title order={3}>Create Transaction</Title>

          <form onSubmit={handleSubmit}>
            <Stack gap="sm">
              <Group align="flex-end" gap="sm" wrap="wrap">
                <TextInput
                  label="Amount"
                  type="text"
                  inputMode="decimal"
                  placeholder="Amount"
                  value={form.amount}
                  onChange={(e) => setForm((prev) => ({ ...prev, amount: formatMonetaryValue(e.target.value) }))}
                  required
                  style={{ minWidth: 160 }}
                />

                <Group gap="xs" align="flex-end">
                  <DateInput
                    label="Date"
                    placeholder="Select date"
                    value={form.date}
                    onChange={(value) => {
                      let dateObj: Date | null = null;
                      if (value === null) {
                        dateObj = null;
                      } else if (typeof value === 'string') {
                        dateObj = new Date(value + 'T00:00:00');
                      } else {
                        dateObj = value as Date;
                      }
                      setForm((prev) => ({ ...prev, date: dateObj }));
                    }}
                    maxDate={today()}
                    required
                    clearable
                  />
                  <ActionIcon
                    variant="default"
                    size="lg"
                    onClick={() => {
                      if (form.date) {
                        const newDate = new Date(form.date);
                        newDate.setDate(newDate.getDate() - 1);
                        setForm((prev) => ({ ...prev, date: newDate }));
                      }
                    }}
                    disabled={!form.date}
                  >
                    <IconChevronLeft size={18} />
                  </ActionIcon>
                  <ActionIcon
                    variant="default"
                    size="lg"
                    onClick={() => {
                      if (form.date) {
                        const newDate = new Date(form.date);
                        newDate.setDate(newDate.getDate() + 1);
                        const maxDate = today();
                        if (newDate <= maxDate) {
                          setForm((prev) => ({ ...prev, date: newDate }));
                        }
                      }
                    }}
                    disabled={!form.date || (form.date && form.date >= today())}
                  >
                    <IconChevronRight size={18} />
                  </ActionIcon>
                </Group>
              </Group>

              <CircularSelector
                label="Category"
                items={categoriesForType.map((cat) => ({
                  id: cat.id!,
                  name: cat.name,
                  color: cat.color,
                  icon: <CategoryIcon name={cat.icon} size={28} />,
                }))}
                selectedId={form.categoryId ? Number(form.categoryId) : null}
                onSelect={(id) => setForm((prev) => ({ ...prev, categoryId: String(id) }))}
                maxVisible={7}
              />

              <Textarea
                label="Description"
                placeholder="Optional description"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                minRows={2}
                autosize
              />

              <Stack gap="xs">
                <Group justify="space-between" align="center">
                  <Text size="sm" fw={500}>Tags</Text>
                  <Button
                    size="xs"
                    variant="light"
                    onClick={() => setTagsModalOpened(true)}
                  >
                    View all tags
                  </Button>
                </Group>
                {top10Tags.length > 0 ? (
                  <Group gap="sm" wrap="wrap">
                    {top10Tags.map((tag) => (
                      <Checkbox
                        key={tag.id}
                        label={tag.name}
                        checked={form.tagIds.includes(tag.id!)}
                        onChange={() => toggleTag(tag.id!)}
                      />
                    ))}
                  </Group>
                ) : (
                  <Text size="sm" c="dimmed">No tags available</Text>
                )}
              </Stack>

              <Group align="flex-end" gap="sm" mt={7}>
                <TextInput
                  label="Quick add tag"
                  placeholder="New tag"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  style={{ minWidth: 200 }}
                />
                <Button type="button" variant="light" onClick={handleQuickAddTag}>Add tag</Button>
              </Group>

              {error && <Text c="red" size="sm">{error}</Text>}

              <Group gap="sm">
                <Button type="submit">Create</Button>
              </Group>
            </Stack>
          </form>
        </Stack>
      </Card>

      <Modal
        opened={tagsModalOpened}
        onClose={() => setTagsModalOpened(false)}
        title="All Tags"
        size="md"
      >
        <Stack gap="xs">
          {tags.length === 0 ? (
            <Text c="dimmed">No tags available</Text>
          ) : (
            tags.map((tag) => (
              <Checkbox
                key={tag.id}
                label={tag.name}
                checked={form.tagIds.includes(tag.id!)}
                onChange={() => toggleTag(tag.id!)}
              />
            ))
          )}
        </Stack>
      </Modal>
    </>
  );
};
