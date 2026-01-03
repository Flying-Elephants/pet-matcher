# Feature Specification: Pet Profile Theme Extension

## Affected Domains
- PetProfiles (Primary)
- Analytics (Secondary - tracking creations/updates)

## 1. Database Schema Changes (Prisma)
No changes required to [`prisma/schema.prisma`](prisma/schema.prisma). The existing `PetProfile` model already supports `shopifyId` (Customer ID), `name`, `breed`, `birthday`, and dynamic `attributes`.

```prisma
model PetProfile {
  id          String   @id @default(uuid())
  shop        String
  shopifyId   String   // ID of the customer in Shopify
  name        String
  breed       String
  birthday    DateTime? 
  attributes  String   // JSON string
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([shop])
}
```

## 2. Domain Service Interface (Public API)
Enhance [`app/modules/PetProfiles/index.ts`](app/modules/PetProfiles/index.ts) to include update and single-fetch capabilities.

```typescript
// app/modules/PetProfiles/index.ts

export const PetProfileService = {
  // Existing...
  getProfiles: (shop: string, customerId: string) => Promise<PetProfile[]>,
  
  // New/Enhanced
  getProfile: (shop: string, profileId: string) => Promise<PetProfile | null>,
  updateProfile: (shop: string, profileId: string, data: Partial<PetProfile>) => Promise<PetProfile>,
  // ... create/delete as existing
}
```

## 3. Interface Layer Requirements (Theme Extension)

### 3.1 App Block Structure
- **File**: `extensions/pet-profile-form/blocks/pet_form.liquid`
- **Logic**:
  - Fetch existing profiles via a new Public API endpoint (or App Proxy).
  - Provide a form for Name, Breed, and Birthday.
  - Submit via `fetch` to an App Proxy route.

### 3.2 App Proxy Routes (React Router v7)
- **Route**: `app/routes/proxy.pet-profiles.tsx`
- **GET**: Returns JSON list of profiles for the authenticated customer.
- **POST/PUT/DELETE**: Handle CRUD operations.
- **Security**: Verify `logged_in_customer_id` from Shopify App Proxy headers.

## 4. Constraints & Edge Cases
- **Customer Authentication**: Form must only show for logged-in customers. Liquid check: `{% if customer %}`.
- **Validation**:
  - Breed must match shop's allowed breeds (configurable in App Metafields/Settings).
  - Max 5 pets per customer (Configurable "Rule of 100" scaling limit).
- **GDPR**: Profiles must be deleted when the customer requests data deletion (already handled by `deleteCustomerData`).
