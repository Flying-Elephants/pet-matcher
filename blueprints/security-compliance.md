# Feature Specification: Security & Access Compliance

This blueprint addresses Shopify's security requirements regarding staff access, password policies, access logging, and incident response.

## Affected Domains
- Core (Audit Logging, Security Settings)
- PetProfiles (Access Gating)

## 1. Database Schema Changes (Prisma)

```prisma
// Track staff access to PII (Personal Identifiable Information)
model AuditLog {
  id          String   @id @default(uuid())
  shop        String
  userId      BigInt?  // Shopify Staff ID
  userName    String?  // Staff Name
  action      String   // e.g., "VIEW_PET_PROFILES_LIST", "VIEW_PET_PROFILE_DETAIL"
  resourceId  String?  // The ID of the specific record accessed
  createdAt   DateTime @default(now())

  @@index([shop])
  @@index([shop, createdAt])
}

// Security Configuration per Merchant
model SecuritySettings {
  id                        String   @id @default(uuid())
  shop                      String   @unique
  limitCollaboratorAccess   Boolean  @default(false) // Toggle to block Shopify Collaborator accounts
  updatedAt                 DateTime @updatedAt
}
```

## 2. Domain Service Interface (Public API)

### Core Module (`app/modules/Core/ComplianceService.ts`)
```typescript
export const ComplianceService = {
  /**
   * Records an audit entry for staff accessing customer data.
   */
  logAccess: async (data: {
    shop: string;
    userId?: bigint;
    userName?: string;
    action: string;
    resourceId?: string;
  }) => {
    // Implementation in AuditLogDb
  },

  /**
   * Retrieves security settings for a shop.
   */
  getSettings: async (shop: string) => {
    // Implementation in SecuritySettingsDb
  }
}
```

## 3. Interface Layer Requirements (Routes)

### Loader Strategy (Gating & Logging)
In routes accessing PII (e.g., `app.pet-profiles.tsx`):
1. **Validation**: Check if `session.collaborator` is true and `limitCollaboratorAccess` is enabled.
2. **Logging**: 
   ```typescript
   await ComplianceService.logAccess({
     shop: session.shop,
     userId: session.userId,
     userName: `${session.firstName} ${session.lastName}`,
     action: "VIEW_PET_PROFILES_LIST"
   });
   ```

### Action Strategy (Security Toggles)
In `app.settings.tsx`:
- Add a "Security" section allowing the Account Owner to toggle `limitCollaboratorAccess`.

## 4. Constraints & Edge Cases
- **Password Requirements**: We delegate all authentication to Shopify. By using Shopify's App Bridge and Session Tokens, we inherit Shopify's strong password requirements (MFA support, complexity rules).
- **Incident Response**: A `SECURITY_INCIDENT_RESPONSE.md` file will be maintained in the repository, defining the protocol for data breaches (Detection -> Containment -> Eradication -> Recovery -> Lessons Learned).
- **Audit Log Volume**: Logs should be pruned after 1 year using the maintenance cleanup route.
