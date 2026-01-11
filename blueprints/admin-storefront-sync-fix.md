# Feature Specification: Unified Admin-Storefront Communication & Data Consistency

## Affected Domains
- PetProfiles
- ProductRules

## 1. Database Schema Changes (Prisma)
*No direct schema changes required, but data migration for `isSelected` -> `isActive` mapping (conceptual) might be needed if renaming fields in DB, but we will stick to code alignment first.*

## 2. Domain Service Interface (Public API)
Refine `app/modules/PetProfiles/index.ts` to ensure consistency in active pet handling.

```typescript
// app/modules/PetProfiles/index.ts

export const PetProfileService = {
  // ... existing methods
  
  // Ensure we return consistent 'active' status
  getProfilesByCustomer: async (shop: string, customerId: string): Promise<PetProfile[]> => {
    const profiles = await PetProfileDb.findByCustomer(shop, customerId);
    return profiles.map(p => ({
      ...p,
      // Map DB 'isSelected' to 'isActive' for storefront consistency if needed, 
      // or standardize on 'isSelected' across both.
      isActive: p.isSelected 
    }));
  },
}
```

## 3. Interface Layer Requirements (Routes)

### App Proxy Handler (`app/routes/app.pet-profiles.tsx`)
- Standardize JSON response structure.
- Ensure `isActive` or `isSelected` is consistently used.
- Add robust error handling for malformed `FormData` from the extension.

### Theme App Extension (`extensions/pet-profile-form/assets/*.js`)
- **pet-profile-form.js**: 
  - Update `renderPetList` to handle `isSelected` or `isActive` consistently with the server.
  - Sync the `payload` structure with `PetProfileSchema` (ensure `shop` and `shopifyId` aren't expected from client if server injects them).
- **product_match_badge.js**:
  - Align `renderMatches` logic with the `MatchResult` interface from `PetProfiles/core/types.ts`.

## 4. Constraints & Edge Cases
- **Legacy Profiles**: Existing profiles might not have `isSelected` set. The service should default the first created profile to active if none are selected.
- **Weight Units**: Ensure the Storefront form respects the `weightUnit` from `PetSettings` (currently hardcoded to `kg` in some JS paths).
- **Concurrency**: Multiple badge loads on one page should be debounced or handled efficiently (Rule of 100).
