# Feature Specification: Routing and Pet Profile Listing Fix

## Affected Domains
- ProductRules (Routing)
- PetProfiles (Admin UI)

## 1. Database Schema Changes (Prisma)
No changes required.

## 2. Domain Service Interface (Public API)
No changes required. Existing `PetProfileService.getProfilesByShop` or similar will be used.

## 3. Interface Layer Requirements (Routes)

### A. Dashboard Fix (`app/routes/app.dashboard.tsx`)
- Change "Create New Rule" button `url` from `/app/rules/new` to `/app/rules/create` (or whatever matches `app.rules.$id.tsx` logic if it handles "new"). 
- Actually, looking at `app.rules.$id.tsx`, if it's a dynamic route, we should check if it handles "new".
- Fix "View Pet Profiles" button `url` from `/app/pet-profiles` to `/app/pet-profiles-admin` (to be created) or similar.

### B. New Admin Pet Profiles Route (`app/routes/app.pet-profiles-admin.tsx`)
- Purpose: Display a list of all pet profiles collected for the shop.
- Loader: `authenticate.admin(request)` -> `PetProfileService.getAllProfiles(shop)`.
- UI: Polaris `IndexTable` showing Name, Type, Breed, Customer ID, and Date Created.

### C. App Navigation (`app/routes/app.tsx`)
- Add "Pet Profiles" to `ui-nav-menu`.

## 4. Constraints & Edge Cases
- **Customer Privacy**: Admin view should only show necessary customer info (Shopify Customer ID).
- **Performance**: Use pagination for pet profiles listing if count exceeds 50.
