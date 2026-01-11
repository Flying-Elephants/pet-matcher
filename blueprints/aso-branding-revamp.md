# Feature Specification: ASO Visual Branding Revamp

## Affected Domains
- Core (Guide Content & Branding)
- PetProfiles (User-facing terminology)
- ProductRules (Logic engine branding)

## 1. Database Schema Changes (Prisma)
No schema changes required. This is a visual/copy-only update.

## 2. Domain Service Interface (Public API)
Updates to `app/modules/Core/guide-content.ts` to reflect new branding.

## 3. Interface Layer Requirements (Routes)
- **App Index (`app/routes/app._index.tsx`)**: 
    - Update Page title to "Pet Matcher: Product & Breed Quiz".
    - Update Hero section with slogan: "The perfect fit for every pet. Turn uncertainty into adoption."
    - Refactor empty states and descriptions to use "Perfect Fit" guarantee terminology.
- **Dashboard (`app/routes/app.dashboard.tsx`)**:
    - Update metrics cards to highlight "Fit & Forget" sync status.
    - Update marketing banners to mention "Gotcha Day" capture.
- **Rules (`app/routes/app.rules._index.tsx`)**:
    - Update description: "Logic engine matches pets to products based on breed, weight, and age."
- **Settings (`app/routes/app.settings.tsx`)**:
    - Update terminology around auto-syncing to "Fit & Forget".

## 4. Constraints & Edge Cases
- **Visual Consistency**: Ensure all instances of "Product Finder" or "Quiz" are updated to the new ASO keywords.
- **Polaris Alignment**: Use `Banner` and `Layout` components to emphasize the "Value Props".
- **Rule of 100**: Ensure copy doesn't bloat the UI; keep descriptions concise but impactful.
