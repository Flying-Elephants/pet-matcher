# Feature Specification: Analytics Platform Pivot

## Affected Domains
- Analytics
- PetProfiles (Data Provider)

## 1. Database Schema Changes (Prisma)
```prisma
// New model for tracking historical matching events
model MatchEvent {
  id        String   @id @default(uuid())
  shop      String
  profileId String
  ruleId    String
  createdAt DateTime @default(now())

  @@index([shop])
  @@index([shop, createdAt])
}
```

## 2. Domain Service Interface (Public API)
File: `app/modules/Analytics/index.ts`
```typescript
export interface BreedDistribution {
  breed: string;
  count: number;
}

export interface LongitudinalData {
  date: string;
  matchCount: number;
}

export const AnalyticsService = {
  getSummary: async (shop: string): Promise<SummaryData>,
  getBreedDemographics: async (shop: string): Promise<BreedDistribution[]>,
  getHistoricalMatches: async (shop: string, days: number): Promise<LongitudinalData[]>,
  recordMatch: async (shop: string, profileId: string, ruleId: string): Promise<void>
};
```

## 3. Interface Layer Requirements (Routes)
- **Dashboard (`app._index.tsx`)**: Update to use `getBreedDemographics` for a "Popular Breeds" visualization.
- **Reporting (`app.analytics.tsx`)**: New route (Phase 2) to show the longitudinal graph of matching activity.

## 4. Constraints & Edge Cases
- **Rule of 100**: Aggregations should be performed on the database level (SQL `GROUP BY`) rather than fetching all records and processing in JS.
- **Data Retention**: Match events older than 90 days may be archived or aggregated to keep the `MatchEvent` table performant (Optimizer directive).
