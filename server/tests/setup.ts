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

vi.mock("ioredis", () => {
  return {
    default: class Redis {
      constructor() {}
      on() {}
      quit() {}
    }
  };
});

vi.mock("../config/bullmq-connection", () => ({
  default: {
    on: vi.fn(),
    quit: vi.fn(),
  },
}));

vi.mock("../config/redis.config", () => ({
  default: {
    quit: vi.fn(),
    on: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  },
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  delPattern: vi.fn(),
}));

vi.mock("../queues/email.queue", () => ({
  emailQueue: {
    add: vi.fn().mockResolvedValue({ id: "mock_job_id" }),
    process: vi.fn(),
    on: vi.fn(),
    name: "emailQueue",
    getName: vi.fn().mockReturnValue("emailQueue"),
    opts: {},
    client: {},
  },
}));

vi.mock("@bull-board/api/bullMQAdapter", () => ({
  BullMQAdapter: class BullMQAdapter {
    constructor() {}
  }
}));

vi.mock("@bull-board/api", () => ({
  createBullBoard: vi.fn(),
}));

vi.mock("../queues/report.queue", () => ({
  reportClosureQueue: {
    add: vi.fn(),
    process: vi.fn(),
    on: vi.fn(),
    name: "reportClosureQueue",
    getName: vi.fn().mockReturnValue("reportClosureQueue"),
  },
  setupReportClosureWorker: vi.fn(),
}));
