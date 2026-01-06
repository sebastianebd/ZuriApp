import { vi } from "vitest";

// Mock environment variables
process.env.RESEND_API_KEY = "re_test_123456789";

// Mock Resend library globally
vi.mock("resend", () => {
  return {
    Resend: class {
      emails = {
        send: vi
          .fn()
          .mockResolvedValue({ data: { id: "mock_id" }, error: null }),
      };
    },
  };
});
