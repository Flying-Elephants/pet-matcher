# Feature Specification: Weight Normalization and Conversion

Standardize weight storage to Grams across all domains (PetProfiles and ProductRules) while allowing users to input and view weights in their preferred unit (KG or LBS).

## Affected Domains
- **Core**: Provides shared weight conversion utilities.
- **ProductRules**: UI layer must convert values when loading (Grams -> Unit) and saving (Unit -> Grams).
- **PetProfiles**: (Verification) Already handles normalization in the storefront extension, but admin UI needs to be checked.

## 1. Database Schema Changes (Prisma)
No changes required. 
- `PetProfile.weightGram` (Int) is already in grams.
- `ProductRule.conditions` (JSON) will now consistently store `weightRange.min/max` in grams.

## 2. Domain Service Interface (Public API)
### `app/modules/Core/WeightUtils.ts`
```typescript
export const WeightUtils = {
  KG_TO_GRAMS: 1000,
  LBS_TO_GRAMS: 453.592,

  toGrams(value: number | null | undefined, unit: 'kg' | 'lbs'): number | null {
    if (value === null || value === undefined) return null;
    const factor = unit === 'kg' ? this.KG_TO_GRAMS : this.LBS_TO_GRAMS;
    return Math.round(value * factor);
  },

  fromGrams(grams: number | null | undefined, unit: 'kg' | 'lbs'): number | null {
    if (grams === null || grams === undefined) return null;
    const factor = unit === 'kg' ? this.KG_TO_GRAMS : this.LBS_TO_GRAMS;
    const value = grams / factor;
    return unit === 'kg' ? Math.round(value * 10) / 10 : Math.round(value * 10) / 10; // 1 decimal place
  },

  format(grams: number | null | undefined, unit: 'kg' | 'lbs'): string {
    const value = this.fromGrams(grams, unit);
    if (value === null) return 'N/A';
    return `${value} ${unit}`;
  }
};
```

## 3. Interface Layer Requirements (Routes)

### `app/routes/app.rules.$id.tsx`
- **Loading**:
  ```typescript
  const weightMin = WeightUtils.fromGrams(rule?.conditions.weightRange?.min, settings.weightUnit);
  const weightMax = WeightUtils.fromGrams(rule?.conditions.weightRange?.max, settings.weightUnit);
  ```
- **Saving**:
  ```typescript
  weightRange: {
    min: weightMin ? WeightUtils.toGrams(parseFloat(weightMin), settings.weightUnit) : null,
    max: weightMax ? WeightUtils.toGrams(parseFloat(weightMax), settings.weightUnit) : null,
  }
  ```

### `app/routes/app.rules._index.tsx`
- **Display**:
  ```typescript
  const formattedMin = WeightUtils.fromGrams(conditions.weightRange.min, weightUnit);
  const formattedMax = WeightUtils.fromGrams(conditions.weightRange.max, weightUnit);
  ```

## 4. Constraints & Edge Cases
- **Precision**: 453.592 is used for LBS conversion to match common standards.
- **Rounding**: Grams are always stored as Integers. Display values are rounded to 1 decimal place.
- **Migration**: Existing rules stored in raw units (e.g., "5" for 5kg) will be interpreted as "5 grams" unless a data migration is performed. *Recommendation: User should re-save rules or we provide a one-time migration script if production data exists.*
