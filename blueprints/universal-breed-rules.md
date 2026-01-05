# Feature Specification: Universal Breed Rules

Allow merchants to create product rules that apply to all breeds within a pet type (or all breeds across all types) by leaving the breed selection empty.

## Affected Domains
- **ProductRules**: Update matching logic and type definitions.
- **PetProfiles**: Update `MatcherService` to align with the universal breed logic.

## 1. Database Schema Changes (Prisma)
No changes required. The current `String` (JSON-stringified) `conditions` field in `ProductRule` already supports empty arrays.

## 2. Domain Service Interface (Public API)
Update `isRuleMatch` in `app/modules/ProductRules/index.ts` and `evaluateConditions` in `app/modules/PetProfiles/internal/matcher.ts`.

### `app/modules/ProductRules/index.ts`
```typescript
function isRuleMatch(conditions: RuleConditions, pet: any): boolean {
  // 1. Pet Type Match (OR logic: if conditions.petTypes is empty, it matches all)
  if (conditions.petTypes.length > 0 && !conditions.petTypes.includes(pet.type)) {
    return false;
  }

  // 2. Breed Match (OR logic: if conditions.breeds is empty, it matches all)
  if (conditions.breeds.length > 0 && !conditions.breeds.includes(pet.breed)) {
    return false;
  }

  return true;
}
```

## 3. Interface Layer Requirements (Routes)
- **Route**: `app/routes/app.rules.$id.tsx`
- **Behavior**: Ensure the UI reflects that an empty breed selection means "All Breeds". (Handled by Constructor during UI implementation).

## 4. Constraints & Edge Cases
- **Priority**: A rule with a specific breed should likely have a higher priority than an "All Breeds" rule if they target the same products. Merchants manage this via the `priority` field.
- **Data Integrity**: Ensure that existing rules with empty `breeds` arrays now start matching all breeds (this is the intended "Make it so" behavior).
