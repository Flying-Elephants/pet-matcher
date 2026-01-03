import { describe, it, expect, vi } from "vitest";
import { BillingService } from "../../app/modules/Billing";
import { BillingService as ShopifyBilling } from "../../app/modules/Billing/internal/shopify";

vi.mock("../../app/modules/Billing/internal/shopify", () => ({
  BillingService: {
    getSubscription: vi.fn(),
    createSubscription: vi.fn(),
  },
}));

describe("BillingService", () => {
  it("should check subscription status", async () => {
    vi.mocked(ShopifyBilling.getSubscription).mockResolvedValue([{ id: "123", name: "Growth" }] as any);
    const result = await BillingService.checkSubscription({} as any);
    expect(result).toEqual({ id: "123", name: "Growth" });
  });

  it("should initiate upgrade", async () => {
    vi.mocked(ShopifyBilling.createSubscription).mockResolvedValue({ confirmationUrl: "https://auth.com" } as any);
    const result = await BillingService.upgrade({} as any, "Growth", "https://return.com");
    expect(result.confirmationUrl).toBe("https://auth.com");
  });
});
