# Transfer Feature Specification

## Overview
Add the ability to create transfers between accounts to handle money movements like currency purchases, investments, or account-to-account transfers without affecting income/expense calculations.

## Purpose
Transfers represent neutral money movements between accounts. They are not income or expenses but state changes of capital distribution.

## Use Cases
- Currency purchases (e.g., buying USD with ARS)
- Investment movements
- Moving money between bank accounts
- Any account-to-account money transfer

## Data Model

### Transfer Interface
```typescript
interface Transfer {
  id?: number;
  fromAccountId: number;
  toAccountId: number;
  amount: number; // Amount in source account currency
  convertedAmount: number; // Amount in destination account currency
  exchangeRate: number; // Rate applied at transfer time (for audit)
  date: string; // ISO date format (YYYY-MM-DD)
  description?: string;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}
```

## Business Rules

### Validations
1. **No self-transfers**: Cannot transfer to the same account
2. **Positive amounts**: Amount and convertedAmount must be > 0
3. **Valid accounts**: Both fromAccountId and toAccountId must exist
4. **Valid date**: Date cannot be in the future

### Currency Conversion
- Conversion is done through ARS as base currency
- Formula: 
  - `amountInARS = amount * exchangeRates[fromCurrency].toARS`
  - `convertedAmount = amountInARS / exchangeRates[toCurrency].toARS`
- Exchange rate captured for audit: `exchangeRate = convertedAmount / amount`
- This represents how many units of destination currency equals 1 unit of source currency

### Account Balance Impact
Transfers affect account balances:
- **Source account**: Balance decreases by `amount`
- **Destination account**: Balance increases by `convertedAmount`
- **Income/Expense totals**: NOT affected by transfers

### Editing Transfers
- Transfers can be edited (date, amount, description)
- Amount must always be positive
- Editing recalculates convertedAmount with current exchange rates
- EditedAt timestamp is updated

### Account Deletion Behavior
- When an account is deleted, associated transfers are NOT automatically deleted
- Transfers remain in the database with references to non-existent accounts
- Only delete a transfer if BOTH accounts (from and to) no longer exist
- This preserves transfer history for audit purposes

## Features

### CRUD Operations
- **Create**: Create new transfer between two accounts
- **Read**: View list of all transfers with filters
- **Update**: Edit transfer details (amount, date, description)
- **Delete**: Delete individual transfers

### Filtering
Transfers can be filtered by:
- Time window (day, week, month, year) - using same PeriodNavigator component as transactions
- From account
- To account
- Both time window and accounts combined

### Display
- Transfers have their own dedicated page (TransfersPage) accessible from navbar
- List view showing: Date, From Account → To Account, Amount, Converted Amount, Exchange Rate, Description
- Uses PeriodNavigator component (same as TransactionsPage) for time window filtering
- Transfer creation form integrated in the same page
- No category or tag assignment
- No inclusion in dashboard charts or time series graphs
- No inclusion in income/expense comparison widgets

### UI Enhancements
- **Swap Button**: ActionIcon button between account selects to quickly swap from/to accounts
- **Balance Preview**: Real-time display of current balance for selected from and to accounts
- **Conversion Preview**: Shows converted amount and exchange rate before creating transfer
- Balance calculation includes all transactions and transfers up to current moment

## Implementation Phases

### Phase 1: Data Layer
- Create `transfers` table in database schema
- Implement `transfersStore.ts` with CRUD operations
- Add Transfer type to types index

### Phase 2: Business Logic
- Implement conversion calculation logic
- Update `getAccountBalance()` to include transfers
- Ensure dashboard calculations exclude transfers

### Phase 3: UI Components
- Create `TransferForm.tsx` component
- Create `TransferList.tsx` component
- Create `TransfersPage.tsx` page (with form and list integrated)
- Reuse `PeriodNavigator` component for time window filtering

### Phase 4: Integration
- Add Transfers link to navbar navigation
- Update reset database functionality to include transfers
- Add transfers to testing data seed
- Update export/import to handle transfers
- Ensure time window state management works with PeriodNavigator

## Out of Scope
- Transfer history/changelog tracking
- Dashboard widgets for recent transfers
- Notifications for transfers
- Display transfers in charts or graphs
- Scheduled/recurring transfers
- Transfer templates

## Technical Notes

### Database Table: transfers
```sql
CREATE TABLE transfers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fromAccountId INTEGER NOT NULL,
  toAccountId INTEGER NOT NULL,
  amount REAL NOT NULL,
  convertedAmount REAL NOT NULL,
  exchangeRate REAL NOT NULL,
  date TEXT NOT NULL,
  description TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (fromAccountId) REFERENCES accounts(id),
  FOREIGN KEY (toAccountId) REFERENCES accounts(id)
);
```

### Store Methods
```typescript
// transfersStore.ts
- createTransfer(data: Omit<Transfer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transfer>
- getAllTransfers(): Promise<Transfer[]>
- getTransferById(id: number): Promise<Transfer | undefined>
- updateTransfer(id: number, data: Partial<Transfer>): Promise<void>
- deleteTransfer(id: number): Promise<void>
- getTransfersByDateRange(startDate: string, endDate: string): Promise<Transfer[]>
- getTransfersByAccount(accountId: number, direction: 'from' | 'to' | 'both'): Promise<Transfer[]>
```

## Success Criteria
- Users can create transfers between any two different accounts
- Currency conversion works correctly in all directions
- Account balances correctly reflect transfers
- Income/expense calculations exclude transfers
- Transfers can be filtered and edited
- Account deletion doesn't break transfer history
