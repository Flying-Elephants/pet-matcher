# Feature Specification: Setup Guide & Storefront Visibility

## Affected Domains
- Core (Documentation)
- PetProfiles (Storefront Extension)

## 1. Interface Layer Requirements (Routes)

### New Route: `app/routes/app.guide.tsx`
A dedicated page for onboarding merchants.

**Content:**
1.  **Introduction:** "Welcome to Pet Matcher".
2.  **Step 1: Installation:**
    - Explain "App Embed" activation.
    - Provide a deep link to the Theme Editor if possible (or instructions).
    - **Crucial Note:** Explicitly state: "The App Embed (Floating Button) is visible to all users, but the Profile Form is only accessible to logged-in customers."
3.  **Step 2: Configuration:**
    - How to create Pet Types & Breeds in `Pet Profiles > Settings`.
    - How to create Product Rules.
4.  **Step 3: Testing:**
    - Create a test account on the storefront.
    - Log in and verify the "My Pets" button appears.

## 2. Storefront Extension Logic (`pet-profile-form.js`)

**Current Behavior:**
- The floating trigger button is hidden by default (`display: none` in CSS).
- It is only revealed after `fetchProfiles()` succeeds.
- `fetchProfiles()` is only called if `customerId` exists.
- Result: Guests never see the button.

**Required Change:**
- If `!customerId` (Guest), explicitly reveal the trigger button.
- Clicking it will open the modal, which already renders the `pp-login-view` via Liquid logic.

**Code Change:**
In `extensions/pet-profile-form/assets/pet-profile-form.js`:
```javascript
if (customerId) {
  fetchProfiles();
} else {
  // Reveal trigger for guests to allow login prompt
  if (modal.trigger) modal.trigger.style.display = 'flex';
}
```

## 3. Constraints
- Guide page must use Polaris components.
- Extension change must be tested (mentally) to ensure it doesn't break the billing gate logic (which is handled inside `fetchProfiles`). *Note: Guests are not billing-gated because they don't consume resources until they log in and create profiles, but strictly speaking, if the shop is unpaid, maybe we shouldn't show it?*
    - *Refinement:* If the shop is unpaid, we might want to hide it. But `fetchProfiles` checks billing status. Guests don't trigger `fetchProfiles`.
    - *Decision:* For now, we assume the app is active. Checking billing status for guests would require a public API call for every page load, which might be overkill or open to abuse. However, Liquid `block.settings` usually doesn't have billing info unless injected.
    - *Simplified Approach:* Show it for guests. If they log in, `fetchProfiles` runs and might hide it if unpaid.

## 4. Updates
- Update `app/routes/app.tsx` sidebar navigation to include "Setup Guide".
