# Feature Specification: GDPR Compliance & Mandatory Webhooks

## Affected Domains
- PetProfiles
- Core (Session Management)

## 1. Database Schema Changes (Prisma)
No direct schema changes required, but deletion logic must respect foreign key constraints (cascading deletes for `PetProfile` records linked to a `Shop`).

## 2. Domain Service Interface (Public API)
File: `app/modules/PetProfiles/index.ts`
```typescript
export const PetProfileService = {
  // ... existing methods
  async deleteShopData(shop: string): Promise<void>,
  async deleteCustomerData(shop: string, customerId: string): Promise<void>
};
```

## 3. Interface Layer Requirements (Routes)
File: `app/routes/webhooks.privacy.tsx`
- **Loader Strategy**: N/A (Webhooks are POST only).
- **Action Strategy**: 
  - `CUSTOMERS_DATA_REQUEST`: Return JSON acknowledgment.
  - `CUSTOMERS_REDACT`: Call `PetProfileService.deleteCustomerData`.
  - `SHOP_REDACT`: Call `PetProfileService.deleteShopData` and `SessionService.deleteSession`.

## 4. Constraints & Edge Cases
- **Verification**: Must use `authenticate.webhook(request)` to ensure the request is from Shopify.
- **Payload Mapping**: `CUSTOMERS_REDACT` payload includes `customer.id`. This must map to our `PetProfile.shopifyId`.
- **Latency**: Webhooks must return 200 OK within 2 seconds. Move heavy deletion logic to an internal background job if necessary (Phase 3).
