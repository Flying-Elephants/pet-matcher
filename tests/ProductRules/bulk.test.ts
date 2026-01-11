import { describe, it, expect, vi } from "vitest";
import { BulkOperationService } from "../../app/modules/ProductRules/internal/bulk";

describe("BulkOperationService", () => {
  it("should parse status correctly", async () => {
    const mockAdmin = {
      graphql: vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          data: {
            currentBulkOperation: {
              id: "gid://shopify/BulkOperation/1",
              status: "RUNNING",
              objectCount: "100",
              createdAt: "2023-01-01T00:00:00Z"
            }
          }
        })
      })
    };

    const status = await BulkOperationService.getStatus(mockAdmin as any);
    expect(status?.status).toBe("RUNNING");
    expect(status?.objectCount).toBe("100");
  });

  it("should handle null operation", async () => {
    const mockAdmin = {
      graphql: vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          data: {
            currentBulkOperation: null
          }
        })
      })
    };

    const status = await BulkOperationService.getStatus(mockAdmin as any);
    expect(status).toBeNull();
  });
});
