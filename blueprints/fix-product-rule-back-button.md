# Feature Specification: Fix Product Rule Back Button

## Affected Domains
- ProductRules

## 1. Database Schema Changes (Prisma)
None.

## 2. Domain Service Interface (Public API)
None.

## 3. Interface Layer Requirements (Routes)
- **Component:** `app/routes/app.rules.$id.tsx`
- **Issue:** The `Page` component uses a `url` prop for `backAction`, causing a full page reload and potential auth redirect loops ("login screen").
- **Fix:**
  - Initialize `useNavigate` hook.
  - Update `backAction` to use `onAction: () => navigate('/app/rules')` instead of `url`.
  - Ensure client-side routing is preserved.

## 4. Constraints & Edge Cases
- **Navigation:** Must use React Router's `navigate` to maintain SPA state.
