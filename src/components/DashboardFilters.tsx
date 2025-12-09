import React from 'react';
import type { Account, TransactionType, TimeWindow } from '../types';

interface DashboardFiltersProps {
  accounts: Account[];
  typeFilter: TransactionType;
  setTypeFilter: (type: TransactionType) => void;
  accountFilter: number | null;
  setAccountFilter: (id: number | null) => void;
  timeWindow: TimeWindow;
  setTimeWindow: (window: TimeWindow) => void;
  periodLabel: string;
  handlePrevPeriod: () => void;
  handleNextPeriod: () => void;
  disableNext: boolean;
}

export const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  accounts,
  typeFilter,
  setTypeFilter,
  accountFilter,
  setAccountFilter,
  timeWindow,
  setTimeWindow,
  periodLabel,
  handlePrevPeriod,
  handleNextPeriod,
  disableNext,
}) => (
  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '16px' }}>
    <label>
      Type:{' '}
      <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as TransactionType)}>
        <option value="expense">Expense</option>
        <option value="income">Income</option>
      </select>
    </label>
    <label>
      Account:{' '}
      <select value={accountFilter ?? ''} onChange={e => setAccountFilter(e.target.value ? Number(e.target.value) : null)}>
        <option value="">All Accounts</option>
        {accounts.map(acc => (
          <option key={acc.id} value={acc.id}>{acc.name}</option>
        ))}
      </select>
    </label>
    <label>
      Time Window:{' '}
      <select value={timeWindow} onChange={e => setTimeWindow(e.target.value as TimeWindow)}>
        <option value="day">Day</option>
        <option value="week">Week</option>
        <option value="month">Month</option>
        <option value="year">Year</option>
      </select>
    </label>
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <button onClick={handlePrevPeriod}>← Prev</button>
      <span style={{ minWidth: '150px', textAlign: 'center', fontWeight: 500 }}>{periodLabel}</span>
      <button onClick={handleNextPeriod} disabled={disableNext}>Next →</button>
    </div>
  </div>
);
