# Feature Specification: Plan Limit Storefront Gating

## Affected Domains
- Billing
- PetProfiles (Interface Layer/Routes)

## 1. Database Schema Changes (Prisma)
No database schema changes required. We will use existing `Session.matchCount` and `Session.plan` fields.

## 2. Domain Service Interface (Public API)
We will utilize the existing `BillingService.isUnderLimit(shop: string)` in `app/modules/Billing/index.ts`.

Verification of `BillingService.isUnderLimit`:
```typescript
async isUnderLimit(shop: string) {
  const session = await BillingDb.getSession(shop);
  if (!session) return false;

  const plan = (session.plan as SubscriptionPlan) || "FREE";
  const limits = PLAN_CONFIGS[plan];

  if (limits.maxMatches === 0) return true; // Unlimited
  return session.matchCount < limits.maxMatches;
}
```

## 3. Interface Layer Requirements (Routes)
The Storefront App Proxy route [`app/routes/app.pet-profiles.tsx`](app/routes/app.pet-profiles.tsx) must be updated to check the billing status before returning any data.

### Loader Strategy
- Authenticate the App Proxy request.
- Call `BillingService.isUnderLimit(session.shop)`.
- If the limit is reached, return an empty payload or a specific status that indicates the feature is disabled.
- The requirement is "shouldn't show customers anything", so we will return an empty response that prevents the UI from rendering.

```typescript
// Proposed Loader Logic in app.pet-profiles.tsx
const isUnderLimit = await BillingService.isUnderLimit(session.shop);
if (!isUnderLimit) {
  return jsonResponse({ 
    profiles: [], 
    matches: [], 
    settings: { types: [] }, 
    disabled: true 
  });
}
```

### Action Strategy
- For actions (create/update/delete/set_active), we should also gate them if the limit is reached to prevent circumventing the UI gating.
- However, since "matching" is the primary usage metric, we must ensure `recordMatch` is called only when appropriate, but the gating should happen at the entry point of the proxy.

## 4. Constraints & Edge Cases
- **Billing Gating**: Primary constraint. If `matchCount >= maxMatches`, storefront features are hidden.
- **Performance**: The check is a simple DB lookup on the `Session` table, which is already hit by `authenticate.public.appProxy`. We might want to optimize `BillingDb.getSession` if it's not already cached or efficient.
- **Customer Experience**: When the limit is reached, the "Match Badge" and "Pet Form" will effectively disappear from the storefront as they won't receive data to render.
