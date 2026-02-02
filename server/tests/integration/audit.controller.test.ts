import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../../app";
import AuditLog from "../../models/audit.model";
import * as redisConfig from "../../config/redis.config";

// Mock authentication middleware
vi.mock("../../middleware/authentication.middleware", () => ({
  default: (req: any, res: any, next: any) => {
    req.user = { _id: "admin_id", nombre: "TEST", apellido: "ADMIN" };
    next();
  },
  requirePermission: () => (req: any, res: any, next: any) => next(),
}));

// Mock Redis
vi.mock("../../config/redis.config");

// Mock AuditLog model
vi.mock("../../models/audit.model");

describe("Audit Controller - Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/audit", () => {
    it("should return paginated audit logs", async () => {
      const mockLogs = [
        { _id: "1", action: "CREATE", module: "Users", userId: "user1" },
        { _id: "2", action: "UPDATE", module: "Replacements", userId: "user2" },
      ];

      const mockPaginateResult = {
        docs: mockLogs,
        totalDocs: 2,
        totalPages: 1,
        page: 1,
      };

      // Mock Redis cache miss
      (redisConfig.get as any).mockResolvedValue(null);
      (redisConfig.set as any).mockResolvedValue(undefined);

      // Mock paginate
      (AuditLog as any).paginate = vi
        .fn()
        .mockResolvedValue(mockPaginateResult);

      const response = await request(app).get("/api/audit");

      expect(response.status).toBe(200);
      expect(response.body.logs).toEqual(mockLogs);
      expect(response.body.totalDocs).toBe(2);
      expect(response.body.currentPage).toBe(1);
    });

    it("should return cached data if available", async () => {
      const cachedData = {
        logs: [{ _id: "cached", action: "CACHED" }],
        totalDocs: 1,
      };

      (redisConfig.get as any).mockResolvedValue(cachedData);

      const response = await request(app).get("/api/audit");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(cachedData);
      expect(AuditLog.paginate).not.toHaveBeenCalled();
    });

    it("should filter by module", async () => {
      const mockPaginateResult = {
        docs: [],
        totalDocs: 0,
        totalPages: 0,
        page: 1,
      };

      (redisConfig.get as any).mockResolvedValue(null);
      (redisConfig.set as any).mockResolvedValue(undefined);
      (AuditLog as any).paginate = vi
        .fn()
        .mockResolvedValue(mockPaginateResult);

      await request(app).get("/api/audit?module=Users");

      expect(AuditLog.paginate).toHaveBeenCalledWith(
        { module: "Users" },
        expect.any(Object),
      );
    });

    it("should filter by date range", async () => {
      const mockPaginateResult = {
        docs: [],
        totalDocs: 0,
        totalPages: 0,
        page: 1,
      };

      (redisConfig.get as any).mockResolvedValue(null);
      (redisConfig.set as any).mockResolvedValue(undefined);
      (AuditLog as any).paginate = vi
        .fn()
        .mockResolvedValue(mockPaginateResult);

      await request(app).get(
        "/api/audit?startDate=2024-01-01&endDate=2024-12-31",
      );

      expect(AuditLog.paginate).toHaveBeenCalledWith(
        expect.objectContaining({
          created_at: expect.objectContaining({
            $gte: expect.any(Date),
            $lte: expect.any(Date),
          }),
        }),
        expect.any(Object),
      );
    });

    it("should handle errors gracefully", async () => {
      (redisConfig.get as any).mockResolvedValue(null);
      (AuditLog as any).paginate = vi
        .fn()
        .mockRejectedValue(new Error("Database error"));

      const response = await request(app).get("/api/audit");

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Error al obtener logs de auditoría");
    });
  });
});
