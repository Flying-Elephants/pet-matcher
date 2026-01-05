# Feature Specification: Dashboard and Settings Implementation

## Affected Domains
- Analytics (Dashboard)
- Core (Settings, Navigation)

## 1. Database Schema Changes (Prisma)
No changes required for mock implementation.

## 2. Domain Service Interface (Public API)
- `app/modules/Analytics/index.ts`: Add `getMockAnalytics()`
- `app/modules/Core/SessionService.ts`: Ensure settings-related methods are defined if needed.

## 3. Interface Layer Requirements (Routes)

### Navigation Update (`app/routes/app.tsx`)
- Add `<a href="/app/dashboard">Dashboard</a>` (already exists but verify)
- Add `<a href="/app/settings">Settings</a>`

### Dashboard (`app/routes/app.dashboard.tsx`)
- **Loader**: Fetch mock analytics data.
- **UI Components**:
  - `Layout` with `IndexTable` or `Card` for match events.
  - `SummaryCards` for "Total Matches", "Active Sessions".

### Settings (`app/routes/app.settings.tsx`)
- **Loader**: Fetch current settings (mock).
- **Action**: Handle setting updates (mock toast).
- **UI Components**:
  - `FormLayout` with `TextFields` for "Shop Name", "Support Email".
  - `Card` for "Matching Logic Preferences".

## 4. Constraints & Edge Cases
- Use Polaris `Page` component with `title` and `primaryAction` (where the Guide will eventually go).
- Ensure routes exist and are linked correctly in `app/routes.ts` (if using file-based routing with config).
