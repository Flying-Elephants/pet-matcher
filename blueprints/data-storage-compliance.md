# Feature Specification: Data Storage Compliance & DLP

This blueprint defines the strategy for complying with data retention, encryption, and data loss prevention requirements.

## Affected Domains
- PetProfiles (Personal Data Retention)
- Analytics (Event Data Retention)
- Core (Encryption & DLP Infrastructure)

## 1. Database Schema Changes (Prisma)

No schema changes are strictly required as we already have `createdAt` and `updatedAt` on relevant models. However, we will formalize the usage of these for retention policies.

```prisma
// No changes needed, leveraging existing:
// PetProfile.createdAt
// MatchEvent.createdAt
// Job.createdAt
```

## 2. Domain Service Interface (Public API)

### Analytics Module (`app/modules/Analytics/index.ts`)
```typescript
export const AnalyticsService = {
  // ... existing
  /**
   * Purges match events older than the specified retention period (default 90 days)
   */
  purgeOldEvents: async (days: number = 90): Promise<number> => {
     return AnalyticsDb.purgeEvents(days);
  }
}
```

### PetProfiles Module (`app/modules/PetProfiles/index.ts`)
```typescript
export const PetProfileService = {
  // ... existing
  /**
   * Purges profiles for customers who haven't interacted (updated) in a long time (default 2 years)
   */
  purgeInactiveProfiles: async (years: number = 2): Promise<number> => {
     return PetProfileDb.purgeInactive(years);
  }
}
```

## 3. Interface Layer Requirements (Routes)

### Retention Automation (Background Jobs)
Since this is a modular monolith, we will implement a maintenance trigger.
- **Strategy**: A GitHub Action or Cron job calling a protected internal endpoint `/api/maintenance/cleanup`.
- **Logic**: 
    1. Call `AnalyticsService.purgeOldEvents(90)`.
    2. Call `PetProfileService.purgeInactiveProfiles(730)`.
    3. Call `ProductRuleService.cleanupOrphanedJobs()`.

### Data Encryption at Rest & In Transit
- **In Transit**: Enforced by Fly.io / Shopify HTTPS requirements. No app-level change.
- **At Rest (Application-Level Encryption)**:
    - **PII Protection**: We will implement AES-256-GCM encryption for personal data fields in the database.
    - **Affected Fields**: `PetProfile.name`, `PetProfile.attributes`.
    - **Key Management**: Encryption keys must be stored in environment variables (`ENCRYPTION_KEY`) and never committed to version control.
    - **Backups**: Since the data is encrypted at the application level before reaching the DB, backups are inherently protected even if the storage layer is compromised.

### Data Loss Prevention (DLP) Strategy
1. **Separation of Environments**: 
    - `dev.sqlite` for local development (gitignored).
    - `production.sqlite` on persistent volumes in Fly.io.
2. **Access Control**: Database access restricted to the application runtime. No direct public access to DB files.
3. **Audit Logging**: All destructive operations (webhooks for redaction) are logged to stdout for log aggregation (Papertrail/BetterStack).
4. **PII Masking**: Ensure `PetProfile` names/attributes are never logged in cleartext in production logs.

## 4. Constraints & Edge Cases
- **Rule of 100**: Retention purging should be batched (delete in chunks of 100-1000) to avoid locking the SQLite database for extended periods.
- **Shopify Redaction**: The `CUSTOMERS_REDACT` and `SHOP_REDACT` webhooks in `webhooks.privacy.tsx` are the primary DLP enforcement points for Shopify compliance.
- **Backup Integrity**: Periodic "Restore Tests" to ensure backups aren't corrupted.
