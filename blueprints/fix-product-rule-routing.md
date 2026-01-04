# Feature Specification: Fix Product Rule Routing

## Affected Domains
- ProductRules (Interface Layer)

## 1. Database Schema Changes (Prisma)
No changes required.

## 2. Domain Service Interface (Public API)
No changes required.

## 3. Interface Layer Requirements (Routes)

### Problem
The current implementation in [`app/routes/app.rules._index.tsx`](app/routes/app.rules._index.tsx) uses `/app/rules_/new` and `/app/rules_/{id}` for navigation. Under React Router v7 `flatRoutes`, the file structure `app/routes/app.rules._index.tsx` and `app/routes/app.rules.$id.tsx` maps to the URL path `/app/rules` and `/app/rules/:id`. The underscore in the URL used by the UI is causing a 404.

### Fix Strategy
Update navigation URLs in [`app/routes/app.rules._index.tsx`](app/routes/app.rules._index.tsx) and [`app/routes/app.rules.$id.tsx`](app/routes/app.rules.$id.tsx) to match the flat route mapping.

- **URL Mapping:**
  - Index: `/app/rules`
  - Detail/New: `/app/rules/:id`

- **Navigation Changes in [`app/routes/app.rules._index.tsx`](app/routes/app.rules._index.tsx):**
  - Change `navigate('/app/rules_/new')` to `navigate('/app/rules/new')`
  - Change `url={\`/app/rules_/\${id}\`}` to `url={\`/app/rules/\${id}\`}`

- **Navigation Changes in [`app/routes/app.rules.$id.tsx`](app/routes/app.rules.$id.tsx):**
  - Change `backAction={{ content: 'Rules', url: '/app/rules' }}` (Already correct)
  - Change `redirect("/app/rules")` in action (Already correct)

## 4. Constraints & Edge Cases
- **Route Specificity:** React Router v7 resolves static segments before dynamic segments. `/app/rules/new` will correctly match `$id.tsx` with `id="new"`.
- **Legacy Patterns:** Avoid using `_index` or trailing underscores in the browser URL.
