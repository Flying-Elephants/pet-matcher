# Feature Specification: Unique Product Rule Names

Implement a constraint to ensure that product rules within the same shop cannot have duplicate names. This prevents confusion for merchants when managing multiple rules.

## Affected Domains
- ProductRules

## 1. Database Schema Changes (Prisma)
Add a unique constraint on the combination of `shop` and `name` in the `ProductRule` model.

```prisma
model ProductRule {
  id          String   @id @default(uuid())
  shop        String
  name        String
  // ... other fields
  
  @@unique([shop, name]) // Ensure unique names per shop
  @@index([shop, isActive])
}
```

## 2. Domain Service Interface (Public API)
Update `app/modules/ProductRules/index.ts` to include validation logic before calling the database.

```typescript
// app/modules/ProductRules/index.ts

export const ProductRuleService = {
  // ...
  upsertRule: async (shop: string, data: Partial<ProductRule>): Promise<ProductRule> => {
    if (data.name) {
      const existing = await ProductRuleDb.findByName(shop, data.name);
      if (existing && existing.id !== data.id) {
        throw new Error(`A rule with the name "${data.name}" already exists.`);
      }
    }
    return ProductRuleDb.upsert(shop, data);
  },
  // ...
};
```

## 3. Internal Layer Requirements (DB)
Add `findByName` to `app/modules/ProductRules/internal/db.ts`.

```typescript
// app/modules/ProductRules/internal/db.ts
async findByName(shop: string, name: string): Promise<ProductRule | null> {
  const rule = await db.productRule.findFirst({
    where: { shop, name },
  });
  if (!rule) return null;
  return this.mapToDomain(rule);
}
```

## 4. Interface Layer Requirements (Routes)
- **Action Strategy**: In `app/routes/app.rules.$id.tsx` and anywhere rules are created/updated, catch the validation error and return it as a JSON response with a toast-friendly message.
- **Client-side Validation**: (Optional but recommended) Add a check in the UI to warn the user if the name is already taken.

## 5. Constraints & Edge Cases
- **Case Sensitivity**: Unique constraint should ideally be case-insensitive (depends on DB provider, SQLite is case-sensitive by default for strings but can be configured; application-level `toLowerCase()` comparison might be safer if strict consistency is needed).
- **Existing Data**: A migration must be run. If duplicate names already exist, the migration will fail unless duplicates are handled (renamed or deleted) first.
