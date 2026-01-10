# Feature Specification: Dashboard Revamp

## Affected Domains
- Analytics
- PetProfiles
- ProductRules

## 1. Database Schema Changes (Prisma)
No changes required to the schema. We will leverage existing indexes on `MatchEvent` and `PetProfile`.

## 2. Domain Service Interface (Public API)

### `app/modules/Analytics/index.ts`
```typescript
export interface SummaryData {
  totalMatches: number;       // Lifetime match events
  activeRules: number;        // Rules where isActive = true
  totalPetProfiles: number;   // Count of all pet profiles
  syncedProductsCount: number; // Count of products in SyncedProduct table
  topPerformingRules: Array<{ ruleName: string; count: number }>;
  popularBreeds: Array<{ breed: string; count: number }>;
}

export const AnalyticsService = {
  getSummary: async (shop: string): Promise<SummaryData> => { ... },
  // ... existing recordMatch and getHistoricalMatches
};
```

## 3. Interface Layer Requirements (Routes)

### `app/routes/app.dashboard.tsx`
- **Loader Strategy**:
  Parallel fetching of summary and historical data.
  ```typescript
  const [summary, historicalMatches] = await Promise.all([
    AnalyticsService.getSummary(session.shop),
    AnalyticsService.getHistoricalMatches(session.shop, 30)
  ]);
  ```

- **Layout Structure**:
  1. **Top Row (KPIs)**: 4 Cards showing Total Matches, Active Rules, Total Pets, and Synced Products.
  2. **Middle Row (Charts/Lists)**:
     - Left (2/3): Historical Match Activity (IndexTable or simple sparkline simulation).
     - Right (1/3): Top 5 Performing Rules.
  3. **Bottom Row (Insights)**:
     - Left (1/2): Popular Breeds distribution.
     - Right (1/2): Quick Actions (Link to create rule, link to view profiles).

- **Action Strategy**:
  No direct actions on dashboard yet, primary focus is Read-Only insights.

## 4. Constraints & Edge Cases
- **Data Volume**: `MatchEvent` counts should be aggregated efficiently using Prisma's `groupBy` or `count`.
- **Empty State**: Handle shops with 0 profiles or 0 matches by showing "Setup Guide" banners or placeholder graphics.
- **Rule Name Resolution**: When listing top rules, join or fetch rule names to avoid showing UUIDs. Since rules can be deleted, handle null/missing rule names gracefully in `MatchEvent` aggregation.
