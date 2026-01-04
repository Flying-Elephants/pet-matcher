# Feature Specification: App Embed Migration

## Affected Domains
- `PetProfiles` (Storefront UI)
- `Theme Extension`

## 1. Pet Form (Global Floating Widget)
Convert the `Pet Profile Form` from a static section block to a global app embed.

### Changes to `extensions/pet-profile-form/blocks/pet_form.liquid`:
- Change `target` from `section` to `body`.
- Add a floating trigger button with a label (e.g., "🐾 My Pets").
- Wrap the existing form container in a modal/overlay that is toggled by the trigger.
- **Customization Settings**:
    - `trigger_label`: Custom text for the button.
    - `trigger_position`: Select (Bottom-Right, Bottom-Left, etc.).
    - `trigger_bg_color` & `trigger_text_color`.
    - `trigger_offset`: X and Y offsets for fine-tuning.
    - `trigger_animation`: Toggle for pulse effect.

## 2. Product Match Badge (App Block)
Reverted from App Embed back to App Block to provide merchants with precise drag-and-drop placement control.

### Changes to `extensions/pet-profile-form/blocks/product_match_badge.liquid`:
- Target: `section`.
- Templates: `product`.
- **Improved Rendering**: Shows status for all pets (matching and non-matching) by default to fulfill customer visibility requirements.

## 3. Benefits & Constraints
- **Hybrid Approach**: Floating global management (Embed) combined with precise page context (Block).
- **Merchant Control**: Merchants get the best of both worlds—ease of management and control over page layout.

