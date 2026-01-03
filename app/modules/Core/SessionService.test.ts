import { describe, it, expect, vi } from "vitest";
import { SessionService } from "./SessionService";
import db from "../../db.server";

vi.mock("../../db.server", () => ({
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
    expect(db.session.deleteMany).toHaveBeenCalledWith({
      where: { shop: "test.myshopify.com" },
    });
  });

  it("should update a session", async () => {
    const mockData = { scope: "read_products" };
    await SessionService.updateSession("123", mockData);
    expect(db.session.update).toHaveBeenCalledWith({
      where: { id: "123" },
      data: mockData,
    });
  });
});
