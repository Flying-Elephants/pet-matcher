# Feature Specification: Bulk Rule Deletion

## Affected Domains
- ProductRules

## 1. Database Schema Changes (Prisma)
No changes required. Using existing `productRule` model.

## 2. Domain Service Interface (Public API)
Define function signatures for `app/modules/ProductRules/index.ts`:

```typescript
// Add to ProductRuleService
deleteManyRules: async (shop: string, ids: string[]): Promise<void> => {
  return ProductRuleDb.deleteMany(shop, ids);
}
```

Define internal DB method in `app/modules/ProductRules/internal/db.ts`:

```typescript
// Add to ProductRuleDb
async deleteMany(shop: string, ids: string[]): Promise<void> {
  await db.productRule.deleteMany({
    where: {
      id: { in: ids },
      shop
    }
  });
}
```

## 3. Interface Layer Requirements (Routes)
- **Route**: `app/routes/app.rules._index.tsx`
- **Action Strategy**: 
    - Add `bulk_delete` action type.
    - Extract `ids` (JSON stringified array from form data).
    - Call `ProductRuleService.deleteManyRules`.
- **UI Strategy**:
    - Use `promotedBulkActions` in `IndexTable` to provide a "Delete rules" button when items are selected.
    - Use `confirm()` before triggering the deletion.

## 4. Constraints & Edge Cases
- **Empty selection**: Ensure the action doesn't fire if no rules are selected (Polaris handles visibility, but server should be robust).
- **Shop Boundary**: Always include `shop` in the `where` clause to prevent cross-tenant deletion.
- **Performance**: `deleteMany` in Prisma is efficient for the expected rule counts (Rule of 100).
