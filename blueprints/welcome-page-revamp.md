# Feature Specification: Welcome Page Revamp

## Affected Domains
- Core (UI/Authentication Flow)

## 1. Database Schema Changes (Prisma)
No schema changes required for this UI-only revamp.

## 2. Domain Service Interface (Public API)
No new service interfaces. Using existing `shopify.server.ts` for login redirection.

## 3. Interface Layer Requirements (Routes)
### Route: `app/routes/_index/route.tsx`
- **Visual Overhaul**: Replace the current basic card with a hero section + feature grid layout.
- **Improved Typography**: Use more descriptive headings and clearer benefit statements.
- **Login Flow**: Maintain the conditional form visibility but integrate it more cleanly into the hero section.
- **Responsive Design**: Ensure the feature grid collapses properly on mobile (improving existing media queries).

### Styles: `app/routes/_index/styles.module.css`
- **Background**: Update with a subtle gradient or pet-themed accent colors.
- **Buttons**: Update to Polaris-inspired styling (though this is outside the app, keeping consistency helps).
- **Icons**: (Optional/Future) Add placeholder slots for icons in the feature grid.

## 4. Constraints & Edge Cases
- **No Shop Context**: The page must handle cases where `shop` is missing from the URL (triggering the manual login form).
- **Shopify Redirect**: If `shop` and `host` are present, the loader must continue to redirect to `/app` to ensure seamless SSO.
