# Feature Specification: Info Guide Modals

## Affected Domains
- Core (UI/Shared Components)

## 1. Database Schema Changes (Prisma)
No database changes required. Content will be hardcoded in the UI layer for simplicity and performance, or fetched via a client-side config.

## 2. Domain Service Interface (Public API)
This is a UI-only feature. We will create a `PageGuide` component in `app/components/PageGuide.tsx`.

```typescript
// app/components/PageGuide.tsx

interface GuideContent {
  title: string;
  sections: {
    heading?: string;
    content: string;
  }[];
}

interface PageGuideProps {
  content: GuideContent;
}

export function PageGuide({ content }: PageGuideProps) {
  // Uses Polaris Modal and a trigger button (likely an Icon in the Page header)
}
```

## 3. Interface Layer Requirements (Routes)
- **Base Layout (`app/routes/app.tsx`)**: No changes to the layout itself, but individual routes will implement the guide.
- **Route Implementation**: Each page component will include the `PageGuide` component.
- **Content Mapping**:
  - `/app`: Welcome guide, overview of Pet-Matcher.
  - `/app/dashboard`: Analytics guide, explaining Match Events and Session counts.
  - `/app/pet-types`: Configuration guide for pet categories (Dogs, Cats, etc.).
  - `/app/rules`: Product Rules guide, explaining how to map products to pet attributes.
  - `/app/settings`: System settings guide.

### Implementation Strategy:
1. Create `app/components/PageGuide.tsx` using Polaris `Modal` and `Button` (plain/icon version).
2. Create a content configuration file `app/modules/Core/guide-content.ts` to store the text for each page.
3. Update each route in `app/routes/` to import and render the `PageGuide`.

## 4. Constraints & Edge Cases
- **UI Consistency**: The guide button should consistently appear in the same location (e.g., top right of the Page title or as a secondary action).
- **Mobile View**: Ensure the Modal is responsive using Polaris standards.
- **Dismissal**: Modal should be easily dismissible.
