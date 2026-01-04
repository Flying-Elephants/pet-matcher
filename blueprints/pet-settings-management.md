# Feature Specification: Pet Settings Management (Breeds & Types)

## Affected Domains
- PetProfiles

## 1. Database Schema Changes (Prisma)
No schema changes required. `PetProfileSettings` model already exists and stores config as a JSON blob.
```prisma
model PetProfileSettings {
  id          String   @id @default(uuid())
  shop        String   @unique
  config      String   // JSON blob storing types and breeds tree: { types: [{ id: "dog", label: "Dog", breeds: ["Golden Retriever", ...] }] }
  updatedAt   DateTime @updatedAt
}
```

## 2. Domain Service Interface (Public API)
Existing functions in `app/modules/PetProfiles/index.ts` will be used:
```typescript
// Fetch current settings
getSettings: async (shop: string): Promise<PetSettings>

// Update settings (replace entire config)
updateSettings: async (shop: string, settings: PetSettings): Promise<PetSettings>
```

## 3. Interface Layer Requirements (Routes)
**Target Route:** `app/routes/app.additional.tsx` -> **RENAME TO:** `app/routes/app.pet-types.tsx`

### UI Strategy
- **Compact List View (ResourceList):**
  - Display Pet Types as a list.
  - Each item shows the label and breed count.
  - Actions: Edit (opens modal), Delete.
- **Modal Editing (Modern Pattern):**
  - Clicking "Add Type" or "Edit" opens a Modal.
  - **Type Name**: Simple TextField.
  - **Breeds**: 
    - Display as removable `Tag` components in a cluster.
    - "Add Breed" input field that adds a tag on Enter/Button click.
- **Save Strategy**:
  - `Save` on the main page persists the entire state.
  - Modal "Done" button updates the local state (client-side).

### Data Loading (Loader)
- **Parallel Fetching:**
  - Fetch `PetProfileService.getSettings(shop)`
- **Return Type:**
  - `json({ settings: PetSettings })`

### Actions (Action)
- **Intent:** `UPDATE_SETTINGS`
- **Payload:**
  - `settings`: JSON string of the new configuration.
- **Validation:**
  - Ensure `types` is an array.
  - Ensure each type has `id`, `label`, and `breeds` array.
- **Service Call:**
  - `PetProfileService.updateSettings(shop, parsedSettings)`
- **Feedback:**
  - Shopify App Bridge `toast` on success.

## 4. Constraints & Edge Cases
- **Validation:** Prevent duplicate types or breeds within a type to avoid confusion.
- **Data Integrity:** Ensure that removing a type/breed doesn't break existing `PetProfiles` that rely on them (though this might be a soft constraint for now, or require a warning).
- **Default State:** If no settings exist, seed with default "Dog" and "Cat" types and common breeds.
