# Feature Specification: Skeleton UI Integration

## Affected Domains
- Interface Layer (Cross-domain UI standard)

## 1. Database Schema Changes (Prisma)
None.

## 2. Domain Service Interface (Public API)
No changes to domain services.

## 3. Interface Layer Requirements (Routes)
- **Shared Components**: Create `app/components/SkeletonPage.tsx` and `app/components/SkeletonTable.tsx`.
- **Loader Strategy**: Routes will use `useNavigation` to detect `loading` states and display skeletons during transitions.
- **Specific Route Implementations**:
    - `app.dashboard.tsx`: Use `SkeletonPage` with card placeholders for analytics.
    - `app.pet-profiles.tsx`: Use `SkeletonTable` for the profiles list.
    - `app.rules._index.tsx`: Use `SkeletonTable` for product rules.
    - `app.settings.tsx`: Use `SkeletonPage` with form placeholders.

## 4. Constraints & Edge Cases
- **Polaris Consistency**: Use official `SkeletonPage`, `SkeletonBodyText`, `SkeletonDisplayText`, and `SkeletonTabs` components from `@shopify/polaris`.
- **Navigation State**: Ensure skeletons only appear during navigation/loading states to avoid layout shift once data is ready.
