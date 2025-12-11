# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- Fixed date timezone issues causing transactions to appear in wrong month filters
  - Transaction dates now use local timezone instead of UTC
  - Affects transaction creation, filtering, and display across all views
  - Testing database sample data now generates with correct local dates

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

[Unreleased]: https://github.com/tomas2305/platito/compare/1.1.0...HEAD
[1.1.0]: https://github.com/tomas2305/platito/compare/1.0.0...1.1.0
[1.0.0]: https://github.com/tomas2305/platito/releases/tag/1.0.0
