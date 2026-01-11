# Feature Specification: Routing Consolidation and Index Cleanup

The current routing structure contains redundant and confusing entry points. Specifically, `app/routes/_index/route.tsx` handles the unauthenticated landing/login page, while `app/routes/app._index.tsx` acts as a middleman redirecting to the dashboard. 

## Affected Domains
- Core (Routing)

## 1. Database Schema Changes (Prisma)
No changes required.

## 2. Domain Service Interface (Public API)
No changes required.

## 3. Interface Layer Requirements (Routes)

### 3.1. Route Rationalization
Current State:
- `/` -> `app/routes/_index/route.tsx` (Landing/Login)
- `/app` -> `app/routes/app._index.tsx` (Redirects to `/app/dashboard`)
- `/app/dashboard` -> `app/routes/app.dashboard.tsx` (Actual Admin Home)

Proposed State:
- **Consolidate `/app` entry point**: Remove `app/routes/app._index.tsx`.
- **Direct App Route**: Configure `app/routes/app.tsx` or a more direct path to handle the initial landing within the Shopify Admin.
- **Landing Page**: Keep `app/routes/_index/` for off-Shopify landing, but ensure it clearly transitions to the authenticated flow.

### 3.2. Implementation Steps
1. **Delete** [`app/routes/app._index.tsx`](app/routes/app._index.tsx) as it only performs a redirect that can be handled more efficiently or is redundant if the dashboard is the intended default.
2. **Rename/Move** logic if necessary to ensure that when a user hits `/app`, they land on the Dashboard without an extra hop, or clearly define `app.dashboard.tsx` as the index for the `app` layout.
3. **Review** [`app/routes/app.tsx`](app/routes/app.tsx) to ensure it correctly authenticates and provides the layout for all nested routes.

## 4. Constraints & Edge Cases
- **Shopify Auth Flow**: Must ensure that deleting `app._index.tsx` doesn't break the standard Shopify CLI app template flow which often expects an index route within the authenticated boundary.
- **Deep Linking**: Ensure that links to `/app` from the Shopify Partner Dashboard or Admin correctly resolve to the Dashboard.
