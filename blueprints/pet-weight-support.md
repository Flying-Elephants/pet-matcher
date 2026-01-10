# Feature Specification: Pet Weight Support

Adding weight support to Pet Profiles and Product Rules. Weight will be stored in grams for consistency, with unit conversion (kg/lbs) handled at the interface layer based on merchant settings.

## Affected Domains
- PetProfiles (Weight storage, Settings)
- ProductRules (Weight-based matching conditions)

## 1. Database Schema Changes (Prisma)

```prisma
// app/modules/PetProfiles/internal/schema.prisma (Reference)
model PetProfile {
  // ... existing fields
  weightGram  Int?     // New field: Stored in grams
}

model PetProfileSettings {
  // ... existing fields
  weightUnit  String   @default("kg") // "kg" or "lbs"
}

// app/modules/ProductRules/internal/schema.prisma (Reference)
// No direct schema changes to ProductRule table as conditions are stored in a JSON string (SQLite)
// But RuleConditions schema in code will change.
```

## 2. Domain Service Interface (Public API)

### PetProfiles Domain ([`app/modules/PetProfiles/index.ts`](app/modules/PetProfiles/index.ts))
- `getSettings(shop: string): Promise<PetSettings>`: Will now return `weightUnit`.
- `updateSettings(shop: string, settings: PetSettings): Promise<PetSettings>`: Will now accept `weightUnit`.
- `createProfile(shop: string, data: CreatePetProfileInput)`: Will now include `weightGram`.
- `updateProfile(shop: string, id: string, data: UpdatePetProfileInput)`: Will now include `weightGram`.

### ProductRules Domain ([`app/modules/ProductRules/index.ts`](app/modules/ProductRules/index.ts))
- `RuleConditions` type updated:
```typescript
export interface RuleConditions {
  petTypes: string[];
  breeds: string[];
  weightRange?: {
    min?: number; // in grams
    max?: number; // in grams
  };
}
```
- `isRuleMatch(conditions: RuleConditions, pet: PetProfile)`: Updated to check `pet.weightGram` against `conditions.weightRange`.

## 3. Interface Layer Requirements (Routes)

### Admin Settings ([`app/routes/app.settings.tsx`](app/routes/app.settings.tsx))
- Add a choice for "Weight Unit" (Kilograms / Pounds).
- Persistence via `PetProfileService.updateSettings`.

### Rule Management ([`app/routes/app.rules.$id.tsx`](app/routes/app.rules.$id.tsx))
- Add Weight Range fields (Min/Max).
- Unit conversion: Display labels as "kg" or "lbs" based on settings.
- Input values converted to grams before saving.

### Storefront Profile Form ([`extensions/pet-profile-form/blocks/pet_form.liquid`](extensions/pet-profile-form/blocks/pet_form.liquid))
- Add weight input field.
- Add unit selector (kg/lbs) – note: the requirement says "kilo mu lbs mi olacağı seçilebilmeli". This value will be converted to grams on the backend/proxy before saving to `weightGram`.

## 4. Constraints & Edge Cases
- **Null Handling**: Weight is optional. If a rule has a weight range but the pet has no weight, it should NOT match (or as per business logic, usually "does not match" if a specific requirement is set).
- **Conversion Precision**: Use 1 kg = 1000g and 1 lbs = 453.59g (round to nearest integer for DB).
- **Validation**: Ensure `min <= max` if both are provided.
