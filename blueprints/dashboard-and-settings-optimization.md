# Feature Specification: UI Data and Performance Optimization

## Affected Domains
- Analytics (Dashboard Integration)
- PetProfiles (Settings & App Proxy Routes)

## 1. Database Schema Changes (Prisma)
No changes required. Existing models support the required data fetching.

## 2. Domain Service Interface (Public API)
No changes required. `AnalyticsService.getSummary` and `PetProfileService.getSettings` are already exported.

## 3. Interface Layer Requirements (Routes)

### app/routes/app.dashboard.tsx
- **Loader Strategy**: Use `Promise.all` to fetch analytics summary and historical events (if needed, currently summary is enough for basic metrics).
- **Implementation**: Replace `mockAnalytics` with real data from `AnalyticsService.getSummary(session.shop)`.

### app/routes/app.settings.tsx
- **Loader Strategy**: Use `Promise.all` if additional data is needed later, but currently fetching settings only.
- **Action Strategy**: Use `PetSettingsSchema.parse(JSON.parse(formData.get("settings")))` for strict validation.
- **Performance**: Ensure `authenticate.admin` and `PetProfileService.getSettings` are not blocking each other if possible (though `authenticate` is required for shop session).

### app/routes/app.pet-profiles.tsx (App Proxy)
- **Loader Strategy**: Parallelize fetching `profiles`, `matches`, and `settings`.
  ```typescript
  const [profiles, settings] = await Promise.all([
    PetProfileService.getProfilesByCustomer(session.shop, customerId),
    PetProfileService.getSettings(session.shop)
  ]);
  ```
- **Action Strategy**: 
  - `create`: Use `CreatePetProfileSchema.parse` on the parsed JSON data.
  - `update`: Use `UpdatePetProfileSchema.parse` on the parsed JSON data.
- **Security**: Maintain existing session checks for App Proxy.

## 4. Constraints & Edge Cases
- **Billing Gating**: Dashboard should reflect usage limits if applicable (not required for this specific task but good to note).
- **Validation Errors**: Zod errors in actions must be caught and returned as readable JSON errors (already handled by try-catch in `app.pet-profiles.tsx`).
- **Data Consistency**: Ensure `weightGram` and other optional fields are handled correctly during Zod parsing.
