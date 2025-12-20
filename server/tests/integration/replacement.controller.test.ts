import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import replacementService from "../../services/replacement.service";
import auditService from "../../services/audit.service";
import app from "../../app";

// Mock middleware
vi.mock("../../middleware/authentication.middleware", () => ({
  default: (req: any, res: any, next: any) => {
    req.user = { _id: "admin_id", nombre: "TEST", apellido: "ADMIN" };
    next();
  },
}));

vi.mock("../../services/replacement.service");
vi.mock("../../services/audit.service");

describe("Replacement Controller - Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/reemplazos", () => {
    it("should create a replacement and log audit", async () => {
      const mockPayload = {
        nombre_saliente: "JUAN",
        apellido_saliente: "PEREZ",
        id_entrante: "user_id_123",
        // Add missing required fields to pass validation if any, primarily mocked service handles it.
      };

      const mockCreated = {
        _id: "rep_id_123",
        id_negocio: "RP24001",
        ...mockPayload,
      };

      (replacementService.registrar as any).mockResolvedValue(mockCreated);

      const response = await request(app)
        .post("/api/reemplazos")
        .send(mockPayload);

      expect(response.status).toBe(201);

      expect(replacementService.registrar).toHaveBeenCalledWith(mockPayload);

      expect(auditService.logAction).toHaveBeenCalledWith(
        "CREAR",
        "REEMPLAZOS",
        expect.anything(),
        expect.stringContaining(mockCreated.id_negocio),
        expect.anything(),
        mockCreated._id
      );
    });
  });

  describe("GET /api/reemplazos", () => {
    it("should return list of active replacements", async () => {
      const mockList = [{ id: 1 }, { id: 2 }];
      (replacementService.obtenerActivos as any).mockResolvedValue(mockList);

      const response = await request(app).get("/api/reemplazos");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockList);
    });
  });
});
