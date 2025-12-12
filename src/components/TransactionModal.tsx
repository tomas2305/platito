import { useEffect, useMemo, useState } from 'react';
import {
  ActionIcon,
  Button,
  Checkbox,
  Group,
  Modal,
  ScrollArea,
  SegmentedControl,
  Stack,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import styles from './TransactionModal.module.css';
import { AccountIcon } from './AccountIcon';
import { CategoryIcon } from './CategoryIcon';
import { CircularSelector } from './CircularSelector';
import type { Account, Category, Tag, Transaction, TransactionType } from '../types';
import { formatMonetaryValue, parseMonetaryValue } from '../utils/formatters';

interface FormState {
  id?: number;
  amount: string;
  accountId: string;
  categoryId: string;
  transactionType: TransactionType;
  tagIds: number[];
  description: string;
  date: Date | null;
}

interface Props {
  opened: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  accounts: Account[];
  categories: Category[];
  tags: Tag[];
  onSubmit: (data: Omit<Transaction, 'currency' | 'type'> & { id?: number }) => Promise<void>;
  onCreateTag: (name: string) => Promise<number>;
}

const todayISO = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const today = () => new Date();
const formatDateToISO = (date: Date | null) => {
  if (!date) return todayISO();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const parseISOToDate = (iso: string) => iso ? new Date(iso + 'T00:00:00') : new Date();

export const TransactionModal = ({
  opened,
  onClose,
  transaction,
  accounts,
  categories,
  tags,
  onSubmit,
  onCreateTag,
}: Props) => {
  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const initializeForm = (): FormState => {
    if (transaction) {
      const cat = categoryMap.get(transaction.categoryId);
      return {
        id: transaction.id,
        amount: formatMonetaryValue(String(transaction.amount)),
        accountId: String(transaction.accountId),
        categoryId: String(transaction.categoryId),
        transactionType: cat?.type ?? 'expense',
        tagIds: transaction.tagIds ?? [],
        description: transaction.description,
        date: parseISOToDate(transaction.date.slice(0, 10)),
      };
    }
    const firstExpenseCategory = categories.find(c => c.type === 'expense');
    return {
      amount: '',
      accountId: accounts[0] ? String(accounts[0].id) : '',
      categoryId: firstExpenseCategory ? String(firstExpenseCategory.id) : '',
      transactionType: 'expense',
      tagIds: [],
      description: '',
      date: today(),
    };
  };

  const [form, setForm] = useState<FormState>(() => initializeForm());
  const [error, setError] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [tagsModalOpened, setTagsModalOpened] = useState(false);

  // Reset form when transaction changes
  useEffect(() => {
    if (opened && transaction) {
      const cat = categoryMap.get(transaction.categoryId);
      setForm({
        id: transaction.id,
        amount: formatMonetaryValue(String(transaction.amount)),
        accountId: String(transaction.accountId),
        categoryId: String(transaction.categoryId),
        transactionType: cat?.type ?? 'expense',
        tagIds: transaction.tagIds ?? [],
        description: transaction.description,
        date: parseISOToDate(transaction.date.slice(0, 10)),
      });
    }
  }, [opened, transaction, categoryMap]);

  const top10Tags = useMemo(() => {
    return tags.slice(0, 10);
  }, [tags]);

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
      id: form.id,
      accountId: Number(form.accountId),
      categoryId: Number(form.categoryId),
      amount: amountValue,
      description: form.description.trim(),
      date: formatDateToISO(form.date),
      tagIds: form.tagIds,
    };

    try {
      await onSubmit(payload);
      
      // Always close modal and show success notification (only used for editing now)
      notifications.show({
        title: 'Success',
        message: 'Transaction updated successfully',
        color: 'green',
      });
      handleClose();
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

  const handleClose = () => {
    setForm(initializeForm());
    setError(null);
    setNewTagName('');
    onClose();
  };

  return (
    <>
      <Modal
        opened={opened}
        onClose={handleClose}
        title={transaction ? 'Edit Transaction' : 'Create Transaction'}
        size="xl"
        styles={{
          body: { minHeight: '500px', padding: '24px' },
          content: { maxWidth: '1400px' }
        }}
      >
        <ScrollArea.Autosize mah={500} className={styles.modalContent}>
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
              maxVisible={10}
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

            <Group gap="sm" mt="md">
              <Button type="submit">{transaction ? 'Update' : 'Create'}</Button>
              <Button type="button" variant="light" color="gray" onClick={handleClose}>
                Cancel
              </Button>
            </Group>
          </Stack>
        </form>
        </ScrollArea.Autosize>
      </Modal>

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
