# Feature Specification: Unified Listings Revamp (PetProfiles & ProductRules)

## Affected Domains
- PetProfiles
- ProductRules

## 1. Database Schema Changes (Prisma)
*No schema changes required.* We are enhancing the query capabilities.

## 2. Domain Service Interface (Public API)

### PetProfiles (`app/modules/PetProfiles/index.ts`)
- Update `getAllProfiles` to support searching.
```typescript
getAllProfiles: async (
  shop: string, 
  options?: { 
    sortKey?: string, 
    sortDirection?: "asc" | "desc",
    query?: string, // New: Search query
    page?: number,  // New: Pagination
    limit?: number  // New: Pagination
  }
): Promise<{ profiles: PetProfile[], totalCount: number }> // Updated return type
```

### ProductRules (`app/modules/ProductRules/index.ts`)
- Update `getRules` to support searching.
```typescript
getRules: async (
  shop: string, 
  options?: RuleListOptions // Update RuleListOptions to include query: string
): Promise<{ rules: ProductRule[], totalCount: number }>
```

## 3. Interface Layer Requirements (Routes)

### Common Listing Components (Filters & Actions)
Both pages will implement a unified `IndexFilters` setup from Polaris:
- **Search:** `query` search parameter for text-based filtering.
- **Sorting:** `sortKey` and `sortDirection` parameters.
- **Bulk Actions:** Delete selected items.
- **Individual Actions:** Edit and Delete buttons in each row.

### Pet Profiles Admin (`app/routes/app.pet-profiles-admin.tsx`)
- **Loader Strategy:**
  - Parallel fetch: `PetProfileService.getAllProfiles` (with search/sort) + Shopify Customer data.
- **Action Strategy:**
  - Handle `delete` (single) and `bulk_delete` actions.
  - Handle `edit` (redirect to a new edit route if needed, or inline modal - *Decision: Use separate edit route if possible for consistency, but for now simple Pet Profile edit might need a new route `app.pet-profiles.$id.tsx`*).

### Product Rules (`app/routes/app.rules._index.tsx`)
- **Revamp:** Align styling with the new `IndexFilters` pattern.
- **Search:** Implement `query` parameter handling in the loader and service.

## 4. Constraints & Edge Cases
- **Pagination:** Both listings must handle pagination consistently.
- **Empty States:** Maintain clear empty states for "No results found" vs "No items created".
- **Performance:** Ensure Prisma queries for search are efficient (using `contains` with `mode: 'insensitive'`).
