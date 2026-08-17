import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../../app";
import { TurnAssignmentModel } from "../../models/turn-assignment.model";
import TurnType from "../../models/turn-type.model";
import auditService from "../../services/audit.service";
import notificationService from "../../services/notification.service";

// Mock del middleware de autenticación:
// Necesario para que las rutas protegidas no rechacen las peticiones. Simulamos un ADMIN.
vi.mock("../../middleware/authentication.middleware", () => ({
  default: (req: any, res: any, next: any) => {
    req.staff = { _id: "admin_id", firstName: "TEST", lastName: "ADMIN", roleId: { level: 100 } };
    req.account = { id: "admin_id", name: "TEST ADMIN" };
    next();
  },
  requirePermission: () => (req: any, res: any, next: any) => next(),
}));

// Mock de dependencias (Modelos y Servicios):
// Usamos vi.mock para todos los modelos de Mongoose y servicios externos.
// Esto nos permite probar la lógica de los controladores (HTTP, Códigos de estado, Validación)
// sin depender de una base de datos real.
vi.mock("../../models/turn-assignment.model");
vi.mock("../../models/turn-type.model");
vi.mock("../../services/audit.service");
vi.mock("../../services/notification.service");
vi.mock("../../models/staff.model", async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    default: {
      findById: vi.fn().mockReturnValue({
        populate: vi.fn().mockResolvedValue({ _id: "user123", roleId: { level: 1 } })
      })
    }
  };
});

// Mock de la validación de período cerrado para evitar consultas a BD
vi.mock("../../middleware/period-lock.middleware", () => ({
  checkPeriodLock: vi.fn().mockResolvedValue(true),
}));

