import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../../app";
import { TurnAssignmentModel } from "../../models/turn-assignment.model";
import TurnType from "../../models/turn-type.model";
import auditService from "../../services/audit.service";
import notificationService from "../../services/notification.service";

// Mock authentication middleware
vi.mock("../../middleware/authentication.middleware", () => ({
  default: (req: any, res: any, next: any) => {
    req.user = { _id: "admin_id", nombre: "TEST", apellido: "ADMIN" };
    next();
  },
  requirePermission: () => (req: any, res: any, next: any) => next(),
}));

// Mock dependencies
vi.mock("../../models/turn-assignment.model");
vi.mock("../../models/turn-type.model");
vi.mock("../../services/audit.service");
vi.mock("../../services/notification.service");

describe("Turn Assignment Controller - Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/assignments", () => {
    it("should create a new turn assignment", async () => {
      const mockTurnType = {
        _id: "turntype123",
        nombre: "DIURNO",
        toObject: () => ({
          secuencia: [{ dia: 1, turno: "D", color: "#fff" }],
        }),
      };

      const mockAssignment: any = {
        _id: "assignment123",
        user_id: { _id: "user123", nombre: "Juan", apellido: "Pérez" },
        turn_type: "turntype123",
        start_date: "2024-01-01",
        end_date: "2024-12-31",
        toObject: () => ({ _id: "assignment123" }),
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
        user_id: "user123",
        turn_type: "DIURNO",
        start_date: "2024-01-01T00:00:00.000Z",
        end_date: "2024-12-31T23:59:59.999Z",
        service: "UCI",
      });

      expect(response.status).toBe(200);
      expect(TurnType.findOne).toHaveBeenCalled();
      expect(TurnAssignmentModel.create).toHaveBeenCalled();
    });

    it("should return 404 if turn type not found", async () => {
      (TurnType.findOne as any).mockResolvedValue(null);

      const response = await request(app).post("/api/assignments").send({
        user_id: "user123",
        turn_type: "INVALID",
        start_date: "2024-01-01T00:00:00.000Z",
        service: "UCI",
      });

      expect(response.status).toBe(404);
      expect(response.body.message).toContain("Tipo de turno no encontrado");
    });

    it("should return 409 on overlapping assignments", async () => {
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
      (TurnAssignmentModel.findOne as any).mockResolvedValue(
        existingAssignment,
      );

      const response = await request(app).post("/api/assignments").send({
        user_id: "user123",
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
    it("should return all assignments", async () => {
      const mockAssignments = [
        { _id: "1", user_id: "user1", service: "UCI" },
        { _id: "2", user_id: "user2", service: "Urgencias" },
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

    it("should filter by user_id", async () => {
      const mockQuery = {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockResolvedValue([]),
      };

      (TurnAssignmentModel.find as any).mockReturnValue(mockQuery);

      await request(app).get("/api/assignments?user_id=user123");

      expect(TurnAssignmentModel.find).toHaveBeenCalledWith({
        user_id: "user123",
      });
    });
  });

  describe("GET /api/assignments/:id", () => {
    it("should return assignment by id", async () => {
      const mockAssignment = {
        _id: "assignment123",
        user_id: "user123",
      };

      const mockQuery = {
        populate: vi.fn().mockResolvedValue(mockAssignment),
      };

      (TurnAssignmentModel.findById as any).mockReturnValue(mockQuery);

      const response = await request(app).get("/api/assignments/assignment123");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockAssignment);
    });

    it("should return 404 if assignment not found", async () => {
      const mockQuery = {
        populate: vi.fn().mockResolvedValue(null),
      };

      (TurnAssignmentModel.findById as any).mockReturnValue(mockQuery);

      const response = await request(app).get("/api/assignments/invalid123");

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Assignment not found");
    });
  });

  describe("PUT /api/assignments/:id", () => {
    it("should update assignment", async () => {
      const updatedAssignment = {
        _id: "assignment123",
        end_date: "2024-12-31",
      };

      const mockQuery = {
        populate: vi.fn().mockResolvedValue(updatedAssignment),
      };

      (TurnAssignmentModel.findByIdAndUpdate as any).mockReturnValue(mockQuery);

      const response = await request(app)
        .put("/api/assignments/assignment123")
        .send({ end_date: "2024-12-31T23:59:59.999Z" });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(updatedAssignment);
    });

    it("should return 404 if assignment not found", async () => {
      const mockQuery = {
        populate: vi.fn().mockResolvedValue(null),
      };

      (TurnAssignmentModel.findByIdAndUpdate as any).mockReturnValue(mockQuery);

      const response = await request(app)
        .put("/api/assignments/invalid123")
        .send({ end_date: "2024-12-31T23:59:59.999Z" });

      expect(response.status).toBe(404);
    });
  });

  describe("DELETE /api/assignments/:id", () => {
    it("should delete assignment", async () => {
      const deletedAssignment = { _id: "assignment123" };

      (TurnAssignmentModel.findByIdAndDelete as any).mockResolvedValue(
        deletedAssignment,
      );

      const response = await request(app).delete(
        "/api/assignments/assignment123",
      );

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Assignment deleted successfully");
    });

    it("should return 404 if assignment not found", async () => {
      (TurnAssignmentModel.findByIdAndDelete as any).mockResolvedValue(null);

      const response = await request(app).delete("/api/assignments/invalid123");

      expect(response.status).toBe(404);
    });
  });
});
