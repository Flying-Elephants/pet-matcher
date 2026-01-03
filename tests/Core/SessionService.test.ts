import { describe, it, expect, vi } from "vitest";
import { SessionService } from "../../app/modules/Core/SessionService";
import db from "../../app/db.server";

vi.mock("../../app/db.server", () => ({
  default: {
    session: {
      deleteMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe("SessionService", () => {
  it("should delete sessions for a shop", async () => {
    await SessionService.deleteSessions("test.myshopify.com");
    expect(db.session.deleteMany).toHaveBeenCalledWith({ where: { shop: "test.myshopify.com" } });
  });

  it("should update session", async () => {
    const mockData = { state: "new-state" };
    await SessionService.updateSession("test-id", mockData);
    expect(db.session.update).toHaveBeenCalledWith({
      where: { id: "test-id" },
      data: mockData,
    });
  });
});
