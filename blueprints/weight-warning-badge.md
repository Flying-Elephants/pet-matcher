# Feature Specification: Weight Requirement Warning

## Affected Domains
- `PetProfiles` (Matcher Service)
- `ProductRules` (Implicitly through rules)

## 1. Database Schema Changes (Prisma)
No changes required. Existing fields `PetProfile.weight` and `ProductRule.minWeight`/`maxWeight` are sufficient.

## 2. Domain Service Interface (Public API)
Update the internal matching logic and public return type to support warning flags.

### `app/modules/PetProfiles/core/types.ts`
```typescript
export interface MatchResult {
  petId: string;
  isMatched: boolean;
  warnings: string[];
}
```

### `app/modules/PetProfiles/index.ts`
Update `getMatchesForProduct` signature:
```typescript
async getMatchesForProduct(customerId: string, productId: string): Promise<{ profiles: PetProfile[], matches: MatchResult[] }>
```

### `app/modules/PetProfiles/internal/matcher.ts`
Refactor `matchPetToProduct` to return `{ isMatched: boolean, warnings: string[] }`.

Logic:
- If `rule.minWeight` or `rule.maxWeight` is defined AND `pet.weight` is `null`:
  - `isMatched = false`
  - `warnings.push("MISSING_WEIGHT")`

## 3. Interface Layer Requirements (Routes)

### App Proxy (`app/routes/app.pet-profiles.tsx`)
- Loader passes through the new `MatchResult` structure with `warnings`.

### Theme Extension
- **File**: `extensions/pet-profile-form/assets/product_match_badge.js`
- **Logic**: In `renderMatches`, if `pet.warnings` contains `"MISSING_WEIGHT"`, append a warning message under the pet's badge item.
- **Message**: "This product has weight (size) rules. Please be careful when purchasing, or update your pet profile with weight information for a better match."

- **File**: `extensions/pet-profile-form/assets/pet-profile-form.css`
- **Styles**: Add `.pp-match-warning` styling (e.g., orange text, small font, top margin).

## 4. Constraints & Edge Cases
- **Localization**: While `en.default.json` is currently empty, hardcoding the English message in JS is acceptable for now given the current project state, or it can be added to the JSON.
- **Multiple Rules**: If any rule for the product has a weight requirement, the warning triggers if the pet is missing weight.
