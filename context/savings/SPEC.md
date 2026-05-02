# Savings Feature Specification

## Overview
Add comprehensive savings tracking functionality to help users monitor and achieve their savings goals through automatic calculation, visual feedback, and account-based savings tracking.

## Purpose
Enable users to track their financial health through savings rate metrics, set savings goals, and visualize their progress over time. This feature bridges the gap between income/expense tracking and long-term financial planning.

## Use Cases
- Track monthly savings rate as percentage of income
- Set and monitor savings goals (target percentage)
- Identify savings accounts to automatically calculate saved amounts
- Monitor available spending budget after savings allocation
- View historical savings performance across months
- Understand spending patterns relative to income and savings goals

## Core Concepts

### Savings Rate
The percentage of total income that is saved in a given period:
```
Savings Rate = (Total Saved / Total Income) * 100
```

### Total Saved Calculation
Two components contribute to total saved:
1. **Net Positive Balance**: Income minus expenses (if positive)
2. **Transfers to Savings Accounts**: Any transfers made to designated savings accounts

```
Total Saved = max(0, Income - Expenses) + Transfers to Savings Accounts
```

### Available Spending Budget
The amount available to spend after accounting for savings goals:
```
Available Budget = Income - Expenses - (Income * Target Savings Rate / 100)
Budget Usage % = ((Income - Available Budget) / Income) * 100
```

## Data Model

### Account Extension
Extend the existing `Account` interface:

```typescript
export interface Account {
  id?: number;
  name: string;
  currency: Currency;
  initialBalance: number;
  color: ColorName;
  icon: string;
  isArchived: boolean;
  isSavingsAccount?: boolean; // NEW: Marks account as savings
}
```

### Settings Extension
Extend `AppSettings` to include savings configuration:

```typescript
export interface AppSettings {
  id?: number;
  defaultAccountId?: number;
  defaultTimeWindow: TimeWindow;
  displayCurrency: Currency;
  exchangeRates: ExchangeRates;
  autoUpdateInterval: AutoUpdateInterval;
  lastFxUpdate?: string;
  fxUpdateCount: number;
  targetSavingsRate?: number; // NEW: Target savings percentage (0-100)
}
```

### Savings Metrics Interface
New interface for calculated savings data:

```typescript
export interface SavingsMetrics {
  period: string; // YYYY-MM format
  income: number; // In display currency
  expenses: number; // In display currency
  netBalance: number; // income - expenses
  transfersToSavings: number; // Total transfers to savings accounts
  totalSaved: number; // netBalance (if positive) + transfersToSavings
  savingsRate: number; // Percentage (0-100)
  targetSavingsRate?: number; // Target for this period
  isTargetMet: boolean; // Whether target was achieved
  availableBudget: number; // Income - expenses - target savings
  budgetUsageRate: number; // Percentage of income used
}
```

## Business Rules

### Savings Account Rules
1. **Marking Accounts**: Any account can be marked as savings account
2. **Transfers Count**: Only transfers TO savings accounts count as savings
3. **Multiple Savings Accounts**: System supports multiple savings accounts
4. **Archive Behavior**: Archived savings accounts should still count in historical calculations
5. **Currency Conversion**: All transfers converted to display currency using exchange rates

### Savings Rate Calculation Rules
1. **Only Positive Net Balance**: If expenses exceed income, net contribution is 0
   - `netContribution = max(0, income - expenses)`
2. **Include All Transfers**: Sum all transfers to savings accounts in the period
3. **Convert to Display Currency**: All amounts in selected display currency
4. **Zero Income Handling**: If income is 0, savings rate is 0%
5. **Cap at 100%**: Savings rate cannot exceed 100%
   - `savingsRate = min(100, (totalSaved / income) * 100)`

### Target Savings Rate Rules
1. **Valid Range**: Target must be between 0 and 100
2. **Default Value**: No default target (optional feature)
3. **Per Period Check**: Each period evaluated independently
4. **Target Met Logic**: 
   - `isTargetMet = actualSavingsRate >= targetSavingsRate`
   - If no target set, always considered "met"

