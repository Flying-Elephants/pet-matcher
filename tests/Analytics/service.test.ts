import { describe, it, expect, vi } from "vitest";
import { AnalyticsService } from "../../app/modules/Analytics";
import { AnalyticsDb } from "../../app/modules/Analytics/internal/db";

vi.mock("../../app/modules/Analytics/internal/db", () => ({
  AnalyticsDb: {
    getSummary: vi.fn(),
  },
}));

describe("AnalyticsService", () => {
  it("should return summary for a shop", async () => {
    const mockSummary = { 
        totalMatches: 10, 
        activeRules: 2, 
        popularBreeds: [],
        syncedProductsCount: 50
    };
    vi.mocked(AnalyticsDb.getSummary).mockResolvedValue(mockSummary);

    const result = await AnalyticsService.getSummary("test.myshopify.com");
    expect(result).toEqual(mockSummary);
    expect(AnalyticsDb.getSummary).toHaveBeenCalledWith("test.myshopify.com");
  });
});
