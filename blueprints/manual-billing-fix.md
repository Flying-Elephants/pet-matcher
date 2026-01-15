# Feature Specification: Manual Billing API Integration

## Affected Domains
- Billing

## 1. Database Schema Changes (Prisma)
No changes required to schema. Usage of existing `Subscription` or billing state should remain consistent.

## 2. Domain Service Interface (Public API)
Define function signatures for [`app/modules/Billing/index.ts`](app/modules/Billing/index.ts).

```typescript
// Existing or new signatures
export const BillingService = {
  checkSubscription: (shop: string) => Promise<SubscriptionStatus>,
  requestUpgrade: (shop: string, planName: 'GROWTH') => Promise<string>, // returns confirmation URL
  cancelSubscription: (shop: string) => Promise<void>,
};
```

## 3. Interface Layer Requirements (Routes)
- **Loader Strategy**: `authenticate.admin(request)` to get `billing` and `admin` objects.
- **Action Strategy**: 
  1. Detect upgrade intent.
  2. Call `billing.request({ plan, isTest: true })` using the managed billing API configured in `shopify.server.ts`.
  3. If "Managed Pricing" error persists, fallback to manual `appSubscriptionCreate` GraphQL mutation via `admin.graphql`.

## 4. Constraints & Edge Cases
- **Managed Pricing Error**: This error usually occurs when the app is set to "Managed Pricing" in the Shopify Partner Dashboard, but the code tries to use the Billing API manually, OR when the app is NOT configured with a billing plan in `shopifyApp` configuration but tries to use `billing` helper.
- **Fix Strategy**: 
    - Define plans explicitly in [`app/shopify.server.ts`](app/shopify.server.ts).
    - Use `BillingInterval.Every30Days` for Growth plan ($9.99/month).
    - Ensure `appSubscriptionCreate` is used for the manual trigger.

## 5. Implementation Plan
1. Update [`app/shopify.server.ts`](app/shopify.server.ts) to include the `billing` configuration block.
2. Ensure the Growth plan is defined with the correct price and interval.
3. Update the Billing route to trigger the upgrade flow correctly.
