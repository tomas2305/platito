import { useEffect, useState } from 'react';
import { Button, Group, Paper, Stack, Text, Title } from '@mantine/core';
import type { Account } from '../types';
import { AccountIcon } from '../components/AccountIcon';
import { getColorHex } from '../utils/colors';
import { formatMonetaryValue } from '../utils/formatters';
import {
  getActiveAccounts,
  getArchivedAccounts,
  createAccount,
  updateAccount,
  archiveAccount,
  unarchiveAccount,
  deleteAccount,
} from '../stores/accountsStore';
import { AccountForm } from '../components/AccountForm';

export const AccountsPage = () => {
  const [activeAccounts, setActiveAccounts] = useState<Account[]>([]);
  const [archivedAccounts, setArchivedAccounts] = useState<Account[]>([]);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [modalOpened, setModalOpened] = useState(false);

  const loadAccounts = async () => {
    const [active, archived] = await Promise.all([
      getActiveAccounts(),
      getArchivedAccounts(),
    ]);
    setActiveAccounts(active);
    setArchivedAccounts(archived);
  };

  useEffect(() => {
    let mounted = true;
    getActiveAccounts().then((active) => {
      if (mounted) setActiveAccounts(active);
    });
    getArchivedAccounts().then((archived) => {
      if (mounted) setArchivedAccounts(archived);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleCreate = async (data: Omit<Account, 'id'>) => {
    await createAccount(data);
    await loadAccounts();
  };

  const handleUpdate = async (data: Omit<Account, 'id'>) => {
    if (editingAccount?.id) {
      await updateAccount(editingAccount.id, data);
      await loadAccounts();
    }
  };

  const handleArchive = async (id: number) => {
    await archiveAccount(id);
    await loadAccounts();
  };

  const handleUnarchive = async (id: number) => {
    await unarchiveAccount(id);
    await loadAccounts();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this account?')) {
      await deleteAccount(id);
      await loadAccounts();
    }
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setModalOpened(true);
  };

  const handleOpenCreate = () => {
    setEditingAccount(null);
    setModalOpened(true);
  };

  const handleCloseModal = () => {
    setModalOpened(false);
    setEditingAccount(null);
  };

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Title order={2}>Accounts</Title>
        <Button onClick={handleOpenCreate}>Create New Account</Button>
      </Group>

      <AccountForm
        account={editingAccount || undefined}
        opened={modalOpened}
        onClose={handleCloseModal}
        onSubmit={editingAccount ? handleUpdate : handleCreate}
      />

      <section>
        <Title order={3}>Active Accounts</Title>
        {activeAccounts.length === 0 ? (
          <Text c="dimmed">No active accounts</Text>
        ) : (
          <Stack gap="sm">
            {activeAccounts.map((acc) => (
              <Paper key={acc.id} shadow="xs" radius="md" p="md" withBorder>
                <Group align="center" gap="sm">
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      backgroundColor: getColorHex(acc.color),
                      borderRadius: '4px',
                    }}
                  />
                  <AccountIcon name={acc.icon} size={20} />
                  <Text fw={600}>{acc.name}</Text>
                  <Text>
                    {formatMonetaryValue(String(acc.initialBalance))} {acc.currency}
                  </Text>
                  <Group gap="xs" ml="auto">
                    <Button size="xs" variant="light" onClick={() => handleEdit(acc)}>Edit</Button>
                    <Button size="xs" variant="light" color="yellow" onClick={() => acc.id && handleArchive(acc.id)}>
                      Archive
                    </Button>
                    <Button size="xs" variant="light" color="red" onClick={() => acc.id && handleDelete(acc.id)}>
                      Delete
                    </Button>
                  </Group>
                </Group>
              </Paper>
            ))}
          </Stack>
        )}
      </section>

      <section>
        <Title order={3}>Archived Accounts</Title>
        {archivedAccounts.length === 0 ? (
          <Text c="dimmed">No archived accounts</Text>
        ) : (
          <Stack gap="sm">
            {archivedAccounts.map((acc) => (
              <Paper key={acc.id} shadow="xs" radius="md" p="md" withBorder style={{ opacity: 0.7 }}>
                <Group align="center" gap="sm">
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      backgroundColor: getColorHex(acc.color),
                      borderRadius: '4px',
                    }}
                  />
                  <AccountIcon name={acc.icon} size={20} />
                  <Text fw={600}>{acc.name}</Text>
                  <Text>
                    {formatMonetaryValue(String(acc.initialBalance))} {acc.currency}
                  </Text>
                  <Group gap="xs" ml="auto">
                    <Button size="xs" variant="light" color="green" onClick={() => acc.id && handleUnarchive(acc.id)}>
                      Unarchive
                    </Button>
                    <Button size="xs" variant="light" color="red" onClick={() => acc.id && handleDelete(acc.id)}>
                      Delete
                    </Button>
                  </Group>
                </Group>
              </Paper>
            ))}
          </Stack>
        )}
      </section>
    </Stack>
  );
};
