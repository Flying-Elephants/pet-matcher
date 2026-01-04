# Feature Specification: Configurable Pet Attributes (Type & Breed)

## Affected Domains
- PetProfiles

## 1. Database Schema Changes (Prisma)
```prisma
model PetProfile {
  // ... existing fields
  type        String   @default("Dog") // New field
  breed       String   // Existing
  
  @@index([shop, type]) // New index
}

model PetProfileSettings {
  id          String   @id @default(uuid())
  shop        String   @unique
  config      String   // JSON: { types: [{ id: "dog", label: "Dog", breeds: [...] }] }
  updatedAt   DateTime @updatedAt
}
```

## 2. Domain Service Interface (Public API)
**Module:** `app/modules/PetProfiles/index.ts`

```typescript
// New Methods
getSettings(shop: string): Promise<PetSettings>;
updateSettings(shop: string, settings: PetSettings): Promise<PetSettings>;
```

**Caching Strategy:**
- `SettingsService` implements an in-memory `Map` cache with a 5-minute TTL.
- Storefront proxy requests serve cached settings to minimize DB hits.

## 3. Interface Layer Requirements (Routes)

### Admin: `app/routes/app.settings.tsx`
- **Loader:** Fetches `settings` via `PetProfileService`.
- **Action:** Updates `settings` JSON blob.
- **UI:** 
  - List of Pet Types (Add/Remove).
  - List of Breeds per Type (Tag input).
  - Built with Polaris `TextField`, `Tag`, `Box`.

### Storefront Proxy: `app/routes/proxy.pet-profiles.tsx`
- **Loader:** Returns `{ profiles, settings }`.
- **Action:** 
  - `create`: Validates `type` against schema.
  - `update`: Allows updating `type`.

### Theme Extension: `pet-profile-form`
- **Liquid:** Replaced text input for `breed` with dependent `<select>` elements for `type` and `breed`.
- **JS:** 
  - Fetches settings on init.
  - Dynamically populates "Breed" options when "Type" changes.
  - Enforces selection before submission.

## 4. Constraints & Edge Cases
- **Legacy Data:** Existing profiles default to "Dog" via Prisma `@default("Dog")`.
- **Deleted Types:** If a merchant deletes a Type/Breed that is in use, existing profiles are unaffected (strings are stored in `PetProfile`), but editing those profiles will require selecting a valid new option.
- **Performance:** JSON blob size is limited by SQLite string limit (ok for typical use case of < 100 breeds).
