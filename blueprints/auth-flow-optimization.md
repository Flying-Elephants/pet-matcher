# Feature Specification: Landing Page & Auth Optimization

## Affected Domains
- Core (Routing)

## 1. Database Schema Changes (Prisma)
No changes required.

## 2. Domain Service Interface (Public API)
No changes required.

## 3. Interface Layer Requirements (Routes)
### Route: `app/routes/_index/route.tsx`
- **Logic Update**: If a user is not coming with a `shop` parameter, we should still minimize the prominence of the login form, especially if we suspect they might be within a Shopify context that simply missed the param (though unlikely for first-time entry).
- **UI Revamp**: 
    - Convert the landing page into a clean "Product Guide" or "Welcome" page.
    - Move the login form behind a "Get Started" or "Log In" button/modal to prevent it from being the first thing seen ("login box").
    - Use Polaris-like styling even on the landing page for consistency.

### Authentication Flow
- The `loader` already redirects if `shop` is present. 
- If `shop` is NOT present, we show the guide. The "login box" should not be visible by default.

## 4. Constraints & Edge Cases
- **Public Traffic**: Users finding the app URL directly should see a marketing/guide page, not a raw login form.
- **Embedded App**: Inside Shopify, the app should always be under `/app/*`.
