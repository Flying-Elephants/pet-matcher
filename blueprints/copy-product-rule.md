# Feature Specification: Copy Product Rule

Allow users to duplicate an existing product rule from the rules index page. The duplicated rule should have " (Copy)" appended to its name and the user should be automatically redirected to the edit page of the new rule.

## Affected Domains
- `ProductRules`

## 1. Database Schema Changes (Prisma)
No changes required. Existing `ProductRule` model supports the required fields.

## 2. Domain Service Interface (Public API)
Add `copyRule` to `app/modules/ProductRules/index.ts`:

```typescript
/**
 * Duplicates an existing rule.
 * Appends " (Copy)" to the name.
 * Returns the newly created rule.
 */
copyRule: async (shop: string, id: string): Promise<ProductRule> => {
  const original = await ProductRuleDb.findOne(shop, id);
  if (!original) throw new Error("Rule not found");

  const { id: _, createdAt: __, updatedAt: ___, ...rest } = original;
  return ProductRuleDb.upsert(shop, {
    ...rest,
    name: `${original.name} (Copy)`,
  });
}
```

## 3. Interface Layer Requirements (Routes)
### `app/routes/app.rules._index.tsx`
- **Action Strategy**: 
    - Handle `_action === "copy"`.
    - Call `ProductRuleService.copyRule(session.shop, id)`.
    - Redirect to `/app/rules/${newRule.id}`.
- **UI**:
    - Add a "Copy" button (or icon button) next to "Edit" in the `IndexTable`.

## 4. Constraints & Edge Cases
- **Billing Gating**: If there's a limit on the number of rules, copying should respect it (though not explicitly requested, standard behavior for this app).
- **Naming**: If multiple copies are made, it will result in "Name (Copy) (Copy)". This is acceptable for a v1.
