# Feature Specification: Dynamic Sync/Process Button

## Affected Domains
- ProductRules (UI Layer)

## 1. Database Schema Changes (Prisma)
No changes required.

## 2. Domain Service Interface (Public API)
No changes required.

## 3. Interface Layer Requirements (Routes)
### app/routes/app._index.tsx
- **Button Logic Update**: 
    - When `isCompleted` is true (Shopify Bulk Operation finished):
        - The primary action button should change from "Re-sync" to "Process Sync" (or "Apply to Database").
        - Clicking this button should trigger `handleProcessSync` instead of `handleStartSync`.
    - The "Re-sync" button should remain available as a secondary option if the user wants to restart the Shopify fetch instead of processing the current one.

- **UI Refinement**:
    - Update the button labels and icons to clearly distinguish between "Fetching from Shopify" (Sync) and "Writing to Database" (Process).

## 4. Constraints & Edge Cases
- **State Consistency**: Ensure `isCompleted` and `hasProducts` correctly reflect the state where a file is ready to be processed but hasn't been written to the database yet.
- **Loading States**: Maintain independent loading states for `START_SYNC` vs `PROCESS_SYNC`.
