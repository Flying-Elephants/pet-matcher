# Compliance Webhooks Implementation

## Goal
Implement robust handling for Shopify's mandatory Privacy/Compliance webhooks (`customers/data_request`, `customers/redact`, `shop/redact`) using the modern `compliance_topics` subscription method.

## 1. Configuration (shopify.app.toml)

We will switch from the legacy/granular `[webhooks.privacy_compliance]` block to the unified `[[webhooks.subscriptions]]` block with `compliance_topics`. This allows a single endpoint to handle all privacy events.

```toml
[webhooks]
api_version = "2026-01"

  # ... existing product/app subscriptions ...

  [[webhooks.subscriptions]]
  compliance_topics = [ "customers/data_request", "customers/redact", "shop/redact" ]
  uri = "/webhooks/privacy"
```

*Note: We will use a relative URI `/webhooks/privacy` and rely on Shopify CLI to resolve the app domain.*

## 2. Webhook Handler (`app/routes/webhooks.privacy.tsx`)

The handler must parse specific payloads for each topic and perform the required actions.

### Payload Types

```typescript
type ShopRedactPayload = {
  shop_id: number;
  shop_domain: string;
};

type CustomerRedactPayload = {
  shop_id: number;
  shop_domain: string;
  customer: {
    id: number;
    email: string;
    phone: string;
  };
  orders_to_redact: number[];
};

type CustomerDataRequestPayload = {
  shop_id: number;
  shop_domain: string;
  orders_requested: number[];
  customer: {
    id: number;
    email: string;
    phone: string;
  };
  data_request: {
    id: number;
  };
};
```

### Action Logic

1.  **`shop/redact`**:
    -   Log event.
    -   Call `PetProfileService.deleteShopData(shop_domain)`.
    -   Call `SessionService.deleteSessions(shop_domain)`.
    -   Return `200 OK`.

2.  **`customers/redact`**:
    -   Log event.
    -   Extract `customer.id`.
    -   Call `PetProfileService.deleteCustomerData(shop_domain, customerId)`.
    -   Return `200 OK`.

3.  **`customers/data_request`**:
    -   Log event.
    -   (Optional) If we stored complex data, we would email it. For now, we acknowledge receipt.
    -   Return `200 OK`.

## 3. Verification
-   Ensure `authenticate.webhook(request)` is used for HMAC validation.
-   Ensure the switch statement covers all 3 topics.
-   Ensure strict type casting for payloads.
