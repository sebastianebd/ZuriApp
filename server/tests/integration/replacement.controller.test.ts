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
  requirePermission: () => (req: any, res: any, next: any) => next(),
}));

vi.mock("../../services/replacement.service");
vi.mock("../../services/audit.service");
vi.mock("../../services/notification.service", () => ({
  default: {
    notifyReplacement: vi.fn(),
  },
}));

describe("Replacement Controller - Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/reemplazos", () => {
    it("should create a replacement and log audit", async () => {
      const mockPayload = {
        id_saliente: "507f1f77bcf86cd799439011",
        rut_saliente: "12345678-9",
        nombre_saliente: "JUAN",
        apellido_saliente: "PEREZ",
        id_entrante: "507f1f77bcf86cd799439012",
        rut_entrante: "87654321-0",
        nombre_entrante: "PEDRO",
        apellido_entrante: "GOMEZ",
        tipo_turno: "DIURNO",
        fecha_inicio: "2024-01-01",
        fecha_termino: "2024-01-15",
        servicio: "MEDICINA",
        creado_por: "507f1f77bcf86cd799439013",
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
