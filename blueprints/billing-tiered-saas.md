# Feature Specification: Tiered SaaS Billing

## Affected Domains
- Billing

## 1. Database Schema Changes (Prisma)
```prisma
// Update Session model to track current plan and usage
model Session {
  id          String    @id
  shop        String    @unique
  state       String
  isOnline    Boolean   @default(false)
  scope       String?
  expires     DateTime?
  accessToken String
  userId      BigInt?
  plan        String    @default("FREE") // "FREE", "GROWTH", "ENTERPRISE"
  matchCount  Int       @default(0)      // Monthly usage tracking
}
```

## 2. Domain Service Interface (Public API)
File: `app/modules/Billing/index.ts`

```typescript
export type SubscriptionPlan = "FREE" | "GROWTH" | "ENTERPRISE";

export interface PlanLimits {
  maxMatches: number;
  maxRules: number;
  features: string[];
}

export const BillingService = {
  // Check if shop has access to a specific feature or limit
  async getSubscription(admin: AdminApiContext): Promise<{
    plan: SubscriptionPlan;
    usage: number;
    limits: PlanLimits;
  }>,

  // Create a new subscription/upgrade
  async upgrade(admin: AdminApiContext, plan: SubscriptionPlan, returnUrl: string): Promise<string>,

  // Record usage (e.g., when a match is generated)
  async incrementUsage(shop: string): Promise<void>
};
```

## 3. Interface Layer Requirements (Routes)
- **Loader Strategy**: Dashboard (`app._index.tsx`) must fetch subscription status to show "Usage Bars" or "Upgrade" prompts.
- **Action Strategy**: Mutation in `app.settings.billing.tsx` to initiate Shopify App Subscription flow using `BillingService.upgrade`.

## 4. Constraints & Edge Cases
- **Billing Gating**: The `MatcherService` must check `matchCount` against the plan's `maxMatches` before executing logic.
- **Free Tier Cap**: "Shelter Basics" capped at 50 matches.
- **Enterprise Logic**: "Best in Show" ($49/mo) unlocks Klaviyo sync (future Phase).
