# Feature Specification: Pet Creation Form Redesign (Visual Overhaul)

## Affected Domains
- PetProfiles (Theme App Extension)

## 1. Database Schema Changes (Prisma)
*None required. Visual update only.*

## 2. Domain Service Interface (Public API)
*No changes to `app/modules/PetProfiles/index.ts`.*

## 3. Interface Layer Requirements (Theme App Extension)

The goal is to transform the existing basic HTML form into a modern, responsive, and "app-like" component that blends well with Shopify 2.0 themes while maintaining a distinct, professional identity.

### Design System (CSS Strategy)
We will implement a scoped CSS system using BEM-like naming (`pp-form__element`) to prevent style leakage from the parent theme.

*   **CSS Variables**: Define a local scope for colors, spacing, and typography to allow easy customization.
*   **Layout**: Switch to a CSS Grid/Flexbox layout for better responsiveness.
*   **Typography**: Use system fonts stack for performance and native feel.
*   **Visual Language**:
    *   **Inputs**: Modern inputs with subtle borders, focus rings, and clear error states.
    *   **Cards**: "My Pets" list will use a card-based layout with hover effects.
    *   **Buttons**: Distinct Primary (Brand Color) and Secondary (Outline) styles.
    *   **Feedback**: Replace native `alert()` with a custom toast notification system.

### Component Structure (`pet_form.liquid`)

#### Container
- Wrapper: `.pp-container`
- Header: `.pp-header` (Title + "Add New" toggle if needed)

#### "My Pets" List
- Grid Layout: `.pp-pet-grid`
- Card Component: `.pp-pet-card`
    - Status Badge: `.pp-badge--active` (Green pill)
    - Actions: `.pp-pet-card__actions` (Edit/Delete icons or ghost buttons)

#### Form Section
- Form Container: `.pp-form-wrapper`
- Input Groups: `.pp-form-group`
- Interactions:
    - **Loading State**: Add spinners to buttons during `fetch` calls.
    - **Transitions**: Smooth fade-in/slide-down when the form appears.

### JavaScript Logic Updates
- Maintain existing `fetch` logic for CRUD.
- **Enhancement**: Refactor UI updates to use a render function that updates the DOM more cleanly without full re-renders where possible (though innerHTML replacement is acceptable for this scale if optimized).
- **Enhancement**: Replace `window.alert` with a simple DOM-based Toast notification function `showToast(message, type)`.

## 4. Constraints & Edge Cases
- **Theme Compatibility**: Must work on both dark and light background themes. (Use generic grays or `color-scheme` media queries).
- **Mobile Responsiveness**: Form inputs must be at least 16px font-size to prevent iOS zoom.
- **Isolation**: Ensure strict namespacing of CSS classes to avoid inheriting global theme styles that might break layout (e.g., `input` styling resets).
