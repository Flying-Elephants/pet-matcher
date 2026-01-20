# Feature Specification: Billing Revamp (Tiered SaaS)

## Affected Domains
- **Billing**
- **Core** (Shopify Configuration)
- **ProductRules** (Gating)
- **PetProfiles** (Gating)

## 1. Business Logic & Plans

| Plan Name | Price | Match Limit | Rule Limit | Features |
|-----------|-------|-------------|------------|----------|
| **FREE** | $0 | 50 / mo | 5 | Basic Analytics |
| **GROWTH** | $9.99 | 500 / mo | 25 | Klaviyo Sync (Basic) |
| **ENTERPRISE** | $29.99 | Unlimited | 100 | Priority Support, Adv. Analytics |

## 2. Database Schema Changes (Prisma)
*No structural changes required. Existing `Session` model supports these fields.*
```prisma
model Session {
  // ... existing fields
  plan        String    @default("FREE") 
  matchCount  Int       @default(0)
}
```

## 3. Core Configuration (`app/shopify.server.ts`)
Must define multiple billing plans in the Shopify App config.

```typescript
export const PLAN_GROWTH = "Growth Plan";
export const PLAN_ENTERPRISE = "Enterprise Plan";

export const billingConfig = {
  [PLAN_GROWTH]: {
    amount: 9.99,
    currencyCode: "USD",
    interval: BillingInterval.Every30Days,
  },
  [PLAN_ENTERPRISE]: {
    amount: 29.99,
    currencyCode: "USD",
    interval: BillingInterval.Every30Days,
  }
};
// Note: FREE plan is implicit (absence of active subscription)
```

## 4. Domain Service Interface (`app/modules/Billing`)

### `core/types.ts`
Update configuration constants to match new business rules.

```typescript
export const PLAN_CONFIGS: Record<SubscriptionPlan, PlanLimits> = {
  FREE: { maxMatches: 50, maxRules: 5, features: { ... } },
  GROWTH: { maxMatches: 500, maxRules: 25, features: { ... } },
  ENTERPRISE: { maxMatches: 0, maxRules: 100, features: { ... } }, // 0 = Unlimited
};
```

### `index.ts` (BillingService)
- `cancelSubscription(shop)`: Helper to cancel paid plans (downgrade to FREE).
- `requirePlan(shop, minPlan)`: Guard for routes that require specific tiers.

## 5. Interface Layer Requirements

### **Billing Page** (`app/routes/app.billing.tsx`)
- **Layout**: 3-Column Grid (Cards).
- **State**: Highlight current plan.
- **Actions**:
  - If Free: Show "Upgrade" buttons for Growth/Enterprise.
  - If Growth: Show "Downgrade" (Free) or "Upgrade" (Enterprise).
  - If Enterprise: Show "Downgrade" buttons.
- **Logic**: 
  - Upgrading calls `BillingService.upgrade` -> redirects to Shopify confirmation.
  - Downgrading to Free calls `BillingService.cancelSubscription` -> local DB update.

### **Dashboard** (`app/routes/app.dashboard.tsx`)
- **Usage Monitor**: Visual progress bar for Matches and Rules.
  - `(current / max) * 100`% width.
  - "Unlimited" for Enterprise Matches.
- **Warning**: Show alert if nearing limit (90%).

## 6. Constraints & Edge Cases
- **Monthly Reset**: A background job (or check on access) must reset `matchCount` every 30 days based on `billingOn` date. *Current implementation relies on naive monthly reset or manual check. We need to ensure `matchCount` resets.*
- **Upgrade/Downgrade Handling**: When switching plans, Shopify cancels the old one automatically. We must sync the new status immediately via webhook (`APP_SUBSCRIPTION_UPDATE`) or manual sync on return.
- **Plan Mismatches**: If Shopify says "Active" but DB says "Free", trust Shopify and update DB.

## 7. Webhook Requirement
Create `app/routes/webhooks.app.subscription_update.tsx` to handle background plan changes (e.g., if a user cancels via Shopify Admin).
- **Topic**: `APP_SUBSCRIPTION_UPDATE`
- **Action**: Call `BillingService.syncSubscription(shop)`

## 8. Implementation Steps
1.  **Config**: Update `app/shopify.server.ts` with new plans.
2.  **Types**: Update `app/modules/Billing/core/types.ts` with limits.
3.  **Service**: Implement `cancelSubscription` and `checkResetDate` in `BillingService`.
4.  **Webhook**: Create `app/routes/webhooks.app.subscription_update.tsx`.
5.  **UI**: Rewrite `app.billing.tsx` to use Polaris `PlanCard` or similar grid.
