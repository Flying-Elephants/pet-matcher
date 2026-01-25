# Feature Specification: Privacy Policy Revamp

## Affected Domains
- Core

## 1. Database Schema Changes (Prisma)
No database changes required.

## 2. Domain Service Interface (Public API)
No new service interfaces. This is a static view update.

## 3. Interface Layer Requirements (Routes)
**Route:** `app/routes/privacy.tsx`

**Content Structure:**
The page will be restructured to be comprehensive and legally robust (Standard Template).

### Sections:
1.  **Header:**
    - App Name: Pet Matcher
    - Effective Date: [Current Date]
    
2.  **Introduction:**
    - Commitment to privacy.
    - Scope of the policy.

3.  **Information We Collect:**
    - **Merchant Information:** Name, email, shop URL (collected via Shopify API).
    - **Customer Information:** Name, email, shipping address (if applicable for matching logic), Pet Profiles (Name, Breed, Weight, Age).
    - **Device Information:** Cookies, Log files (standard boilerplate).

4.  **How We Use Your Information:**
    - Providing Services (Pet matching, recommendations).
    - Communication (Support, billing updates).
    - Improvement & Analytics (Aggregated non-personal data).

5.  **Sharing Your Information:**
    - **Shopify:** We share data necessary to function within the ecosystem.
    - **Third-Party Service Providers:** (e.g., Google Cloud for hosting).
    - **Legal Requirements:** Compliance with laws.

6.  **Your Rights (GDPR & CCPA):**
    - **European Residents:** Right to access, correct, delete, and port data. Mention the "Data Subject Request" process via the Merchant.
    - **California Residents:** CCPA rights (Knowledge, Deletion, Non-discrimination).

7.  **Data Retention:**
    - We retain data for as long as the App is installed.
    - 48-hour purge upon uninstallation (via `app/uninstalled` webhook).

8.  **Security:**
    - Standard industry measures (Encryption in transit/rest).

9.  **Changes:**
    - Right to update the policy.

10. **Contact Us:**
    - Email: support@pet-matcher.com (Placeholder)
    - Address: (Placeholder or "Contact via Shopify Partner Dashboard")

**UI Strategy:**
- Use `@shopify/polaris` components (`Page`, `Layout`, `Card`, `Text`, `List`, `BlockStack`) to maintain a professional look.
- Ensure the page is legible and well-spaced.

## 4. Constraints & Edge Cases
- **Public Access:** The route must remain public (no `loader` authentication).
- **Styling:** Ensure Polaris CSS is loaded. If `app/root.tsx` doesn't load it globally, we might need to add a `links` export to `app/routes/privacy.tsx` or fix `app/root.tsx`.
