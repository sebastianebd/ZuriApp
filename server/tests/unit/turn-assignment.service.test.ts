import { describe, it, expect, vi, beforeEach } from "vitest";
import turnAssignmentService from "../../services/turn-assignment.service";
import { TurnAssignmentModel } from "../../models/turn-assignment.model";
import TurnType from "../../models/turn-type.model";
import auditService from "../../services/audit.service";
import notificationService from "../../services/notification.service";
import { AppError } from "../../errors/app-error";

vi.mock("../../models/turn-assignment.model");
vi.mock("../../models/turn-type.model");
vi.mock("../../services/audit.service");
vi.mock("../../services/notification.service");

describe("Turn Assignment Service - Unit Tests (Overlap Logic)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockCurrentUser = { id: "admin1", name: "Admin Test" };

  it("debería crear una asignación si no hay solapamiento (happy path)", async () => {
    const payload = {
      staffId: "staff123",
      turn_type: "Mañana",
      start_date: "2024-01-01",
      end_date: "2024-12-31"
    };

    const mockTurnType = {
      _id: "turn1",
      nombre: "Mañana",
      toObject: () => ({
        secuencia: [{ day: 1, type: "Work", color: "blue" }]
      })
    };

    (TurnType.findOne as any).mockResolvedValue(mockTurnType);
    (TurnAssignmentModel.findOne as any).mockResolvedValue(null);

    const mockAssignment = {
      _id: "assign1",
      turn_type: "turn1",
      staffId: { _id: "staff123", firstName: "Juan", lastName: "Perez" },
      start_date: payload.start_date,
      end_date: payload.end_date,
      toObject: vi.fn().mockReturnValue({ _id: "assign1" }),
      populate: vi.fn().mockResolvedValue(true)
    };
    (TurnAssignmentModel.create as any).mockResolvedValue(mockAssignment);
    (notificationService.notifyShiftAssignment as any).mockResolvedValue(true);

    const result = await turnAssignmentService.createAssignment(payload, mockCurrentUser, 1);

    expect(TurnType.findOne).toHaveBeenCalled();
    expect(TurnAssignmentModel.findOne).toHaveBeenCalled();
    expect(TurnAssignmentModel.create).toHaveBeenCalledWith(expect.objectContaining({
      turn_type: "turn1",
      snapshot_secuencia: [{ day: 1, type: "Work" }]
    }));
    expect(result).toBe(mockAssignment);
  });

  it("debería lanzar 404 si el tipo de turno no existe", async () => {
    (TurnType.findOne as any).mockResolvedValue(null);

    const payload = { staffId: "staff1", turn_type: "Inexistente", start_date: "2024-01-01" };
    await expect(turnAssignmentService.createAssignment(payload, mockCurrentUser, 1))
      .rejects.toThrow(AppError);
    await expect(turnAssignmentService.createAssignment(payload, mockCurrentUser, 1))
      .rejects.toMatchObject({ status: 404 });
  });

  it("debería lanzar 409 si existe traslape de asignaciones (overlap)", async () => {
    (TurnType.findOne as any).mockResolvedValue({
      _id: "turn1",
      toObject: () => ({ secuencia: [] })
    });
    
    // Simula solapamiento
    (TurnAssignmentModel.findOne as any).mockResolvedValue({ _id: "overlap123" });

    const payload = { staffId: "staff1", turn_type: "Mañana", start_date: "2024-01-01" };
    
    await expect(turnAssignmentService.createAssignment(payload, mockCurrentUser, 1))
      .rejects.toThrow(AppError);
      
    await expect(turnAssignmentService.createAssignment(payload, mockCurrentUser, 1))
      .rejects.toMatchObject({ status: 409 });
  });
});
