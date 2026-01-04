# Feature Specification: UI Restructuring - Welcome vs Dashboard

## Affected Domains
- Core (Navigation, UI Layout)
- Analytics (Dashboard View)

## 1. Database Schema Changes (Prisma)
None required.

## 2. Domain Service Interface (Public API)
No changes to existing service interfaces. The existing `AnalyticsService` and `ProductRuleService` will simply be consumed by the new `app.dashboard` route instead of `app._index`.

## 3. Interface Layer Requirements (Routes)

### A. New Route: `app/routes/app.dashboard.tsx`
- **Role**: Replaces the current `app._index.tsx` functionality.
- **Loader**:
  - `AnalyticsService.getSummary(session.shop)`
  - `ProductRuleService.getSyncStatus(admin)`
  - `AnalyticsService.getHistoricalMatches(session.shop)`
- **UI Components**:
  - `Business Performance` (Cards)
  - `Quick Actions` (Buttons)
  - `Platform Health` (Status Checks)
  - Auto-refresh logic for sync status.

### B. Modified Route: `app/routes/app._index.tsx` (Welcome Screen)
- **Role**: Static onboarding guide.
- **Loader**: Minimal (Auth only).
- **UI Components**:
  - **Hero Section**: Welcome message + "Get Started" call to action.
  - **Guide Steps**:
    1.  Sync Products (Link to `/app/sync`)
    2.  Configure Pet Types (Link to `/app/pet-types`)
    3.  Check Dashboard (Link to `/app/dashboard`)
  - **Media**: Placeholder for "How to use" video or images.

### C. Modified Route: `app/routes/app.tsx`
- **Navigation Menu (`<ui-nav-menu>`)**:
  - Update `Home` -> `/app` (Welcome)
  - Add `Dashboard` -> `/app/dashboard` (Analytics)
  - Keep `Product Sync`, `Pet Types`, `Audit`.

## 4. Constraints & Edge Cases
- **Redirects**: None explicit, users land on Welcome.
- **Performance**: Dashboard data fetching moved to specific route, speeding up the initial app load if users just want to see the guide.
