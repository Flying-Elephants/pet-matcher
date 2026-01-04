# Feature Specification: Product Rule Edit Route Fix

The current `app/routes/app.rules.$id.tsx` file name uses a dot-notation that inadvertently breaks the inheritance from `app.tsx` in React Router v7 when using `@react-router/fs-routes` with flat routing. In React Router v7, to nest under `app.tsx`, the route must either be a child in a directory or follow the exact prefixing logic. 

However, since `app.tsx` is meant to be a layout route for all `/app/*` paths, and the current flat routing is being used, we need to ensure the route correctly nested.

## Affected Domains
- ProductRules (Interface Layer)

## 1. Database Schema Changes (Prisma)
No changes required.

## 2. Domain Service Interface (Public API)
No changes required.

## 3. Interface Layer Requirements (Routes)
- Rename `app/routes/app.rules.$id.tsx` to `app/routes/app.rules_.$id.tsx`.
- *Wait*, in flat routes, if we want it to be a child of `app.tsx` (the layout), it should be `app.rules.$id.tsx`. 
- If it's showing the login screen, it means `authenticate.admin(request)` is failing or redirecting because it's being treated as a top-level route without the necessary App Bridge context provided by `app.tsx`.
- Actually, `app.tsx` is the parent for all `app.*` routes.
- The issue is likely that the URL generated in `app.rules._index.tsx` is `/app/rules/${id}`, but the file is named `app.rules.$id.tsx`. In flat routes, `app.rules.$id.tsx` matches `/app/rules/:id`. This should work.
- **Hypothesis**: The browser is navigating to `/app/rules/123` but the session is lost or the App Bridge is not initialized because the route is being rendered outside the `app.tsx` layout.

### Fix Strategy:
1. Ensure the route file name is correctly associated with the `app.tsx` layout.
2. In React Router v7 flat routes:
   - `app.tsx` is the layout for `app._index.tsx`, `app.rules._index.tsx`, etc.
   - `app.rules.$id.tsx` SHOULD be a child of `app.tsx`.
3. If it's NOT rendering within `app.tsx`, it's because of the dot separator. 
4. However, the user says they see a "Log in" screen. This screen is from `auth.login/route.tsx`.
5. This happens when `authenticate.admin(request)` throws a redirect to `/auth/login`.
6. Why would it redirect for `$id.tsx` but not for `_index.tsx`?
   - Maybe the `id` parameter is causing issues with how the URL is parsed by the Shopify server utility.
   - Or, more likely, the route is not being recognized as an "embedded" route because it's missing the `shopify-app-react-router` context if it's not nested under `app.tsx`.

## 4. Constraints & Edge Cases
- Ensure the Resource Picker (App Bridge 4.0) works correctly once the layout is fixed.
- Check that the `params.id` is correctly captured.
