import { useEffect, useState } from 'react';
import {
  Stack,
} from '@mantine/core';
import { TransactionList } from '../components/TransactionList';
import { TransactionModal } from '../components/TransactionModal';
import { TransactionForm } from '../components/TransactionForm';
import type { Account, Category, Tag, Transaction } from '../types';
import { getActiveAccounts } from '../stores/accountsStore';
import { getAllCategories } from '../stores/categoriesStore';
import { createTag, getAllTags } from '../stores/tagsStore';
import {
  createTransaction,
  deleteTransaction,
  getAllTransactions,
  updateTransaction,
} from '../stores/transactionsStore';

export const TransactionsPage = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpened, setModalOpened] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

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
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleSubmit = async (data: Omit<Transaction, 'currency' | 'type'> & { id?: number }) => {
    await updateTransaction(data.id!, {
      accountId: data.accountId,
      categoryId: data.categoryId,
      amount: data.amount,
      description: data.description,
      date: data.date,
      tagIds: data.tagIds,
    });
    await loadData();
  };

  const handleCreate = async (data: Omit<Transaction, 'currency' | 'type' | 'id'>) => {
    await createTransaction({
      accountId: data.accountId,
      categoryId: data.categoryId,
      amount: data.amount,
      description: data.description,
      date: data.date,
      tagIds: data.tagIds,
    });
    await loadData();
  };

  const handleEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    setModalOpened(true);
  };

  const handleDelete = async (id: number) => {
    const confirmed = confirm('Delete this transaction?');
    if (!confirmed) return;
    await deleteTransaction(id);
    await loadData();
  };

  const handleCreateTag = async (name: string) => {
    const id = await createTag({ name });
    await loadData();
    return id;
  };

  const handleCloseModal = () => {
    setModalOpened(false);
    setEditingTransaction(null);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Stack gap="lg">
      <TransactionForm
        accounts={accounts}
        categories={categories}
        tags={tags}
        transactions={transactions}
        onSubmit={handleCreate}
        onCreateTag={handleCreateTag}
      />

      <TransactionModal
        opened={modalOpened}
        onClose={handleCloseModal}
        transaction={editingTransaction}
        accounts={accounts}
        categories={categories}
        tags={tags}
        onSubmit={handleSubmit}
        onCreateTag={handleCreateTag}
      />

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
