# Feature Specification: PostgreSQL Migration

## Affected Domains
- Core (Infrastructure)
- PetProfiles (Schema optimization)
- ProductRules (Schema optimization)
- Analytics (Schema optimization)

## 1. Database Schema Changes (Prisma)
The provider will be changed from `sqlite` to `postgresql`. 
Key optimizations:
- `PetProfile.attributes`: `String` -> `Json`
- `PetProfileSettings.config`: `String` -> `Json`
- `ProductRule.conditions`: `String` -> `Json`
- `ProductRule.productIds`: `String` -> `Json` (or native Array if applicable, but Json is safer for complex structures)
- `Job.payload`: `String` -> `Json`

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model PetProfile {
  // ... existing fields
  attributes  Json     @default("{}") // Native Json support
  // ...
}

model ProductRule {
  // ... existing fields
  conditions  Json     @default("{}")
  productIds  Json     @default("[]")
  // ...
}
```

## 2. Domain Service Interface (Public API)
No public API changes are expected in `app/modules/{Domain}/index.ts`. However, internal DB logic in `internal/db.ts` across all modules must be audited for any SQLite-specific SQL fragments (though Prisma abstracts most of this).

## 3. Interface Layer Requirements (Routes)
- **Environment Variables**: Ensure `DATABASE_URL` is configured in `.env` and Fly.io secrets.
- **Dependency Update**: No new dependencies, but `prisma` needs to be re-generated.

## 4. Constraints & Edge Cases
- **Data Migration**: Existing SQLite data must be exported/imported if moving production.
- **Type Safety**: Prisma `Json` fields require explicit typing when retrieved.
- **BigInt Compatibility**: PostgreSQL handles `BigInt` (used in `Session.userId` and `AuditLog.userId`) natively, but Prisma returns them as `bigint`. Ensure frontend components handle serialization of `BigInt` (usually by converting to `String` in loaders).

## 5. Infrastructure Changes
- **Dockerfile**: Add `postgresql-client` if needed for health checks.
- **Fly.toml**: Removed SQLite volume mounts and configured for PostgreSQL.

## 6. Migration Strategy
1. **Local Setup**:
   - Install PostgreSQL locally or use Docker.
   - Update `.env` with `DATABASE_URL=postgresql://...`.
   - Run `npx prisma migrate dev` to initialize the new PostgreSQL schema.
2. **Production Deployment**:
   - Provision Fly Postgres: `fly postgres create`.
   - Attach to app: `fly postgres attach --app pet-matcher-prod`.
   - Deployment will automatically run `prisma migrate deploy` via `npm run setup`.
3. **Data Porting (Optional)**:
   - If data exists in SQLite, use a tool like `pgloader` or a custom script to port `String` JSON blobs into native `Json` columns.
