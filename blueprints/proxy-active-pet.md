# Feature Specification: Proxy Active Pet Selection

## Affected Domains
- PetProfiles

## 1. Architecture Analysis
The requirement is to allow a **Customer** (via App Proxy) to select an active pet for their browsing session.

### Observation on Existing Migration
A recent migration (`20260103181855_add_active_pet_id_to_session`) added `activePetId` to the `Session` table.
- **Risk:** The `Session` table is primarily used for **Shop/Admin** authentication (OAuth). Using this field for *Customers* would result in a **Shared State/Race Condition** (all customers visiting the proxy would overwrite the same `activePetId` on the Shop's session record).
- **Decision:** We will **NOT** use the `Session` table for this feature.
- **Solution:** We will use a **Secure, HTTP-Only Cookie** (`pet_active_session`) to store the `activePetId` for the customer. This ensures isolation per user browser.

## 2. Domain Service Interface (Public API)
We will introduce a Session Manager within the `PetProfiles` module to encapsulate the cookie logic.

**File:** `app/modules/PetProfiles/index.ts`
```typescript
// Export new session capability
export const PetProfileSession = {
  // Get the active pet ID from the request cookie
  get: async (request: Request): Promise<string | null> => { ... },
  
  // Create a Set-Cookie header string to set the active pet
  set: async (petId: string): Promise<string> => { ... },
  
  // Create a Set-Cookie header to clear the selection
  unset: async (): Promise<string> => { ... }
};
```

**Internal Implementation:** `app/modules/PetProfiles/internal/session.server.ts`
- Use `createCookie` from `react-router`.
- Cookie Name: `pp_active`
- Settings: `httpOnly: true`, `secure: true`, `sameSite: "none"` (Required for ensuring it works if proxy is embedded or framed, though usually proxies are top-level or proxied. "lax" might be safer if top-level). *Decision: "Lax" is safer for Proxy.*

## 3. Interface Layer Requirements (Routes)

**File:** `app/routes/proxy.pet-profiles.tsx`

### Action Strategy (`intent="set_active"`)
1.  **Validate:** Ensure `logged_in_customer_id` is present.
2.  **Input:** `petId` from form data.
3.  **Ownership Check:** Verify `petId` belongs to `logged_in_customer_id` (Reuse `getProfilesByCustomer`).
4.  **Commit:**
    ```typescript
    const cookieHeader = await PetProfileSession.set(petId);
    return new Response(JSON.stringify({ activePetId: petId }), {
      headers: { "Set-Cookie": cookieHeader }
    });
    ```

### Loader Strategy
1.  **Fetch:** Get Profiles (existing logic).
2.  **Read Session:**
    ```typescript
    const activePetId = await PetProfileSession.get(request);
    ```
3.  **Response:** Return `{ profiles, activePetId }`.

## 4. Constraints & Edge Cases
- **Security:** Users cannot set an active pet they do not own.
- **Expiry:** Cookie should last for the session (or e.g., 7 days).
- **Invalidation:** If the active pet is deleted, the frontend handles the mismatch (ID not found in list), or we validate in Loader (optional for performance).
