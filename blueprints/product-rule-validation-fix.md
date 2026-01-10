# Feature Specification: Product Rule Validation & UI Improvements

Fixes `MissingAppProviderError` during validation failures and adds strict constraints to Product Rules.

## Affected Domains
- ProductRules

## 1. Database Schema Changes (Prisma)
No changes required.

## 2. Domain Service Interface (Public API)
Updates to [`app/modules/ProductRules/core/types.ts`](app/modules/ProductRules/core/types.ts):
- Refine `RuleConditionsSchema` to include cross-field validation for weights.
- Refine `ProductRuleUpsertSchema` to ensure `productIds` is never empty.

```typescript
// app/modules/ProductRules/core/types.ts

export const RuleConditionsSchema = z.object({
  petTypes: z.array(z.string()).default([]),
  breeds: z.array(z.string()).default([]),
  weightRange: z.object({
    min: z.number().int().nonnegative().nullable().optional(),
    max: z.number().int().nonnegative().nullable().optional(),
  }).optional().refine(data => {
    if (!data) return true;
    if ((data.min !== null && data.max === null) || (data.min === null && data.max !== null)) {
      return false; // Both must be entered if one is entered
    }
    if (data.min !== null && data.max !== null && data.max < data.min) {
      return false; // Max must be >= Min
    }
    return true;
  }, {
    message: "Both min and max weights are required, and max must be greater than min."
  }),
});
```

## 3. Interface Layer Requirements (Routes)

### app/routes/app.rules.$id.tsx
- **Client-side Validation**: Implement `handleSave` validation before `submit`.
- **UI Enhancements**:
    - Use Polaris `Banner` for server-side errors (already present, but needs cleaner mapping).
    - Use `error` prop on `TextField` for inline validation.
    - Prevent form submission if `productIds` is empty.
- **i18n Fix**: Ensure the `ErrorBoundary` and any high-level wrappers in `app/root.tsx` or `app/routes/app.tsx` correctly provide `i18n` to Polaris. The error `MissingAppProviderError` usually occurs when Polaris components are rendered outside of `AppProvider` or `PolarisProvider` with `i18n`. 
    - *Correction*: The user mentioned it happens when they try to create a rule. This suggests the error is triggered by the `ActionData` returning an error that might be rendered in a way that breaks the context or the `ErrorBoundary` is hitting it.

### Validation Rules to Apply:
1. **Product Selection**: Required (min 1).
2. **Rule Name**: Required.
3. **Weight Min**: Non-negative, required if Max is present.
4. **Weight Max**: Non-negative, required if Min is present, must be > Min.
5. **Pretty Errors**: Use Polaris `InlineError` or `error` prop on components.

## 4. Constraints & Edge Cases
- **Empty States**: Show a clear message if no products are selected.
- **Weight Units**: Ensure validation messages respect the user's configured weight unit (kg/lb).
- **Zod Error Mapping**: Map Zod issues to specific field states in the React component.
