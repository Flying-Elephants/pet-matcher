import { describe, it, expect, vi } from "vitest";
import { BulkOperationService } from "../internal/bulk";

describe("BulkOperationService", () => {
  const mockAdmin: any = {
    graphql: vi.fn(),
  };

  it("should trigger product sync mutation", async () => {
    mockAdmin.graphql.mockResolvedValueOnce({
      json: () => Promise.resolve({
        data: {
          bulkOperationRunQuery: {
            bulkOperation: { id: "1", status: "CREATED" },
            userErrors: []
          }
        }
      })
    });

    const result = await BulkOperationService.runProductSync(mockAdmin);
    expect(result?.bulkOperation?.status).toBe("CREATED");
  });

  it("should throw error on GraphQL errors", async () => {
    mockAdmin.graphql.mockResolvedValueOnce({
      json: () => Promise.resolve({
        errors: [{ message: "Access denied" }]
      })
    });

    await expect(BulkOperationService.runProductSync(mockAdmin)).rejects.toThrow("Access denied");
  });

  it("should return the status of current bulk operation", async () => {
    mockAdmin.graphql.mockResolvedValueOnce({
      json: () => Promise.resolve({
        data: {
          currentBulkOperation: { id: "2", status: "COMPLETED", objectCount: "100" }
        }
      })
    });

    const result = await BulkOperationService.getStatus(mockAdmin);
    expect(result?.status).toBe("COMPLETED");
    expect(result?.objectCount).toBe("100");
  });
});