describe("Turn Assignment Controller - Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/assignments", () => {
    it("debería crear una nueva asignación de turno exitosamente", async () => {
      const mockTurnType = {
        _id: "turntype123",
        nombre: "DIURNO",
        toObject: () => ({
          secuencia: [{ dia: 1, turno: "D", color: "#fff" }],
        }),
      };

      const mockAssignment: any = {
        _id: "60c72b2f9b1d8b001c8e4a50",
        staffId: { _id: "user123", firstName: "Juan", lastName: "Pérez" },
        turn_type: "turntype123",
        start_date: "2024-01-01",
        end_date: "2024-12-31",
        toObject: () => ({ _id: "60c72b2f9b1d8b001c8e4a50" }),
      };

      mockAssignment.populate = vi.fn().mockResolvedValue(mockAssignment);

      (TurnType.findOne as any).mockResolvedValue(mockTurnType);
      (TurnAssignmentModel.findOne as any).mockResolvedValue(null); // No overlap
      (TurnAssignmentModel.create as any).mockResolvedValue(mockAssignment);
      (auditService.logAction as any).mockResolvedValue(undefined);
      (notificationService.notifyShiftAssignment as any).mockResolvedValue(
        undefined,
      );

      const response = await request(app).post("/api/assignments").send({
        staffId: "user123",
        turn_type: "DIURNO",
        start_date: "2024-01-01T00:00:00.000Z",
        end_date: "2024-12-31T23:59:59.999Z",
        service: "UCI",
      });

      expect(response.status).toBe(200);
      expect(TurnType.findOne).toHaveBeenCalled();
      expect(TurnAssignmentModel.create).toHaveBeenCalled();
    });

    it("debería retornar 404 si el tipo de turno no existe", async () => {
      (TurnType.findOne as any).mockResolvedValue(null);

      const response = await request(app).post("/api/assignments").send({
        staffId: "user123",
        turn_type: "INVALID",
        start_date: "2024-01-01T00:00:00.000Z",
        service: "UCI",
      });

      expect(response.status).toBe(404);
      expect(response.body.message).toContain("Tipo de turno no encontrado");
    });

    it("debería retornar 409 si existe traslape de asignaciones", async () => {
      const mockTurnType = {
        _id: "turntype123",
        nombre: "DIURNO",
        toObject: () => ({ secuencia: [] }),
      };

      const existingAssignment = {
        _id: "existing123",
        start_date: "2024-01-01",
        end_date: "2024-06-30",
      };

      (TurnType.findOne as any).mockResolvedValue(mockTurnType);
      // Simular que YA existe una asignación en ese rango (Conflicto)
      (TurnAssignmentModel.findOne as any).mockResolvedValue(
        existingAssignment,
      );

      const response = await request(app).post("/api/assignments").send({
        staffId: "user123",
        turn_type: "DIURNO",
        start_date: "2024-03-01T00:00:00.000Z",
        end_date: "2024-09-30T23:59:59.999Z",
        service: "UCI",
      });

      expect(response.status).toBe(409);
      expect(response.body.message).toContain("se traslapa");
    });
  });

  describe("GET /api/assignments", () => {
    it("debería retornar todas las asignaciones", async () => {
      const mockAssignments = [
        { _id: "1", staffId: "user1", service: "UCI" },
        { _id: "2", staffId: "user2", service: "Urgencias" },
      ];

      const mockQuery = {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockResolvedValue(mockAssignments),
      };

      (TurnAssignmentModel.find as any).mockReturnValue(mockQuery);

      const response = await request(app).get("/api/assignments");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockAssignments);
    });

    it("debería filtrar asignaciones por user_id", async () => {
      const mockQuery = {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockResolvedValue([]),
      };

      (TurnAssignmentModel.find as any).mockReturnValue(mockQuery);

      await request(app).get("/api/assignments?staffId=user123");

      expect(TurnAssignmentModel.find).toHaveBeenCalledWith({
        staffId: "user123",
      });
    });
  });

  describe("GET /api/assignments/:id", () => {
    it("debería retornar una asignación por ID", async () => {
      const mockAssignment = {
        _id: "60c72b2f9b1d8b001c8e4a50",
        staffId: "user123",
      };

      const mockQuery = {
        populate: vi.fn().mockResolvedValue(mockAssignment),
      };

      (TurnAssignmentModel.findById as any).mockReturnValue(mockQuery);

      const response = await request(app).get("/api/assignments/60c72b2f9b1d8b001c8e4a50");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockAssignment);
    });

    it("debería retornar 404 si la asignación no se encuentra", async () => {
      const mockQuery = {
        populate: vi.fn().mockResolvedValue(null),
      };

      (TurnAssignmentModel.findById as any).mockReturnValue(mockQuery);

      const response = await request(app).get("/api/assignments/60c72b2f9b1d8b001c8e4a51");

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Assignment not found");
    });
  });

  describe("PUT /api/assignments/:id", () => {
    it("debería actualizar una asignación existente", async () => {
      const updatedAssignment = {
        _id: "60c72b2f9b1d8b001c8e4a50",
        end_date: "2024-12-31",
      };

      const mockQuery = {
        populate: vi.fn().mockResolvedValue(updatedAssignment),
      };

      (TurnAssignmentModel.findById as any).mockReturnValue({
        populate: vi.fn().mockResolvedValue({ _id: "60c72b2f9b1d8b001c8e4a50", staffId: { roleId: { level: 1 } } })
      });
      (TurnAssignmentModel.findByIdAndUpdate as any).mockReturnValue(mockQuery);

      const response = await request(app)
        .put("/api/assignments/60c72b2f9b1d8b001c8e4a50")
        .send({ end_date: "2024-12-31T23:59:59.999Z" });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(updatedAssignment);
    });

    it("debería retornar 404 si intenta actualizar algo que no existe", async () => {
      const mockQuery = {
        populate: vi.fn().mockResolvedValue(null),
      };

      (TurnAssignmentModel.findById as any).mockReturnValue({
        populate: vi.fn().mockResolvedValue(null)
      });
      (TurnAssignmentModel.findByIdAndUpdate as any).mockReturnValue(mockQuery);

      const response = await request(app)
        .put("/api/assignments/60c72b2f9b1d8b001c8e4a51")
        .send({ end_date: "2024-12-31T23:59:59.999Z" });

      expect(response.status).toBe(404);
    });
  });

  describe("DELETE /api/assignments/:id", () => {
    it("debería eliminar una asignación", async () => {
      const deletedAssignment = { _id: "60c72b2f9b1d8b001c8e4a50" };

      (TurnAssignmentModel.findById as any).mockReturnValue({
        populate: vi.fn().mockResolvedValue({ _id: "60c72b2f9b1d8b001c8e4a50", staffId: { roleId: { level: 1 } } })
      });
      (TurnAssignmentModel.findByIdAndDelete as any).mockResolvedValue(
        deletedAssignment,
      );

      const response = await request(app).delete(
        "/api/assignments/60c72b2f9b1d8b001c8e4a50",
      );

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Assignment deleted successfully");
    });

    it("debería retornar 404 si intenta eliminar algo que no existe", async () => {
      (TurnAssignmentModel.findById as any).mockReturnValue({
        populate: vi.fn().mockResolvedValue(null)
      });
      (TurnAssignmentModel.findByIdAndDelete as any).mockResolvedValue(null);

      const response = await request(app).delete("/api/assignments/60c72b2f9b1d8b001c8e4a51");

      expect(response.status).toBe(404);
    });
  });
});
