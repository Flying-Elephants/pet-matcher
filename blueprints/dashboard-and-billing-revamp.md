# Feature Specification: UI Revamp (Dashboard & Billing)

## Affected Domains
- Analytics
- Billing
- ProductRules (Sync Status)

## 1. Database Schema Changes (Prisma)
No changes required.

## 2. Domain Service Interface (Public API)
No changes to signatures, but UI will leverage existing services:
- `AnalyticsService.getSummary`
- `BillingService.getSubscriptionStatus`

## 3. Interface Layer Requirements (Routes)

### 3.1 Dashboard Revamp (`app/routes/app.dashboard.tsx` & `app/routes/app._index.tsx`)
- **Combined Layout**: Merge the "Setup Guide" from `_index` into the `dashboard` as a "Getting Started" checklist for new users (hidden if all steps completed).
- **KPI Visuals**: 
    - Use `Grid` with `1/4` sections for main stats.
    - Add "Trend" indicators (placeholder text/colors) to KPI cards.
- **Activity Feed**: Replace the flat table with a more visual list or a simplified chart (if library available, else better formatted `IndexTable`).
- **Quick Actions**: Move to a horizontal `InlineStack` at the top or a dedicated "Action Bar" Card.
- **Product Sync**: Integrate the sync progress directly into the Dashboard header or a persistent banner if a sync is in progress.

### 3.2 Billing Revamp (`app/routes/app.billing.tsx`)
- **Tier Comparison**: 
    - Use "Pricing Card" pattern with distinct visual hierarchy for the active plan.
    - Highlights: Use `Badge` for "Recommended" or "Current".
    - Standardize heights with `Box` and `minHeight`.
- **Usage Visualization**:
    - Centralize usage in a "Usage Overview" card with a `ProgressBar`.
    - Show specific count: `X of Y used`.
- **Feature Matrix**: Add a small checklist under each plan to clearly delineate features (e.g., "Klaviyo", "Unlimited Rules").

## 4. Constraints & Edge Cases
- **Empty States**: Dashboard must look "full" even with zero data (use `EmptyState` Polaris component).
- **Sync Locking**: Disable critical dashboard actions (like "Create Rule") while a full product sync is running to prevent data inconsistency.
- **Billing Gating**: Ensure "Upgrade" buttons are context-aware (e.g., don't show "Upgrade" on the Enterprise plan).
