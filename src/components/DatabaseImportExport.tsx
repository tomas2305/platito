import React, { useRef } from 'react';
import { getDB, getActiveDatabaseName } from '../db';

export const DatabaseImportExport: React.FC<{ activeDb?: string }> = ({ activeDb }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Use prop if provided, else fallback to getActiveDatabaseName
  const isMainDb = (activeDb ?? getActiveDatabaseName()) === 'platito_db';

  const handleExport = async () => {
    const db = getDB();
    const [accounts, categories, tags, transactions, settings] = await Promise.all([
      db.accounts.toArray(),
      db.categories.toArray(),
      db.tags.toArray(),
      db.transactions.toArray(),
      db.settings.toArray(),
    ]);
    const data = { accounts, categories, tags, transactions, settings };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'platito_db_export.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!globalThis.confirm('Importing will replace all current data in the main database. Do you want to continue? It is recommended to export first.')) return;
    const text = await file.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      alert('The file is not valid JSON.');
      return;
    }
    const db = getDB();
    const tables = [db.accounts, db.categories, db.tags, db.transactions, db.settings];
    const missingTables = tables.filter(table => !table);
    if (missingTables.length > 0) {
      alert('Database is not ready or missing tables. Please reload the page and try again.');
      return;
    }
    await db.transaction('rw', db.accounts, db.categories, db.tags, db.transactions, async () => {
      await Promise.all([
        db.accounts.clear(),
        db.categories.clear(),
        db.tags.clear(),
        db.transactions.clear(),
      ]);
      if (data.accounts) await db.accounts.bulkAdd(data.accounts);
      if (data.categories) await db.categories.bulkAdd(data.categories);
      if (data.tags) await db.tags.bulkAdd(data.tags);
      if (data.transactions) await db.transactions.bulkAdd(data.transactions);
    });
    // settings: clear and import outside transaction (for both main and testing DB)
    await db.settings.clear();
    if (data.settings) await db.settings.bulkAdd(data.settings);
    globalThis.location.reload();
  };

  return (
    <div style={{ margin: '16px 0' }}>
      <button onClick={handleExport}>Export database (JSON)</button>
      {isMainDb && (
        <>
          <input
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
            ref={fileInputRef}
            onChange={handleImport}
          />
          <button
            style={{ marginLeft: '12px', background: '#f44336', color: 'white' }}
            onClick={() => fileInputRef.current?.click()}
          >
            Import database (JSON)
          </button>
          <span style={{ marginLeft: '8px', color: '#f44336', fontWeight: 500 }}>
            Warning! This will replace all current data.
          </span>
        </>
      )}
    </div>
  );
}
