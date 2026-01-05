# Feature Specification: All-Match Fallback for Untargeted Products

## Affected Domains
- `ProductRules`
- `PetProfiles`

## 1. Database Schema Changes (Prisma)
No changes required.

## 2. Domain Service Interface (Public API)

### `app/modules/ProductRules/index.ts`
- Update `getMatchedProductsForPet` to include products that are not targeted by ANY active rule.
- Update `isRuleMatch` (internal helper) if necessary, or add a new logic branch in `getMatchedProductsForPet`.

### `app/modules/PetProfiles/internal/matcher.ts`
- Update `match` to include products not targeted by any active rule.
- Update `isProductMatched` to return `true` if no active rules exist for the given `productId`.

## 3. Interface Layer Requirements (Routes)
- No changes required to routes, as they depend on the domain services which will now handle the fallback logic.

## 4. Constraints & Edge Cases
- **Rule of 100**: Fallback logic should not significantly impact performance. We should efficiently identify untargeted products.
- **Active Rules Only**: Only active rules should be considered when determining if a product is "targeted".
- **Global Match**: If a product has NO rules, it matches EVERY pet. If it has at least one active rule, it ONLY matches when those rules are satisfied.
- **Analytics**: Matches via fallback (no rules) might not need to record `matchedRuleId` since no rule was involved, but `SessionService.incrementMatchCount` should still be called if we consider this a successful "match" experience. However, standard Shopify practice is to only count explicit matches. *Decision: Untargeted matches do NOT trigger Analytics or Billing increments to avoid inflating usage on default behavior.*
