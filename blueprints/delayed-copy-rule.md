# Feature Specification: Delayed Save on Rule Copy

When a user copies a product rule, it should not be automatically persisted to the database. Instead, it should redirect the user to the "new rule" page with the fields prepopulated from the original rule. The rule is only created when the user clicks "Save".

## Affected Domains
- `ProductRules`

## 1. Database Schema Changes (Prisma)
No changes required.

## 2. Domain Service Interface (Public API)
No changes to `app/modules/ProductRules/index.ts` required, though `copyRule` might become redundant or can be repurposed if we wanted to keep the logic server-side. However, to support React Router v7 state-based navigation, we'll handle the "template" generation in the loader/action.

## 3. Interface Layer Requirements (Routes)

### `app/routes/app.rules._index.tsx`
- **Action Strategy**: 
    - Update `_action === "copy"`.
    - Instead of calling `ProductRuleService.copyRule` (which saves to DB), it should fetch the existing rule data and redirect to `/app/rules/new` with the data passed via search parameters or we can simply fetch it in the `new` route if we pass a `sourceId`.
    - **Proposed optimization**: Redirect to `/app/rules/new?copyFrom=${id}`.

### `app/routes/app.rules.$id.tsx`
- **Loader Strategy**:
    - If `id === "new"` and `copyFrom` query parameter exists:
        - Fetch the rule with `id === copyFrom`.
        - Return this rule data as the "template" for the new rule.
        - Append " (Copy)" to the name in the loader result.
- **UI Strategy**:
    - Ensure the form initializes with the template data from the loader.

## 4. Constraints & Edge Cases
- **Rule of 100**: Ensure fetching the source rule for copying doesn't impact performance.
- **Missing Source**: If `copyFrom` ID is invalid, fallback to a blank "new" rule state.
- **ID Collisions**: Since it's redirected to `/new`, the `id` will be `undefined` during `upsertRule`, correctly creating a new record on save.
