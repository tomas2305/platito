import { useEffect, useMemo, useState } from 'react';
import { TransactionList } from '../components/TransactionList';
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
  accountId: number | '';
  categoryId: number | '';
  transactionType: TransactionType;
  tagIds: number[];
  description: string;
  date: string; // yyyy-mm-dd
}

const todayISO = () => new Date().toISOString().slice(0, 10);

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
    date: todayISO(),
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [newTagName, setNewTagName] = useState('');

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

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
      setForm((prev) => ({ ...prev, accountId: acct[0].id ?? '' }));
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
      date: form.date,
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
        accountId,
        categoryId,
        transactionType: selectedCategory.type,
        tagIds,
        description: '',
        date,
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
      accountId: tx.accountId,
      categoryId: tx.categoryId,
      transactionType: cat?.type ?? 'expense',
      tagIds: tx.tagIds ?? [],
      description: tx.description,
      date: tx.date.slice(0, 10),
    });
    setError(null);
  };

  const handleDelete = async (id: number) => {
    const confirmed = confirm('Delete this transaction?');
    if (!confirmed) return;
    await deleteTransaction(id);
    await loadData();
  };

  const toggleTag = (tagId: number) => {
    setForm((prev) => {
      const exists = prev.tagIds.includes(tagId);
      return {
        ...prev,
        tagIds: exists ? prev.tagIds.filter((id) => id !== tagId) : [...prev.tagIds, tagId],
      };
    });
  };

  const categoriesForType = useMemo(
    () => categories.filter((cat) => cat.type === form.transactionType),
    [categories, form.transactionType],
  );

  const handleTypeChange = (type: TransactionType) => {
    const options = categories.filter((c) => c.type === type);
    setForm((prev) => {
      const keepCurrent = options.some((c) => c.id === prev.categoryId);
      const firstCategoryId = keepCurrent ? prev.categoryId : options[0]?.id ?? '';
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

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Transactions</h1>

      <section style={{ marginTop: '16px', marginBottom: '16px' }}>
        <h2>{form.id ? 'Edit Transaction' : 'Create Transaction'}</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <input
            type="text"
            inputMode="decimal"
            placeholder="Amount"
            value={form.amount}
            onChange={(e) => setForm((prev) => ({ ...prev, amount: formatMonetaryValue(e.target.value) }))}
            required
          />
          <select
            value={form.transactionType}
            onChange={(e) => handleTypeChange(e.target.value as TransactionType)}
            required
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
          <select
            value={form.accountId}
            onChange={(e) => setForm((prev) => ({ ...prev, accountId: Number(e.target.value) }))}
            required
          >
            <option value="" disabled>Select account</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} ({acc.currency})
              </option>
            ))}
          </select>
          <select
            value={form.categoryId}
            onChange={(e) => setForm((prev) => ({ ...prev, categoryId: Number(e.target.value) }))}
            required
          >
            <option value="" disabled>Select category</option>
            {categoriesForType.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
            required
          />
          <input
            type="text"
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {tags.map((tag) => (
              <label key={tag.id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input
                  type="checkbox"
                  checked={form.tagIds.includes(tag.id!)}
                  onChange={() => toggleTag(tag.id!)}
                />
                {tag.name}
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="New tag"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
            />
            <button type="button" onClick={handleQuickAddTag}>Add tag</button>
          </div>
          <button type="submit">{form.id ? 'Update' : 'Create'}</button>
          {form.id && (
            <button type="button" onClick={() => setForm({
              amount: '',
              accountId: form.accountId,
              categoryId: form.categoryId,
              transactionType: form.transactionType,
              tagIds: form.tagIds,
              description: '',
              date: form.date,
            })}>
              Cancel edit
            </button>
          )}
        </form>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </section>

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
    </div>
  );
};
