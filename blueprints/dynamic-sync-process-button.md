# Feature Specification: Dynamic Sync and Process Button Visibility

The "Welcome" page (`app/routes/app._index.tsx`) currently shows the "Re-sync Products" button and "Process Sync" banner even when the system is already up-to-date. This blueprint outlines the changes to ensure these controls are hidden once synchronization and processing are fully completed, replaced by a "Synced" status indicator.

## Affected Domains
- ProductRules (Interface Layer)

## 1. Database Schema Changes (Prisma)
- No changes required.

## 2. Domain Service Interface (Public API)
- No changes required to `app/modules/ProductRules/index.ts`.

## 3. Interface Layer Requirements (Routes)
### app/routes/app._index.tsx
- **Current Logic**:
  - `showSyncControls` is `true` if `!hasProducts || isSyncing || (isCompleted && syncStatus?.url)`.
  - `isUpToDate` is `true` if `hasProducts && !isSyncing && (!isCompleted || !syncStatus?.url)`.
  - `isCompleted` only checks for `COMPLETED` status from Shopify Bulk API but doesn't guarantee the data has been processed into our DB.

- **Refined Logic**:
  - Hide all sync-initiating and sync-processing UI once the products are in the database and no active sync/process job is pending.
  - Show a clear "Synced" state with a "Check for Updates" or similar hidden/secondary action if needed, but the primary view should be clean.
  
- **UI Changes**:
  - Update `isUpToDate` calculation to accurately reflect when products exist and no action is needed.
  - Conditionally render the `Banner` for "Process Sync" and the `Button` for "Start Sync" based on `!isUpToDate`.
  - Add an "Update Catalog" secondary button or keep the "Re-sync" only if the user explicitly wants to force a refresh, but hide it from the primary onboarding flow once "Synced".

## 4. Constraints & Edge Cases
- **Empty Catalog**: Must always show sync button if `hasProducts` is false.
- **Partial Sync**: If `isCompleted` (Shopify finished) but `url` exists, we MUST show "Process Sync" because the data isn't in our DB yet.
- **Post-Process State**: After `PROCESS_SYNC` action succeeds, `isUpToDate` should become true, hiding the banners and buttons.
