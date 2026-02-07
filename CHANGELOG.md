# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Currency selector widget in dashboard for quick switching between ARS and MEP display currencies
- Transaction timeline chart showing daily transaction count for the current month
- Balance hiding feature with eye icon toggle for visual privacy (resets on app reload)
- Abbreviated number format (k/M) in Time Series and Category Pie charts for better readability
- Period comparison in Income vs Outcome widget with percentage change indicators
- Visual trend indicators (↑↓) showing if spending increased or decreased vs previous period
- Centered layout for dashboard filters component

### Changed
- Dashboard charts now hide content when balance hiding is active, showing placeholder instead
- Category Breakdown widget now takes full available vertical space before scrolling
- Time Series and Category Pie chart heights optimized to prevent number clipping
- Income vs Outcome widget shows "vs previous" comparison instead of confusing percentage of total
- Transaction timeline chart only displays when viewing monthly data

### Fixed
- Fixed TypeScript issues by replacing `any` types with proper interfaces in chart tooltip components
- Removed unused Group import in DashboardFilters component

## [1.6.0] - 2026-02-01

### Added
- Transfer feature: Create, edit, and delete transfers between accounts
- Support for multi-currency transfers with automatic exchange rate conversion
- Transfer list with expandable details showing exchange rates and descriptions
- Visual indicators for transfer amounts and converted amounts
- Swap button for quickly reversing transfer direction

### Fixed
- Fixed TypeScript type annotation for DateInput onChange handler in TransferForm

## [1.5.1] - 2026-01-24

### Fixed
- Fixed number formatting display across all components showing monetary values.

## [1.5.0] - 2026-01-24

### Added
- Date and time timestamp in exported database filename (format: `platito_db_export_YYYY-MM-DD_HH-MM-SS.json`)
- Category filter on all transactions list for better filtering capabilities
- Global filters for transaction type (income/expense) and account on transactions view
- Income vs Outcome comparison widget on dashboard
- Account selector widget on dashboard

### Changed
- Updated number format to European/Latin American standard (dots for thousands, comma for decimals)
- Accounts balance now properly affected by transactions in real-time

## [1.4.1] - 2025-12-22

### Fixed
- Fixed total balance calculation to properly convert transaction amounts from their currency to account currency before summing.

## [1.4.0] - 2025-12-21

### Added
- Negative balance display in red color for visual warning

### Fixed
- Fixed ReDoS vulnerability in number formatting regex by replacing with iterative approach
- Fixed total balance calculation to include all transactions (income and expenses)
- Fixed negative number formatting to properly display minus sign with thousands separators
- GitHub Actions now use full commit SHA instead of version tags for third-party dependencies

## [1.3.1] - 2025-12-13

### Fixed
- Hotfix: Removed problematic backport workflow that was causing deployment failures
  - Backport action had recurring merge conflict issues
  - Workflow temporarily disabled until a more robust solution is implemented

## [1.3.0] - 2025-12-11

### Added
- Enhanced transaction notifications with detailed information
  - Shows amount, currency, category, and date in success notifications
  - Bold formatting for amount and category for better visibility
  - Notifications appear when creating or updating transactions

### Changed
- Transactions within same date group now sorted by creation order
  - Most recently created transactions appear first within each date
  - Uses transaction ID for consistent ordering

## [1.2.0] - 2025-12-11

### Added
- Date navigation buttons in transaction forms (create and edit)
  - Previous day button (←) to go back one day
  - Next day button (→) to advance one day
  - Buttons automatically disabled when reaching today or when no date is selected
- Last used date persistence in transaction creation form
  - Date is saved to localStorage and restored on page load
  - Date is maintained when creating multiple transactions
- Recent category sorting in transaction forms
  - Categories are now ordered by recent usage (last 10 transactions)
  - Recently used categories appear first in the selector
  - Unused categories are sorted alphabetically at the end
- Visual icon preview in category creation form
  - Icon selector now displays the actual icon alongside the name

### Changed
- Automatic backport workflow no longer requires manual label
  - All merged PRs to main are automatically backported to develop

## [1.1.1] - 2025-12-11

### Fixed
- Fixed date timezone issues causing transactions to appear in wrong month filters
  - Transaction dates now use local timezone instead of UTC
  - Affects transaction creation, filtering, and display across all views
  - Testing database sample data now generates with correct local dates

### Added
- Automatic backport workflow for merging changes from main to develop
- CHANGELOG.md file to track version history and changes

## [1.1.0] - 2025-12-11

### Added
- Auto-update functionality for exchange rates
- Configurable update intervals (6h, 12h, 24h, or manual only)
- Rate limiting with countdown timer for manual updates
- Update counter and last update timestamp display

### Changed
- Exchange rates can now be automatically refreshed from external API
- Settings page shows remaining cooldown time before next manual update

## [1.0.0] - 2025-12-XX

### Added
- Progressive Web App (PWA) support with offline functionality
- Firebase deployment configuration
- Real exchange rate fetching from CriptoYa API
- Complete UI/UX redesign with Mantine components
- Dark/Light mode toggle
- Custom navigation bar
- Database import/export functionality (JSON format)
- Interactive dashboard with charts and analytics
  - Category pie chart
  - Time series chart
  - Category breakdown view
- Transaction management
  - Create, edit, and delete transactions
  - Filter by date ranges (day, week, month, year)
  - Filter by account and transaction type
  - Tag support for transactions
- Testing database with sample data
- Category management with custom icons and colors
- Tag system for transaction organization
- Multi-account support with different currencies (ARS, USD_BLUE, USD_MEP, USDT)
- Multi-currency handling with exchange rates
- Settings page with customization options
  - Default account selection
  - Default time window
  - Display currency preference
  - Exchange rate management
  - Database switching (Main/Testing)

### Technical
- IndexedDB for local-first data storage using Dexie
- React 19 with TypeScript
- Vite build system
- Mantine UI component library
- React Router for navigation
- Recharts for data visualization

[Unreleased]: https://github.com/tomas2305/platito/compare/1.3.1...HEAD
[1.3.1]: https://github.com/tomas2305/platito/compare/1.3.0...1.3.1
[1.3.0]: https://github.com/tomas2305/platito/compare/1.2.0...1.3.0
[1.2.0]: https://github.com/tomas2305/platito/compare/1.1.1...1.2.0
[1.1.1]: https://github.com/tomas2305/platito/compare/1.1.0...1.1.1
[1.1.0]: https://github.com/tomas2305/platito/compare/1.0.0...1.1.0
[1.0.0]: https://github.com/tomas2305/platito/releases/tag/1.0.0
