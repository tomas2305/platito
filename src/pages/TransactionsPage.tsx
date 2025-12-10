import { useEffect, useMemo, useState } from 'react';
import {
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
  SegmentedControl,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { TransactionList } from '../components/TransactionList';
import { AccountIcon } from '../components/AccountIcon';
import { CategoryIcon } from '../components/CategoryIcon';
import { CircularSelector } from '../components/CircularSelector';
import type { Account, Category, Tag, Transaction, TransactionType } from '../types';
import { getActiveAccounts } from '../stores/accountsStore';
import { getAllCategories } from '../stores/categoriesStore';
import { createTag, getAllTags } from '../stores/tagsStore';
import {
  createTransaction,
  deleteTransaction,
  getAllTransactions,
  updateTransaction,
} from '../stores/transactionsStore';
import { formatMonetaryValue, parseMonetaryValue } from '../utils/formatters';

interface FormState {
  id?: number;
  amount: string;
  accountId: string;
  categoryId: string;
  transactionType: TransactionType;
  tagIds: number[];
  description: string;
  date: Date | null; // Date object for DateInput
}

const todayISO = () => new Date().toISOString().slice(0, 10);
const today = () => new Date();
const formatDateToISO = (date: Date | null) => date ? date.toISOString().slice(0, 10) : todayISO();
const parseISOToDate = (iso: string) => iso ? new Date(iso + 'T00:00:00') : new Date();

export const TransactionsPage = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [form, setForm] = useState<FormState>({
    amount: '',
    accountId: '',
    categoryId: '',
    transactionType: 'expense',
    tagIds: [],
    description: '',
    date: today(),
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [newTagName, setNewTagName] = useState('');
  const [tagsModalOpened, setTagsModalOpened] = useState(false);

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

  const loadData = async () => {
    const [acct, cats, tgs, txs] = await Promise.all([
      getActiveAccounts(),
      getAllCategories(),
      getAllTags(),
      getAllTransactions(),
    ]);
    setAccounts(acct);
    setCategories(cats);
    setTags(tgs);
    setTransactions(txs);
    setLoading(false);

    if (!form.accountId && acct.length > 0) {
      setForm((prev) => ({ ...prev, accountId: String(acct[0].id ?? '') }));
    }
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      if (form.id) {
        await updateTransaction(form.id, payload);
      } else {
        await createTransaction(payload);
      }
      const { accountId, categoryId, tagIds, date } = payload;
      setForm({
        amount: '',
        accountId: String(accountId),
        categoryId: String(categoryId),
        transactionType: selectedCategory.type,
        tagIds,
        description: '',
        date: parseISOToDate(date),
      });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving transaction');
    }
  };

  const handleEdit = (tx: Transaction) => {
    const cat = categoryMap.get(tx.categoryId);
    setForm({
      id: tx.id,
      amount: formatMonetaryValue(String(tx.amount)),
      accountId: String(tx.accountId),
      categoryId: String(tx.categoryId),
      transactionType: cat?.type ?? 'expense',
      tagIds: tx.tagIds ?? [],
      description: tx.description,
      date: parseISOToDate(tx.date.slice(0, 10)),
    });
    setError(null);
  };

  const handleDelete = async (id: number) => {
    const confirmed = confirm('Delete this transaction?');
    if (!confirmed) return;
    await deleteTransaction(id);
    await loadData();
  };

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

  const handleQuickAddTag = async () => {
    const trimmed = newTagName.trim();
    if (!trimmed) return;
    try {
      const id = await createTag({ name: trimmed });
      const updated = await getAllTags();
      setTags(updated);
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

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Stack gap="lg">
      <Card shadow="sm" radius="md" padding="lg" withBorder>
        <Stack gap="md">
          <Group justify="space-between" align="center">
            <Title order={3}>{form.id ? 'Edit Transaction' : 'Create Transaction'}</Title>
            {form.id && (
              <Button
                variant="subtle"
                color="gray"
                onClick={() => setForm({
                  amount: '',
                  accountId: form.accountId,
                  categoryId: form.categoryId,
                  transactionType: form.transactionType,
                  tagIds: form.tagIds,
                  description: '',
                  date: form.date,
                })}
              >
                Cancel edit
              </Button>
            )}
          </Group>

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

              <Group gap="sm">
                <Button type="submit">{form.id ? 'Update' : 'Create'}</Button>
                {form.id && (
                  <Button
                    type="button"
                    variant="light"
                    color="gray"
                    onClick={() => setForm({
                      amount: '',
                      accountId: form.accountId,
                      categoryId: form.categoryId,
                      transactionType: form.transactionType,
                      tagIds: form.tagIds,
                      description: '',
                      date: form.date,
                    })}
                  >
                    Cancel edit
                  </Button>
                )}
              </Group>

              {error && <Text c="red" size="sm">{error}</Text>}
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

      <TransactionList
        title="All Transactions"
        transactions={transactions}
        accounts={accounts}
        categories={categories}
        tags={tags}
        onEdit={handleEdit}
        onDelete={handleDelete}
        showActions
      />
    </Stack>
  );
};
