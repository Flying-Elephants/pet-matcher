# Feature Specification: Open Beta Transition

## Affected Domains
- Billing
- Interface (Dashboard)

## 1. Database Schema Changes (Prisma)
No schema changes required. We are bypassing the database for billing checks.

## 2. Domain Service Interface (Public API)

### `app/modules/Billing/index.ts`

**Modifications:**
- `getSubscriptionStatus`: FORCE return `ENTERPRISE` plan and limits. Bypass DB and Shopify sync.
- `syncSubscription`: Make no-op (return "FREE").
- `upgrade`: Throw error or log "Billing disabled in Open Beta".
- `cancelSubscription`: Make no-op.
- `requirePlan`: Always return `Promise<void>` (allow access).
- `canUseFeature`: Always return `true`.
- `isUnderLimit`: Always return `true`.

## 3. Interface Layer Requirements (Routes)

### `app/routes/app.billing.tsx`
- **Loader**: Return static "Open Beta" status.
- **Action**: Disable all billing actions.
- **UI**:
    - Remove Pricing Cards.
    - Remove Usage Overview (or keep it but show Unlimited).
    - Add `Banner` (tone="info"): "Pet Matcher is currently in Open Beta. All features are free to use. Billing will be introduced in the future."

### `app/routes/app._index.tsx` (Dashboard)
- **UI**:
    - Add `Banner` (tone="info") at the top of the page.
    - Content: "Welcome to Open Beta! Enjoy unlimited access to all features while we refine the platform."

## 4. Constraints & Edge Cases
- **Existing Subscriptions**: If any users have active subscriptions, we are effectively ignoring them. Since we are in development/pre-launch, this is acceptable.
- **Future Reversion**: We will need to revert these changes to re-enable billing.