### Available Budget Rules
1. **Formula**: `availableBudget = income - expenses - (income * targetRate / 100)`
2. **No Target**: If no target set, available budget = income - expenses
3. **Negative Budget**: Can be negative if overspending
4. **Usage Percentage**: `usageRate = ((expenses + targetSavings) / income) * 100`

### Time Period Rules
1. **Monthly Granularity**: Calculations primarily at month level
2. **Calendar Months**: Use full calendar months (1st to last day)
3. **Current Month**: Include only transactions up to current date
4. **Historical Data**: Calculate for all months with transactions
5. **Future Months**: Do not calculate for future months

## Validations

### Account Validations
1. **Savings Flag**: `isSavingsAccount` must be boolean, defaults to false
2. **Cannot Transfer to Self**: Existing rule still applies
3. **Active Check**: Alert user if marking archived account as savings

### Settings Validations
1. **Target Range**: `targetSavingsRate` must be `>= 0 and <= 100`
2. **Numeric Value**: Must be valid number or undefined
3. **Persistence**: Save immediately on change

### Calculation Validations
1. **Valid Dates**: All transactions must have valid dates
2. **Valid Amounts**: All amounts must be positive numbers
3. **Currency Rates**: Exchange rates must exist for all currencies
4. **Account References**: All account IDs must be valid

## UI Components

### 1. Savings Rate Widget (Current Month Summary)
**Location**: HomePage, below Savings Timeline Chart

**Features**:
- Large display of current month savings rate percentage
- Visual indicator (color-coded):
  - Green: Meeting or exceeding target
  - Yellow: Within 10% of target
  - Red: Below target by >10%
  - Gray: No target set
- Small trend indicator (↑↓→) comparing to previous month
- Subtitle showing: "Saved [amount] of [income]"

**Styling**:
- Card component
- Prominent percentage display (large font)
- Icon: piggy bank or savings icon
- Consistent with existing dashboard widgets

### 2. Savings Timeline Chart (12 Months)
**Location**: HomePage, below Income vs Outcome section

