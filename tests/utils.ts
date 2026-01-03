import { vi } from "vitest";

const MOCK_SHOP = "test-shop.myshopify.com";
const MOCK_CUSTOMER_ID = "8005291409477";
const BASE_URL = "https://example.com";

export const createMockContext = (overrides: any = {}) => {
  return {
    params: {},
    context: {},
    ...overrides,
  };
};

export const createMockLoaderRequest = (url: string, method = "GET") => {
  return new Request(BASE_URL + url, { method });
};

export const createMockActionRequest = (url: string, formData: Record<string, string>) => {
  const fd = new FormData();
  for (const key in formData) {
    fd.append(key, formData[key]);
  }
  return new Request(BASE_URL + url, {
    method: "POST",
    body: fd,
  });
};

vi.mock("../../app/shopify.server", () => ({
  authenticate: {
    public: {
      appProxy: vi.fn().mockResolvedValue({
        session: { shop: MOCK_SHOP },
      }),
    },
  },
}));
