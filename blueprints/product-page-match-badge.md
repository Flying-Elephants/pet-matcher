# Feature Specification: Product Page Match Badge

## Affected Domains
- `PetProfiles`
- `ProductRules`
- `Analytics`
- `Billing`

## 1. Database Schema Changes (Prisma)
No changes required. The current schema supports `PetProfile`, `ProductRule`, and the relationship via `SyncedProduct` (represented in `ProductRule.productIds`).

## 2. Domain Service Interface (Public API)

### `app/modules/PetProfiles/index.ts`
```typescript
export const PetProfileService = {
  // ... existing methods
  
  /**
   * Evaluates product matching for all pets belonging to a customer.
   * Returns an array of results with match status.
   */
  getMatchesForProduct: async (
    shop: string,
    customerId: string,
    productId: string
  ): Promise<{ pet: PetProfile; isMatched: boolean }[]> => {
     // Implementation logic:
     // 1. Fetch all customer pets
     // 2. Fetch all active product rules for the shop
     // 3. Use MatcherService.isProductMatched for each pet
  }
};
```

### `app/modules/PetProfiles/internal/matcher.ts`
```typescript
export const MatcherService = {
  // ... existing match method
  
  /**
   * Optimized check for a single product match against a specific pet profile.
   * Triggers billing usage and analytics on success.
   */
  async isProductMatched(
    profile: PetProfile,
    rules: ProductRule[],
    productId: string
  ): Promise<boolean> {
    // 1. Billing Gate check (reuse existing logic from match)
    // 2. Filter/Sort rules by priority
    // 3. For each rule:
    //    if evaluateConditions(profile, rule.conditions) AND rule.productIds.includes(productId):
    //      - Record Match Analytics
    //      - Increment Billing Usage
    //      - return true
    // 4. return false
  }
};
```

## 3. Interface Layer Requirements (Routes & Extensions)

### App Proxy (`app/routes/proxy.pet-profiles.tsx`)
- **Loader**:
  - Accept optional `product_id` query parameter.
  - If `product_id` exists, call `PetProfileService.getMatchesForProduct`.
  - Response format:
    ```json
    {
      "profiles": [...],
      "matches": [
        { "petId": "uuid", "isMatched": true },
        ...
      ]
    }
    ```

### Theme App Extension
- **New Block**: `extensions/pet-profile-form/blocks/product_match_badge.liquid`
  - **Target**: `product`
  - **Functionality**: Renders a "Matched for [Pet Name]" badge.
  - **Settings**:
    - `show_non_matches` (Boolean): If true, shows "Not a match" for other pets.
    - `match_icon` (Text): Default "✅".
    - `colors`: Customizable for match/no-match states.
- **New Asset**: `extensions/pet-profile-form/assets/product-match-badge.js`
  - Fetch logic using standard `fetch` to the App Proxy.
  - Hydrate the Liquid block with dynamic pet data.

## 4. Constraints & Edge Cases
- **Billing Gating**: If the shop's match limit is reached (e.g., 50 for FREE), matching logic should return `false` or a specific status to prevent free usage beyond limits.
- **Privacy**: Customer ID must be verified via Shopify App Proxy authentication headers.
- **Performance**: Matcher logic is O(N) where N is number of rules (usually < 100). "Rule of 100" applies.