**Features**:
- Line chart showing savings rate over last 12 months
- X-axis: Months (abbreviated: Jan, Feb, Mar, etc.)
- Y-axis: Savings rate percentage (0-100%)
- Horizontal reference line indicating target rate (if set)
- Color scheme: Green (#12b886) - distinct from transaction charts
- Tooltips showing:
  - Month and Year
  - Savings Rate percentage
  - Target rate and whether it was met (✓/✗)
  - Total amount saved
- Data points with hover effects
- Shows only months with data

**Similar To**: TransactionTimelineChart component but with savings-specific styling
**Color Scheme**: Green shades (#12b886) - distinct from transaction colors

### 3. Budget Usage Indicator
**Location**: Below Savings Rate Widget on HomePage

**Features**:
- Progress bar or linear indicator
- Shows: `(Expenses + Target Savings) / Income * 100`
- Color zones:
  - 0-80%: Green (healthy)
  - 80-100%: Yellow (tight)
  - 100%+: Red (overspending)
- Label: "Budget Usage" or "Available to Spend"
- Amount display: Remaining budget in display currency

### 4. Account Settings Enhancement
**Location**: AccountForm component

**Features**:
- Checkbox: "Mark as Savings Account"
- Help text: "Transfers to this account count toward your savings rate"
- Visual indicator on account list (savings badge/icon)
- Filter option: Show only savings accounts

### 5. Savings Target Setting
**Location**: SettingsPage

**Features**:
- Number input: Target Savings Rate (0-100)
- Slider alternative for easier selection
- Help text explaining calculation
- Preview calculation based on current month
- Quick presets: 10%, 20%, 30%, 50%

## Feature Enhancements

### Phase 1 - Core Features (IMPLEMENTED)
1. ✅ Basic savings rate calculation
2. ✅ Mark accounts as savings accounts
3. ✅ Current month savings rate display
4. ✅ Target savings rate setting
5. ✅ Budget usage indicator
6. ✅ Savings timeline chart (12 months)
7. ✅ Automatic recalculation when target changes
8. ✅ Color-coded visual feedback based on target achievement

### Phase 2 - Visualization (COMPLETED)
1. ✅ Savings timeline chart (12 months) with target reference line
2. ✅ Month-over-month comparison
3. ✅ Target achievement indicators
4. ✅ Enhanced color coding and visual feedback
5. ✅ Dynamic updates without page reload

### Phase 3 - Advanced Features (PENDING)
1. **Savings Goals**: Set specific amount goals with deadlines
2. **Category-Based Savings**: Tag certain income sources as "save-only"
3. **Automated Alerts**: Notify when not meeting savings target
4. **Projections**: Forecast when savings goals will be reached
5. **Multiple Targets**: Different targets for different months/seasons
6. **Savings Categories**: Break down savings by purpose (emergency fund, vacation, etc.)
7. **Export Reports**: Generate savings performance reports

## Technical Considerations

### Performance
1. **Caching**: Cache monthly calculations to avoid repeated computation
2. **Lazy Loading**: Load historical data only when timeline is opened
3. **Index Usage**: Ensure date-based queries are indexed in Dexie
4. **Memoization**: Use React.useMemo for expensive calculations

### Data Migration
1. **Account Migration**: Add `isSavingsAccount` field with default false
2. **Settings Migration**: Add `targetSavingsRate` field as optional
3. **Backward Compatibility**: Ensure existing data continues to work
4. **Migration Script**: Update all existing accounts

```typescript
// Migration example
const migrateAccounts = async () => {
  const db = getDB();
  const accounts = await db.accounts.toArray();
  for (const account of accounts) {
    if (account.isSavingsAccount === undefined) {
      await db.accounts.update(account.id!, { isSavingsAccount: false });
    }
  }
};
```

### Store Functions
New functions needed in stores:

```typescript
// accountsStore.ts
export const setSavingsAccount = async (
  id: number, 
  isSavings: boolean
): Promise<void>;

export const getSavingsAccounts = async (): Promise<Account[]>;

// settingsStore.ts
export const setTargetSavingsRate = async (
  rate: number
): Promise<void>;

export const getTargetSavingsRate = async (): Promise<number | undefined>;

// New savingsStore.ts
export const calculateSavingsMetrics = async (
  year: number,
  month: number
): Promise<SavingsMetrics>;

export const calculateYearSavingsMetrics = async (
  year: number
): Promise<SavingsMetrics[]>;

export const getSavingsAccounts = async (): Promise<Account[]>;

export const getTransfersToSavingsAccounts = async (
  startDate: Date,
  endDate: Date
): Promise<Transfer[]>;
```

## Edge Cases & Handling

### Income = 0
- **Behavior**: Savings rate = 0%, show "No income recorded"
- **Budget Usage**: N/A or 0%
- **Chart**: Show 0% point with different color/indicator

### Expenses > Income (Negative Net)
- **Behavior**: Only count transfers to savings accounts
- **Net Contribution**: 0 (don't count negative)
- **Budget Usage**: Show as >100% in red
- **Alert**: Optional warning about overspending

### Savings Rate > 100%
- **Cause**: Transfers to savings exceed income
- **Behavior**: Cap display at 100%
- **Note**: Show footnote explaining the cap
- **Advanced View**: Option to show actual percentage (uncapped)

### No Target Set
- **Behavior**: Show widgets without target comparison
- **Colors**: Use neutral colors (gray/blue)
- **CTA**: Prompt to set target with link to settings

### No Savings Accounts
- **Behavior**: Calculate based on net positive balance only
- **Prompt**: Suggest marking an account as savings
- **Help Text**: Explain benefit of savings accounts

### Multiple Currencies
- **Conversion**: Convert all amounts to display currency
- **Rate Changes**: Use rates from transaction/transfer date
- **Display**: Show all amounts in display currency only

### Account Deletion
- **Savings Account**: Warning if deleting savings account
- **Historical Data**: Preserve historical calculations
- **Transfer Orphans**: Handle transfers to deleted savings accounts

### Date Edge Cases
- **Month Boundaries**: Use inclusive start, exclusive end dates
- **Timezone**: Use local timezone for date calculations
- **Leap Years**: Handle February correctly
- **Future Dates**: Exclude transactions with future dates

## Validation Messages

### User-Facing Messages
- **Target Set**: "Savings target set to {rate}%"
- **Target Met**: "🎉 You met your savings goal this month!"
- **Target Missed**: "You're {percentage} away from your savings target"
- **No Income**: "No income recorded for this period"
- **Mark Savings**: "Account marked as savings account"
- **Overspending**: "Your expenses exceed your income by {amount}"

### Error Messages
- **Invalid Target**: "Savings target must be between 0 and 100"
- **Invalid Account**: "Cannot mark archived account as savings"
- **Calculation Error**: "Unable to calculate savings rate. Please check your data."
- **Missing Data**: "Insufficient data to calculate savings metrics"

## Accessibility

1. **ARIA Labels**: All interactive elements properly labeled
2. **Color Independence**: Don't rely solely on color (use icons/text)
3. **Keyboard Navigation**: All controls keyboard accessible
4. **Screen Readers**: Meaningful descriptions for metrics
5. **Contrast**: Ensure sufficient color contrast ratios

## Testing Scenarios

### Unit Tests
1. Savings rate calculation with various income/expense combinations
2. Target savings rate validation
3. Budget usage calculation
4. Transfer to savings account identification
5. Currency conversion in savings calculations
6. Edge cases (zero income, negative balance, etc.)

### Integration Tests
1. Mark account as savings and verify calculation changes
2. Set target and verify UI updates
3. Add transfers to savings accounts and verify metrics
4. Change display currency and verify conversions
5. Navigate between months and verify calculations

### E2E Tests
1. User journey: Set target → Add income → Monitor progress
2. User journey: Mark account as savings → Transfer money → View rate
3. User journey: View timeline → Click month → See breakdown
4. User journey: Overspend → See warnings → Adjust behavior

## Success Metrics

### User Engagement
- Percentage of users who set savings targets
- Percentage of users who mark savings accounts
- Frequency of viewing savings widgets
- Time spent on savings timeline

### Feature Impact
- Average savings rate increase after feature adoption
- Target achievement rate among users
- Correlation between target setting and actual savings

### Technical Metrics
- Widget load time < 200ms
- Timeline render time < 500ms
- Calculation accuracy: 100%
- Error rate < 0.1%

## Future Considerations

### AI/ML Opportunities
- Predict optimal savings rate based on spending patterns
- Suggest savings targets based on income volatility
- Identify expenses that could be reduced for savings

### Gamification
- Badges for savings streaks
- Challenges (e.g., "Save 20% for 3 months")
- Leaderboards (optional, privacy-respecting)

### Advanced Analytics
- Savings rate by income source
- Impact of specific expense categories on savings
- Seasonal savings patterns
- Correlation analysis (savings vs. specific behaviors)

### Integration Opportunities
- Export to financial planning tools
- Import savings goals from other apps
- Bank integration for automatic savings transfer
- Investment tracking i - ✅ COMPLETED
1. ✅ Account `isSavingsAccount` field
2. ✅ Settings `targetSavingsRate` field
3. ✅ Savings rate calculation logic
4. ✅ Current month savings rate widget
5. ✅ Budget usage indicator
6. ✅ Account form checkbox for savings
7. ✅ Savings timeline chart (12 months)
8. ✅ Target achievement indicators
9. ✅ Automatic recalculation on target change

### Medium Priority - ✅ COMPLETED
1. ✅ Savings timeline chart (12 months)
2. ✅ Target achievement indicators
3. ✅ Month-over-month comparison
4. ✅ Enhanced visual feedback
5. ✅ Savings timeline chart (12 months)
2. Target achievement indicators
3. Month-over-month comparison
4. Enhanced visual feedback
5. Settings page target input

### Low Priority (Future)
1. Savings goals with deadlines
2. Category-based savings
3. Automated alerts
4. Advanced analytics
5. Export/reporting features

## Notes

- All monetary calculations should be performed in a consistent currency (display currency)
- Historical calculations should use exchange rates from the transaction date
- Consider caching strategies for improved performance
- Ensure all new components follow existing Mantine UI patterns
- Maintain consistency with existing color schemes and design language
- Test thoroughly with edge cases before launch
- Document all new utility functions and calculations
- Consider mobile responsiveness for all new UI components
