# Feature Specification: Fix Billing Test Mode & Manual Fallback

## Affected Domains
- Billing

## 1. Database Schema Changes (Prisma)
No changes required.

## 2. Domain Service Interface (Public API)
No changes to public API signatures.

## 3. Interface Layer Requirements (Internal Implementation)

### `app/modules/Billing/internal/shopify.ts`

1.  **Dynamic Test Mode**:
    - Change `isTest: false` to be dynamic.
    - Use `process.env.SHOPIFY_BILLING_TEST === "true"` or default to `true` if `process.env.NODE_ENV === "development"`.
    - **Critical**: Since the user is in a "submission draft" (likely production build on a dev store), we might need an explicit flag or just default to `true` for this fix until published.

2.  **Manual Mutation Fallback**:
    - Implement the `appSubscriptionCreate` mutation as a fallback if `billing.request` fails.
    - This addresses "Managed Pricing" errors where the app config doesn't match the code expectations.

```typescript
// Proposed logic for createSubscription
try {
  return await billing.request({
    plan: shopifyPlanName,
    returnUrl,
    isTest: true, // Force test for now or use env var
  });
} catch (error) {
  // If managed billing fails, try manual mutation
  return await createSubscriptionMutation(admin, shopifyPlanName, returnUrl, true);
}
```

## 4. Constraints & Edge Cases
- **Production Safety**: Ensure we don't accidentally enable test charges in production once live. We should likely use an Environment Variable `SHOPIFY_BILLING_TEST`.
- **Managed Pricing**: If the app is set to "Managed Pricing" in the Partner Dashboard, `billing.request` is the preferred path. The fallback is for "Manual" pricing configuration.

## 5. Implementation Plan
1.  Modify `app/modules/Billing/internal/shopify.ts` to implement the `try/catch` block with fallback.
2.  Implement `createSubscriptionMutation` helper function in the same file.
3.  Set `isTest` to `true` (or dynamic) to unblock the user on the development store.
