# Feature Specification: Pagination for Product Rules

## Affected Domains
- ProductRules

## 1. Database Schema Changes (Prisma)
No changes required.

## 2. Domain Service Interface (Public API)
Modify `app/modules/ProductRules/index.ts`:

- Update `RuleSortOptions` to include `page` and `limit`.
- Update `ProductRuleService.getRules` to return `{ rules: ProductRule[], totalCount: number }`.

Modify `app/modules/ProductRules/internal/db.ts`:

- Update `ProductRuleDb.findMany` to accept `page` and `limit`.
- Add `ProductRuleDb.count` to get the total number of rules for a shop.

## 3. Interface Layer Requirements (Routes)
- **Route**: `app/routes/app.rules._index.tsx`
- **Loader Strategy**: 
    - Extract `page` from search params (default: 1).
    - Set `limit` (e.g., 20).
    - Fetch rules and total count from `ProductRuleService.getRules`.
- **UI Strategy**:
    - Add `Pagination` component from `@shopify/polaris` at the bottom of the `IndexTable`.
    - Update `searchParams` when "Next" or "Previous" is clicked.

## 4. Constraints & Edge Cases
- **Invalid Page**: Default to page 1 if a non-numeric or out-of-bounds page is provided.
- **Empty Pages**: Handle cases where a page has no results correctly.
