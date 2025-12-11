import { useMemo, useState } from 'react';
import {
  Button,
  Card,
  Checkbox,
  Group,
  Modal,
  SegmentedControl,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { AccountIcon } from './AccountIcon';
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
}

const today = () => new Date();
const formatDateToISO = (date: Date | null) => date ? date.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);

export const TransactionForm = ({
  accounts,
  categories,
  tags,
  transactions,
  onSubmit,
  onCreateTag,
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

  const firstExpenseCategory = categories.find(c => c.type === 'expense');
  const [form, setForm] = useState<FormState>({
    amount: '',
    accountId: accounts[0] ? String(accounts[0].id) : '',
    categoryId: firstExpenseCategory ? String(firstExpenseCategory.id) : '',
    transactionType: 'expense',
    tagIds: [],
    description: '',
    date: today(),
  });

  const [error, setError] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [tagsModalOpened, setTagsModalOpened] = useState(false);

  const categoriesForType = useMemo(
    () => categories.filter((cat) => cat.type === form.transactionType),
    [categories, form.transactionType],
  );

  const handleTypeChange = (type: TransactionType) => {
    const options = categories.filter((c) => c.type === type);
    setForm((prev) => {
      const keepCurrent = options.some((c) => String(c.id) === prev.categoryId);
      const firstCategoryId = keepCurrent ? prev.categoryId : String(options[0]?.id ?? '');
      return {
        ...prev,
        transactionType: type,
        categoryId: firstCategoryId,
      };
    });
  };

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
      
      notifications.show({
        title: 'Success',
        message: 'Transaction created successfully',
        color: 'green',
      });

      setForm({
        amount: '',
        accountId: form.accountId,
        categoryId: form.categoryId,
        transactionType: form.transactionType,
        tagIds: form.tagIds,
        description: '',
        date: today(),
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

                <SegmentedControl
                  value={form.transactionType}
                  onChange={(value) => handleTypeChange(value as TransactionType)}
                  data={[
                    { label: 'Expense', value: 'expense' },
                    { label: 'Income', value: 'income' },
                  ]}
                />

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
              </Group>

              <CircularSelector
                label="Account"
                items={accounts.map((acc) => ({
                  id: acc.id!,
                  name: acc.name,
                  color: acc.color,
                  icon: <AccountIcon name={acc.icon} size={28} />,
                }))}
                selectedId={form.accountId ? Number(form.accountId) : null}
                onSelect={(id) => setForm((prev) => ({ ...prev, accountId: String(id) }))}
                style={{ marginTop: 12 }}
              />

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
                maxVisible={15}
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

              <Group align="flex-end" gap="sm">
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
