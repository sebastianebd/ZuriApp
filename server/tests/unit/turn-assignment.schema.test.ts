import { describe, it, expect } from "vitest";
import { createTurnAssignmentSchema } from "../../schemas/turn-assignment.schema";

describe("TurnAssignment Schema Validation (TDD RED)", () => {
  it("debería rechazar un payload de creación que omita end_date", () => {
    const payload = {
      body: {
        staffId: "507f1f77bcf86cd799439011",
        service: "507f1f77bcf86cd799439022",
        turn_type: "507f1f77bcf86cd799439033",
        start_date: "2026-09-01T00:00:00.000Z",
      },
    };

    const result = createTurnAssignmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes("end_date"));
      expect(issue).toBeDefined();
    }
  });

  it("debería aceptar un payload con start_date y end_date completos en formato datetime ISO", () => {
    const payload = {
      body: {
        staffId: "507f1f77bcf86cd799439011",
        service: "507f1f77bcf86cd799439022",
        turn_type: "507f1f77bcf86cd799439033",
        start_date: "2026-09-01T00:00:00.000Z",
        end_date: "2026-09-30T23:59:59.999Z",
      },
    };

    const result = createTurnAssignmentSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });
});
