import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../../app";
import AuditLog from "../../models/audit.model";
import * as redisConfig from "../../config/redis.config";

// Simulamos el middleware de autenticación para saltarnos la seguridad real.
// Inyectamos un usuario "admin" ficticio para tener permisos totales durante estas pruebas.
vi.mock("../../middleware/authentication.middleware", () => ({
  default: (req: any, res: any, next: any) => {
    req.staff = { _id: "admin_id", firstName: "TEST", lastName: "ADMIN", roleId: { level: 100 } };
    req.account = { id: "admin_id", name: "TEST ADMIN" };
    next();
  },
  requirePermission: () => (req: any, res: any, next: any) => next(),
}));

// Mockeamos Redis para evitar requerir una instancia real en ejecución durante las pruebas
// y para controlar determinísticamente cuándo hay aciertos (hits) o fallos (misses) de caché.
vi.mock("../../config/redis.config");

// Mock del modelo AuditLog para aislar el controlador de la base de datos real.
vi.mock("../../models/audit.model");

describe("Audit Controller - Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/audit", () => {
    it("debería retornar logs de auditoría paginados correctamente", async () => {
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

      // Simulamos "cache miss" (Redis retorna null) para forzar la consulta a la BD.
      (redisConfig.get as any).mockResolvedValue(null);
      (redisConfig.set as any).mockResolvedValue(undefined);

      // Simulamos la respuesta exitosa de la consulta de Mongoose.
      (AuditLog as any).find = vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          skip: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              lean: vi.fn().mockResolvedValue(mockLogs)
            })
          })
        })
      });
      (AuditLog as any).countDocuments = vi.fn().mockResolvedValue(2);

      const response = await request(app).get("/api/audit");

      expect(response.status).toBe(200);
      expect(response.body.logs).toEqual(mockLogs);
      expect(response.body.totalDocs).toBe(2);
      expect(response.body.currentPage).toBe(1);
    });

    it("debería retornar datos desde caché si están disponibles (optimizacion)", async () => {
      const cachedData = {
        logs: [{ _id: "cached", action: "CACHED" }],
        totalDocs: 1,
      };

      // Simulamos "cache hit" para verificar que NO se llame a la BD.
      (redisConfig.get as any).mockResolvedValue(cachedData);

      const response = await request(app).get("/api/audit");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(cachedData);
      // Prueba crítica: Asegurar que la BD no se toca si Redis responde.
      expect(AuditLog.find).not.toHaveBeenCalled();
    });

    it("debería filtrar correctamente por módulo", async () => {
      const mockPaginateResult = {
        docs: [],
        totalDocs: 0,
        totalPages: 0,
        page: 1,
      };

      (redisConfig.get as any).mockResolvedValue(null);
      (redisConfig.set as any).mockResolvedValue(undefined);
      (AuditLog as any).find = vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          skip: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              lean: vi.fn().mockResolvedValue([])
            })
          })
        })
      });
      (AuditLog as any).countDocuments = vi.fn().mockResolvedValue(0);

      await request(app).get("/api/audit?module=Users");

      expect(AuditLog.find).toHaveBeenCalledWith(
        { module: "USERS" }
      );
    });

    it("debería filtrar correctamente por rango de fechas", async () => {
      const mockPaginateResult = {
        docs: [],
        totalDocs: 0,
        totalPages: 0,
        page: 1,
      };

      (redisConfig.get as any).mockResolvedValue(null);
      (redisConfig.set as any).mockResolvedValue(undefined);
      (AuditLog as any).find = vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          skip: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              lean: vi.fn().mockResolvedValue([])
            })
          })
        })
      });
      (AuditLog as any).countDocuments = vi.fn().mockResolvedValue(0);

      await request(app).get(
        "/api/audit?startDate=2024-01-01&endDate=2024-12-31",
      );

      // Verificamos que se construya correctamente la query de MongoDB ($gte, $lte)
      expect(AuditLog.find).toHaveBeenCalledWith(
        expect.objectContaining({
          created_at: expect.objectContaining({
            $gte: expect.any(Date),
            $lte: expect.any(Date),
          }),
        })
      );
    });

    it("debería manejar errores de base de datos agraciadamente (Graceful Degredation)", async () => {
      (redisConfig.get as any).mockResolvedValue(null);
      // Simulamos un fallo catastrófico en la BD.
      (AuditLog as any).find = vi.fn().mockImplementation(() => {
        throw new Error("Database error");
      });

      const response = await request(app).get("/api/audit");

      // No queremos que el servidor "crashee", sino que retorne 500.
      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Database error");
    });
  });
});
