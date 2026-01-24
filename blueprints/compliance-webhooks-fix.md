# Compliance Webhooks Fix

## Affected Domains
- Core (Privacy Compliance)
- ProductRules (Product Sync)

## 1. Webhook Separation Strategy

Currently, `app/routes/webhooks.privacy.tsx` handles both Privacy/Compliance events AND Product events. This is confusing and violates the Single Responsibility Principle.

We will separate these into:
1.  `app/routes/webhooks.privacy.tsx` - Handles ONLY:
    - `CUSTOMERS_DATA_REQUEST`
    - `CUSTOMERS_REDACT`
    - `SHOP_REDACT`
2.  `app/routes/webhooks.products.tsx` - Handles ONLY:
    - `PRODUCTS_CREATE`
    - `PRODUCTS_UPDATE`
    - `PRODUCTS_DELETE`

## 2. TOML Configuration

We need to update `shopify.app.toml` to use the dedicated `[webhooks.privacy_compliance]` section for GDPR webhooks, instead of `[[webhooks.subscriptions]]`.

Correct configuration:

```toml
[webhooks]
api_version = "2026-01"

  [[webhooks.subscriptions]]
  topics = [ "products/delete", "products/update", "products/create" ]
  uri = "/webhooks/products"

  [[webhooks.subscriptions]]
  topics = [ "app/scopes_update" ]
  uri = "/webhooks/app/scopes_update"

  [[webhooks.subscriptions]]
  topics = [ "app/uninstalled" ]
  uri = "/webhooks/app/uninstalled"

  [[webhooks.subscriptions]]
  topics = [ "app_subscriptions/update" ]
  uri = "/webhooks/app/subscription_update"

[webhooks.privacy_compliance]
customer_data_request_url = "https://pet-matcher-prod.fly.dev/webhooks/privacy"
customer_redaction_url = "https://pet-matcher-prod.fly.dev/webhooks/privacy"
shop_redaction_url = "https://pet-matcher-prod.fly.dev/webhooks/privacy"
```

*Note: Privacy compliance webhooks often require absolute URLs.*

## 3. Implementation Details

### `app/routes/webhooks.products.tsx`
- Imports `ProductRuleService`.
- Authenticates using `authenticate.webhook(request)`.
- Switches on `topic`.

### `app/routes/webhooks.privacy.tsx`
- Imports `PetProfileService`, `SessionService`.
- Authenticates using `authenticate.webhook(request)`.
- Switches on `topic`.
- Returns 200 OK even if no action is taken (as per requirements).

## 4. Verification
- Use `authenticate.webhook` which enforces HMAC validation.
- Ensure all endpoints return valid HTTP responses.
