# Blueprint: Global Visual Revamp & Branding Consistency

## Affected Domains
- **Core**: Theme constants, shared UI components, PageGuide content.
- **Interface (Routes)**: All `app.*.tsx` routes.
- **Storefront**: Liquid blocks and CSS assets.

## 1. Design Language (Brand: Pet Matcher)
- **Primary Keyword**: "Perfect Fit"
- **Logic Engine**: "Breed Logic" / "Smart Recommendations"
- **Retention Engine**: "Gotcha Day" / "Birthday Marketing"
- **Sync Technology**: "Fit & Forget" (Bulk Operations)

## 2. Shared UI Component Updates
- **Page Header**: Standardize icons and secondary actions (Page Guide).
- **Cards**: Use consistent padding (500) and background logic (bg-surface-secondary for secondary info).
- **Banners**: Consistent tone usage (info for progress, warning for gating, success for completion).

## 3. Interface Revamp Strategy
- **`app.tsx`**: Update navigation labels in `NavMenu` to match ASO keywords.
- **`app.pet-types.tsx`**: Rebrand as "Breed Logic Configurator".
- **`app.rules.$id.tsx`**: Rebrand Rule Editor as "Perfect Fit Logic Builder".
- **`app.pet-profiles.tsx`**: Rebrand as "Retention Center".

## 4. Storefront Consistency
- Update `extensions/pet-profile-form/blocks/*.liquid` to use the same branding ("Find the Perfect Fit").
- Sync CSS colors and typography across Admin and Storefront.

## 5. Constraints & Edge Cases
- **Localization**: Ensure ASO copy is the default for English.
- **Polaris Guidelines**: Maintain strict adherence to Polaris while injecting brand voice.
