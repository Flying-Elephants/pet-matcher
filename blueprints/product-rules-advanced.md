# Feature Specification: Product Rules (Advanced Filtering)

## Affected Domains
- ProductRules
- PetProfiles (Schema context)

## 1. Database Schema Changes (Prisma)

The current `ProductRule` model is a bit generic. We will refine it to explicitly support `petTypes`, `breeds`, and `birthday` logic.

```prisma
model ProductRule {
  id          String   @id @default(uuid())
  shop        String
  name        String
  priority    Int      @default(0)
  
  // Logical Conditions (Stored as JSON string in SQLite)
  // Structure: { 
  //   petTypes: string[], 
  //   breeds: string[], 
  //   minAge?: number, 
  //   maxAge?: number,
  //   birthdayMonth?: number 
  // }
  conditions  String   
  
  // Selection of Products this rule applies to
  // Currently stored as JSON string array of Shopify Product IDs
  productIds  String   
  
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([shop, isActive])
}
```

## 2. Domain Service Interface (Public API)

File: `app/modules/ProductRules/index.ts`

```typescript
export interface RuleConditions {
  petTypes: string[];       // e.g. ["Dog", "Cat"]
  breeds: string[];         // e.g. ["Golden Retriever", "Siamese"]
  ageRange?: {              // in years
    min?: number;
    max?: number;
  };
  birthdaySpecial?: boolean; // True if it's a "Birthday Month" offer
}

export interface ProductRule {
  id: string;
  shop: string;
  name: string;
  priority: number;
  conditions: RuleConditions;
  productIds: string[];
  isActive: boolean;
}

export const ProductRuleService = {
  getRules: (shop: string) => Promise<ProductRule[]>,
  getRule: (shop: string, id: string) => Promise<ProductRule | null>,
  upsertRule: (shop: string, data: Partial<ProductRule>) => Promise<ProductRule>,
  deleteRule: (shop: string, id: string) => Promise<void>,
  
  // Logic for matching a pet to products
  getMatchedProductsForPet: (shop: string, petProfile: any) => Promise<string[]>
};
```

## 3. Interface Layer Requirements (Routes)

- **Route: `app/routes/app.rules._index.tsx`**: List all rules.
- **Route: `app/routes/app.rules.new.tsx`**: Create a new rule.
- **Route: `app/routes/app.rules.$id.tsx`**: Edit an existing rule.

### UI Components (Polaris):
- `ResourceList` for listing rules.
- `LegacyCard` / `BlockStack` for condition builders.
- `OptionList` or `Tag` input for Pet Types and Breeds.
- Product Picker (Shopify App Bridge) for selecting products.

## 4. Constraints & Edge Cases
- **Rule of 100**: Limit rules per shop to 100 to ensure fast matching performance.
- **Conflict Resolution**: If multiple rules apply to the same product, the highest `priority` rule wins, or we can aggregate (User specified: "Bir ürünün birden çok kuralı olabilsin" - so we allow multiple rules to match).
- **Billing Gating**: Advanced rules (like age-based or birthday-based) might be locked behind a "PRO" plan.
