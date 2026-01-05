# Feature Specification: Welcome Page Auto-Sync & Progress Ring

Update the Welcome (Index) page to automatically trigger a product sync if none exists, and show a visual progress ring (circular progress) instead of a simple badge for the sync step.

## Affected Domains
- ProductRules (Sync logic)
- Analytics (Summary data)
- UI/Interface Layer (Routes)

## 1. Database Schema Changes (Prisma)
No schema changes required. Existing `SyncedProduct` and Shopify Bulk Operation tracking are sufficient.

## 2. Domain Service Interface (Public API)
No changes to `app/modules/ProductRules/index.ts`. We will leverage:
- `ProductRuleService.getSyncStatus(admin)`
- `ProductRuleService.syncProducts(admin)`
- `ProductRuleService.processSync(url, shop)`

## 3. Interface Layer Requirements (Routes)

### app/routes/app._index.tsx
- **Loader Strategy**: 
    - Keep `AnalyticsService.getSummary(session.shop)`.
    - Add `ProductRuleService.getSyncStatus(admin)` to the loader.
    - Return `syncStatus` along with `summary`.
- **Action Strategy**:
    - Implement an `action` to handle:
        - `START_SYNC`: Trigger `ProductRuleService.syncProducts`.
        - `PROCESS_SYNC`: Trigger `ProductRuleService.processSync`.
- **UI Strategy**:
    - **Auto-Sync**: Use `useEffect` + `useFetcher` to trigger `START_SYNC` if `summary.syncedProductsCount === 0` and no sync is currently running.
    - **Polling**: If a sync is `RUNNING`, poll the loader every 5 seconds using `useRevalidator` or `fetcher`.
    - **Progress Ring**: Replace the `Badge` in `BoxStep` (Step 1) with a custom SVG Progress Ring.
        - The ring should fill based on `objectCount` (if running) or show 100% (if `syncedProductsCount > 0`).
        - If `COMPLETED` but not processed, show a "Process" button.
    - **Automatic Processing**: If sync status is `COMPLETED`, automatically trigger the `PROCESS_SYNC` action via fetcher.

## 4. Constraints & Edge Cases
- **Billing Gating**: Ensure sync only happens for active subscriptions (handled by `authenticate.admin`).
- **Performance**: Polling frequency set to 5s to avoid hitting Shopify API rate limits unnecessarily.
- **State Management**: Ensure `useEffect` dependencies prevent infinite loops when auto-triggering actions.
