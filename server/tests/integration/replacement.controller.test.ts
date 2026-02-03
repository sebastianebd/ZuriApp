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
vi.mock("../../services/socket.service", () => ({
  default: {
    emitTurnUpdate: vi.fn(),
    emitHistoryUpdate: vi.fn(),
  },
}));

vi.mock("../../config/redis.config", () => ({
  get: vi.fn(),
  set: vi.fn(),
  delPattern: vi.fn(),
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
        "Reemplazos Activos",
        expect.anything(),
        expect.stringContaining(mockCreated.id_negocio),
        expect.anything(),
        mockCreated._id,
      );
    });
  });

  describe("GET /api/reemplazos", () => {
    it("should return list of active replacements", async () => {
      const mockList = [{ id: 1 }, { id: 2 }];
      const mockResult = {
        reemplazos: mockList,
        pagination: { totalItems: 2 },
      };
      (replacementService.obtenerActivosPaginado as any).mockResolvedValue(
        mockResult,
      );

      const response = await request(app).get("/api/reemplazos");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResult);
    });
  });

  describe("PUT /api/reemplazos/:id", () => {
    it("should update replacement and log audit", async () => {
      const mockId = "507f1f77bcf86cd799439011";
      const mockUpdate = { fecha_termino: "2024-02-01" };
      const mockOriginal = {
        _id: mockId,
        fecha_termino: "2024-01-15",
        id_negocio: "RP1",
      };

      (replacementService.obtenerPorId as any).mockResolvedValue(mockOriginal);
      (replacementService.actualizar as any).mockResolvedValue({
        ...mockOriginal,
        ...mockUpdate,
      });

      const response = await request(app)
        .put(`/api/reemplazos/${mockId}`)
        .send(mockUpdate);

      expect(response.status).toBe(200);
      expect(replacementService.actualizar).toHaveBeenCalledWith(
        mockId,
        mockUpdate,
      );
      expect(auditService.logAction).toHaveBeenCalledWith(
        "MODIFICAR",
        "Reemplazos Activos",
        expect.anything(), // user
        expect.stringContaining("Se modificó el reemplazo"),
        expect.anything(), // body
        mockId,
      );
    });
  });

  describe("PUT /api/reemplazos/finalizar/:id", () => {
    it("should finalize replacement and log audit", async () => {
      const mockId = "507f1f77bcf86cd799439011";
      const mockOriginal = { _id: mockId, status: "ACTIVO", id_negocio: "RP2" };

      (replacementService.obtenerPorId as any).mockResolvedValue(mockOriginal);
      (replacementService.finalizarReemplazo as any).mockResolvedValue({
        ...mockOriginal,
        status: "FINALIZADO",
      });

      const response = await request(app).put(
        `/api/reemplazos/finalizar/${mockId}`,
      );

      expect(response.status).toBe(200);
      expect(auditService.logAction).toHaveBeenCalledWith(
        "FINALIZAR",
        "Reemplazos Activos",
        expect.anything(),
        expect.stringContaining("Se finalizó el reemplazo"),
        null,
        mockId,
      );
    });
  });

  describe("PUT /api/reemplazos/anular/:id", () => {
    it("should annul replacement and log audit", async () => {
      const mockId = "507f1f77bcf86cd799439011";
      const mockOriginal = { _id: mockId, status: "ACTIVO", id_negocio: "RP3" };

      (replacementService.obtenerPorId as any).mockResolvedValue(mockOriginal);
      (replacementService.anularReemplazo as any).mockResolvedValue({
        ...mockOriginal,
        status: "ANULADO",
      });

      const response = await request(app).put(
        `/api/reemplazos/anular/${mockId}`,
      );

      expect(response.status).toBe(200);
      expect(auditService.logAction).toHaveBeenCalledWith(
        "ANULAR",
        "Reemplazos Activos",
        expect.anything(),
        expect.stringContaining("Se anuló el reemplazo"),
        null,
        mockId,
      );
    });
  });

  describe("POST /api/reemplazos/sustituir", () => {
    it("should process substitution and log audit", async () => {
      const mockPayload = {
        id_registro_a: "507f1f77bcf86cd799439011",
        fecha_corte_a: "2024-06-01",
        nuevo_entrante: {
          id_entrante: "507f1f77bcf86cd799439012",
          rut_entrante: "12345678-9",
          nombre_entrante: "New",
          apellido_entrante: "User",
        },
        datos_base_evento: {
          id_evento_principal: "EVT1",
          id_saliente: "507f1f77bcf86cd799439013",
          rut_saliente: "98765432-1",
          nombre_saliente: "Old",
          apellido_saliente: "User",
          tipo_cargo: "TENS",
          tipo_turno: "DIURNO",
          servicio: "UCI",
          fecha_termino_original: "2024-12-31",
        },
      };

      const mockOld = {
        _id: "507f1f77bcf86cd799439011",
        id_negocio: "RP_A",
        nombre_entrante: "UserA",
        apellido_entrante: "LastA",
      };
      const mockNew = {
        _id: "507f1f77bcf86cd799439099",
        nombre_entrante: "New",
        apellido_entrante: "User",
      };

      (replacementService.sustituir as any).mockResolvedValue([
        mockOld,
        mockNew,
      ]);

      const response = await request(app)
        .post("/api/reemplazos/sustituir")
        .send(mockPayload);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        mensaje: "Sustitución procesada exitosamente.",
        registro_anterior: mockOld,
        nuevo_registro: mockNew,
      });

      expect(auditService.logAction).toHaveBeenCalledWith(
        "SUSTITUCION",
        "Reemplazos Activos",
        expect.anything(),
        expect.stringContaining("Se sustituyó el reemplazo"),
        mockPayload,
        mockPayload.id_registro_a,
      );
    });
  });

  describe("GET /api/reemplazos/historial-paginado", () => {
    it("should return paginated history", async () => {
      const mockResult = {
        reemplazos: [{ id: "hist1" }],
        pagination: { total: 1 },
      };
      (replacementService.obtenerInactivosPaginados as any).mockResolvedValue(
        mockResult,
      );

      const response = await request(app).get(
        "/api/reemplazos/historial-paginado",
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResult);
    });
  });

  describe("GET /api/reemplazos/:id (User History)", () => {
    it("should return user history", async () => {
      const mockResult = [{ id: "hist_user_1" }];
      // ID doesn't need to be ObjectId for this specific route if the controller/service handles it,
      // but if validation middleware runs, it needs to be valid.
      // Route `GET /:id` uses `requirePermission` but NO `validateSchema`.
      // So "user123" might work if service accepts it.
      // But let's use a valid ObjectId just in case.
      const userId = "507f1f77bcf86cd799439099";

      (replacementService.obtenerHistorialUsuario as any).mockResolvedValue(
        mockResult,
      );

      const response = await request(app).get(`/api/reemplazos/${userId}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResult);
    });
  });
});
