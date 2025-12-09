import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Account } from '../types';
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
  const [showForm, setShowForm] = useState(false);

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
    setShowForm(false);
  };

  const handleUpdate = async (data: Omit<Account, 'id'>) => {
    if (editingAccount?.id) {
      await updateAccount(editingAccount.id, data);
      await loadAccounts();
      setEditingAccount(null);
      setShowForm(false);
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
    setShowForm(true);
  };

  const handleCancel = () => {
    setEditingAccount(null);
    setShowForm(false);
  };

  return (
    <div>
      <h1>Accounts</h1>
      <nav>
        <Link to="/">Home</Link> | <Link to="/settings">Settings</Link>
      </nav>

      {!showForm && (
        <button onClick={() => setShowForm(true)}>Create New Account</button>
      )}

      {showForm && (
        <AccountForm
          account={editingAccount || undefined}
          onSubmit={editingAccount ? handleUpdate : handleCreate}
          onCancel={handleCancel}
        />
      )}

      <section>
        <h2>Active Accounts</h2>
        {activeAccounts.length === 0 ? (
          <p>No active accounts</p>
        ) : (
          <ul>
            {activeAccounts.map((acc) => (
              <li key={acc.id} style={{ marginBottom: '12px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      backgroundColor: acc.color,
                      borderRadius: '4px',
                    }}
                  />
                  <strong>{acc.name}</strong>
                  <span>
                    {formatMonetaryValue(String(acc.initialBalance))} {acc.currency}
                  </span>
                  <span>{acc.icon}</span>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleEdit(acc)}>Edit</button>
                    <button onClick={() => acc.id && handleArchive(acc.id)}>
                      Archive
                    </button>
                    <button onClick={() => acc.id && handleDelete(acc.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>Archived Accounts</h2>
        {archivedAccounts.length === 0 ? (
          <p>No archived accounts</p>
        ) : (
          <ul>
            {archivedAccounts.map((acc) => (
              <li key={acc.id} style={{ marginBottom: '12px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    opacity: 0.6,
                  }}
                >
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      backgroundColor: acc.color,
                      borderRadius: '4px',
                    }}
                  />
                  <strong>{acc.name}</strong>
                  <span>
                    {formatMonetaryValue(String(acc.initialBalance))} {acc.currency}
                  </span>
                  <span>{acc.icon}</span>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                    <button onClick={() => acc.id && handleUnarchive(acc.id)}>
                      Unarchive
                    </button>
                    <button onClick={() => acc.id && handleDelete(acc.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
