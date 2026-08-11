import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import replacementService from "../../services/replacement.service";
import auditService from "../../services/audit.service";
import socketService from "../../services/socket.service";
import app from "../../app";

// Mock del middleware de autenticación:
// Simulamos un usuario admin autenticado para saltar la validación de JWT y permisos en estas pruebas de integración.
vi.mock("../../middleware/authentication.middleware", () => ({
  default: (req: any, res: any, next: any) => {
    req.staff = { _id: "admin_id", firstName: "TEST", lastName: "ADMIN", roleId: { level: 100 } };
    req.account = { id: "admin_id", name: "TEST ADMIN" };
    next();
  },
  requirePermission: () => (req: any, res: any, next: any) => next(),
}));

// Mock de servicios:
// Aislamos el controlador de la lógica de negocio compleja (Service Layer) y dependencias externas.
vi.mock("../../services/replacement.service");
vi.mock("../../services/audit.service");

// Mock de notificaciones:
// Evitamos el envío real de correos o notificaciones push durante la ejecución de tests.
vi.mock("../../services/notification.service", () => ({
  default: {
    notifyReplacement: vi.fn(),
  },
}));

// Mock de WebSockets:
// Prevenimos intentos de conexión o emisión de eventos socket.io que fallarían sin un servidor real levantado.
vi.mock("../../services/socket.service", () => ({
  default: {
    emitTurnUpdate: vi.fn(),
    emitHistoryUpdate: vi.fn(),
  },
}));

// Mock de Redis:
// Control total sobre el caché para evitar flakiness por timeouts o estado compartido.
vi.mock("../../config/redis.config", () => ({
  get: vi.fn(),
  set: vi.fn(),
  delPattern: vi.fn(),
  // Simular limpieza de caché
}));

// Mock de la validación de período cerrado para evitar consultas a BD
vi.mock("../../middleware/period-lock.middleware", () => ({
  checkPeriodLock: vi.fn().mockResolvedValue(true),
}));

describe("Replacement Controller - Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/reemplazos", () => {
    it("debería crear un reemplazo y registrar la auditoría correspondiente", async () => {
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

      // Verificación de Cumplimiento (Compliance):
      // Es crítico asegurar que cada acción de escritura deje un rastro de auditoría.
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
    it("debería retornar la lista de reemplazos activos paginados", async () => {
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
    it("debería actualizar un reemplazo y registrar auditoría", async () => {
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
    it("debería finalizar un reemplazo y auditar el cambio de estado", async () => {
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
    it("debería anular un reemplazo (lógica de negocio) y auditar", async () => {
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
    it("debería procesar una sustitución compleja y auditar la operación", async () => {
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
    it("debería retornar el historial paginado de reemplazos inactivos", async () => {
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

  describe("GET /api/reemplazos/:id (Historial Usuario)", () => {
    it("debería retornar el historial de un usuario específico", async () => {
      const mockResult = [{ id: "hist_user_1" }];
      // Usamos un ObjectId válido para asegurar que pase cualquier validación de Mongoose,
      // aunque en la práctica el servicio determina como buscarlo.
      const userId = "507f1f77bcf86cd799439099";

      (replacementService.obtenerHistorialStaff as any).mockResolvedValue(
        mockResult,
      );

      const response = await request(app).get(`/api/reemplazos/${userId}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResult);
    });
  });
});
