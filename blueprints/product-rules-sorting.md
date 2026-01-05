# Feature Specification: Product Rules Sorting

Enable sorting on the product rules list to allow merchants to easily manage large sets of rules by product, name, pet type, breed, or status.

## Affected Domains
- `ProductRules`

## 1. Database Schema Changes (Prisma)
No schema changes required. Prisma's `findMany` will be used with dynamic `orderBy`.

## 2. Domain Service Interface (Public API)
Update `app/modules/ProductRules/index.ts` to support sorting:

```typescript
// app/modules/ProductRules/core/types.ts
export type RuleSortKey = "name" | "priority" | "isActive" | "createdAt"; // Base fields
// Note: "product", "pet type", "breed" are stored in JSON strings (productIds, conditions)
// SQLite/Prisma won't sort by these directly in the DB.
// We will implement in-memory sorting for these specific complex fields or use standard DB sorting for others.

export interface RuleSortOptions {
  key: RuleSortKey;
  direction: "asc" | "desc";
}

// app/modules/ProductRules/index.ts
getRules: async (shop: string, sort?: RuleSortOptions): Promise<ProductRule[]>
```

## 3. Interface Layer Requirements (Routes)
- **Route**: `app/routes/app.rules._index.tsx`
- **Loader Strategy**: 
    - Extract `sortKey` and `sortDirection` from URL search parameters.
    - Pass sorting options to `ProductRuleService.getRules`.
- **UI Component**:
    - Replace `ResourceList` with `IndexTable` for better sorting support.
    - Implement `sortable` headings for Name, Priority, Status.
    - *Constraint*: For complex fields (Product, Pet Type, Breed) that are JSON-encoded in DB, we will implement client-side or in-memory sorting in the service layer as they cannot be efficiently sorted via SQL on a JSON string in SQLite.

## 4. Constraints & Edge Cases
- **Rule of 100**: In-memory sorting is acceptable since the platform enforces a limit of 100 rules per shop (to be added if not present).
- **Default Sort**: Default to `priority` DESC to maintain existing behavior.
- **Complexity**: Sorting by "Product" is difficult as `productIds` is a list. We will sort by the count of products or the first product title if joined (future optimization). For now, we'll focus on accessible fields.
