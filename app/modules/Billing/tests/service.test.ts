import { describe, it, expect, vi } from "vitest";
import { BillingService } from "../internal/shopify";

describe("BillingService", () => {
  const mockAdmin: any = {
    graphql: vi.fn(),
  };

  it("should return active subscriptions", async () => {
    mockAdmin.graphql.mockResolvedValue({
      json: () => Promise.resolve({
        data: {
          currentAppInstallation: {
            activeSubscriptions: [{ id: "1", name: "Growth", status: "ACTIVE" }]
          }
        }
      })
    });

    const result = await BillingService.getSubscription(mockAdmin);
    expect(result[0].name).toBe("Growth");
  });

  it("should create a subscription", async () => {
    mockAdmin.graphql.mockResolvedValue({
      json: () => Promise.resolve({
        data: {
          appSubscriptionCreate: {
            appSubscription: { id: "2" },
            confirmationUrl: "https://shopify.com/confirm"
          }
        }
      })
    });

    const result = await BillingService.createSubscription(mockAdmin, "Growth", "https://return.url");
    expect(result.confirmationUrl).toBe("https://shopify.com/confirm");
    expect(mockAdmin.graphql).toHaveBeenCalled();
  });
});
