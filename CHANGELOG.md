# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.3.1] - 2024-12-11

### Fixed
- Backport workflow now handles merge conflicts automatically
  - Auto-resolves conflicts in CHANGELOG.md, package.json, and backport.yml
  - Accepts incoming changes from main during backport
  - Gracefully handles missing 'backport' label
  - Provides clear error messages for unresolvable conflicts

## [1.3.0] - 2024-12-11

### Added
- Enhanced transaction notifications with detailed information
  - Shows amount, currency, category, and date in success notifications
  - Bold formatting for amount and category for better visibility
  - Notifications appear when creating or updating transactions

### Changed
- Transactions within same date group now sorted by creation order
  - Most recently created transactions appear first within each date
  - Uses transaction ID for consistent ordering

## [1.2.0] - 2024-12-11

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

## [1.1.1] - 2024-12-11

### Fixed
- Fixed date timezone issues causing transactions to appear in wrong month filters
  - Transaction dates now use local timezone instead of UTC
  - Affects transaction creation, filtering, and display across all views
  - Testing database sample data now generates with correct local dates

### Added
- Automatic backport workflow for merging changes from main to develop
- CHANGELOG.md file to track version history and changes

## [1.1.0] - 2024-12-11

### Added
- Auto-update functionality for exchange rates
- Configurable update intervals (6h, 12h, 24h, or manual only)
- Rate limiting with countdown timer for manual updates
- Update counter and last update timestamp display

### Changed
- Exchange rates can now be automatically refreshed from external API
- Settings page shows remaining cooldown time before next manual update

## [1.0.0] - 2024-12-XX

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
