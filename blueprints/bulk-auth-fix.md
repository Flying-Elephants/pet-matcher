# Feature Specification: Bulk Operation Auth Fix

## Affected Domains
- ProductRules

## 1. Database Schema Changes (Prisma)
No changes required.

## 2. Domain Service Interface (Public API)
No signature changes. The fix is internal to the implementation of `BulkOperationService.getStatus`.

## 3. Interface Layer Requirements (Routes)
- **Polling Strategy:** `app/routes/app._index.tsx` uses `revalidator.revalidate()` to poll sync status. When a session expires, this polling request triggers a 302 redirect.
- **Boundary Support:** The `AppProvider` and `boundary` in `app/routes/app.tsx` are already set up to handle these redirects, provided they are not swallowed by service-level `try-catch` blocks.

## 4. Constraints & Edge Cases
- **Redirect Propagation:** The `admin.graphql` client in Shopify's library throws or returns a `Response` for redirects (302). This MUST NOT be caught and swallowed in the domain layer.
- **Graceful Failure:** Actual GraphQL errors should still be logged and handled, but without catching the underlying redirect mechanism.

### Proposed Implementation Change

Apply a consistent pattern to all `admin.graphql` calls in [`app/modules/ProductRules/internal/bulk.ts`](app/modules/ProductRules/internal/bulk.ts) to handle redirects and non-OK responses correctly.

#### 1. Fix `getStatus` (The primary issue)
```typescript
  async getStatus(admin: AdminApiContext) {
    const query = `#graphql
      query {
        currentBulkOperation {
          id
          status
          errorCode
          createdAt
          completedAt
          objectCount
          url
        }
      }
    `;

    const response = await admin.graphql(query);
    
    // Throw redirects (302) so they are handled by Remix/React Router
    if (response.status === 302) {
        throw response;
    }

    if (!response.ok) {
        throw new Error(`Bulk status fetch failed: ${response.statusText}`);
    }

    const json: any = await response.json();
    
    if (json.errors) {
        console.error("GraphQL errors in getStatus:", json.errors);
        return null;
    }
    
    return json.data?.currentBulkOperation || null;
  }
```

#### 2. Update `runProductSync` & `syncSingleProduct`
Ensure they also check `response.ok` before calling `.json()` to avoid cryptic SyntaxErrors during auth redirects.
