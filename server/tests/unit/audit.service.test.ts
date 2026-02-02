import { describe, it, expect, vi, beforeEach } from "vitest";
import auditService from "../../services/audit.service";
import AuditLog from "../../models/audit.model";

// Mock AuditLog model with constructor and static methods
vi.mock("../../models/audit.model", () => {
  const mockSave = vi.fn().mockResolvedValue({ _id: "log123" });
  return {
    default: Object.assign(
      vi.fn(function (this: any, data: any) {
        Object.assign(this, data);
        this.save = mockSave;
      }),
      {
        find: vi.fn(),
        countDocuments: vi.fn(),
      },
    ),
  };
});

describe("Audit Service - generateDiff", () => {
  it("should return an empty string if there are no changes", () => {
    const oldData = { nombre: "JUAN", apellido: "PEREZ" };
    const newData = { nombre: "JUAN", apellido: "PEREZ" };
    expect(auditService.generateDiff(oldData, newData)).toBe("");
  });

  it("should detect changes in string fields", () => {
    const oldData = { nombre: "JUAN", apellido: "PEREZ" };
    const newData = { nombre: "JUAN", apellido: "SOTO" };
    expect(auditService.generateDiff(oldData, newData)).toBe(
      "apellido: PEREZ -> SOTO",
    );
  });

  it("should ignore restricted keys like _id, password, etc.", () => {
    const oldData = { _id: "123", password: "old", nombre: "JUAN" };
    const newData = { _id: "123", password: "new", nombre: "JUAN" };
    expect(auditService.generateDiff(oldData, newData)).toBe("");
  });

  it("should detect changes in dates", () => {
    const oldDate = new Date("2023-01-01T10:00:00Z");
    const newDate = new Date("2023-01-02T10:00:00Z");
    const oldData = { fecha: oldDate };
    const newData = { fecha: newDate };

    const result = auditService.generateDiff(oldData, newData);
    expect(result).toContain("fecha:");
    expect(result).toContain("->");
  });

  it("should handle null or undefined vs empty values gracefully", () => {
    const oldData = { direccion: null };
    const newData = { direccion: "" };
    expect(auditService.generateDiff(oldData, newData)).toBe("");
  });

  it("should handle multiple changes", () => {
    const oldData = { nombre: "JUAN", ciudad: "SANTIAGO" };
    const newData = { nombre: "PEDRO", ciudad: "VALPARAISO" };
    const result = auditService.generateDiff(oldData, newData);
    expect(result).toBe(
      "nombre: JUAN -> PEDRO, ciudad: SANTIAGO -> VALPARAISO",
    );
  });
});

describe("Audit Service - logAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create audit log with all fields", async () => {
    const mockUser = {
      _id: "user123",
      id: "user123",
      nombre: "Juan",
      apellido: "Pérez",
    };

    await auditService.logAction(
      "CREATE",
      "Users",
      mockUser,
      "Created new user",
      { userId: "user456" },
      "record123",
    );

    expect(AuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "CREATE",
        module: "Users",
        user_id: "user123",
        user_name: "Juan Pérez",
        description: "Created new user",
        details: { userId: "user456" },
        resource_id: "record123",
      }),
    );
  });

  it("should handle missing optional fields gracefully", async () => {
    const mockUser = {
      _id: "user123",
      id: "user123",
      nombre: "Juan",
      apellido: "Pérez",
    };

    await auditService.logAction("READ", "Reports", mockUser, "Read report");

    expect(AuditLog).toHaveBeenCalled();
  });

  it("should handle very long detail strings", async () => {
    const mockUser = {
      _id: "user123",
      id: "user123",
      nombre: "Test",
      apellido: "User",
    };

    const longDetails = "A".repeat(10000);

    await auditService.logAction("UPDATE", "Config", mockUser, longDetails);

    expect(AuditLog).toHaveBeenCalled();
  });

  it("should handle special characters in details", async () => {
    const mockUser = {
      _id: "user123",
      id: "user123",
      nombre: "Test",
      apellido: "User",
    };

    const specialDetails = 'Details with "quotes" and <tags> and & symbols';

    await auditService.logAction("DELETE", "Items", mockUser, specialDetails);

    expect(AuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        description: specialDetails,
      }),
    );
  });

  it("should not throw if AuditLog save fails (graceful degradation)", async () => {
    const mockUser = {
      _id: "user123",
      id: "user123",
      nombre: "Test",
      apellido: "User",
    };

    // Mock save to fail
    const mockFailingSave = vi
      .fn()
      .mockRejectedValue(new Error("Database error"));
    (AuditLog as any).mockImplementationOnce(function (this: any, data: any) {
      Object.assign(this, data);
      this.save = mockFailingSave;
    });

    // Should not throw
    await expect(
      auditService.logAction("CREATE", "Test", mockUser, "Test action"),
    ).resolves.toBeUndefined();
  });
});

describe("Audit Service - getLogs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return paginated logs with default parameters", async () => {
    const mockLogs = [
      { _id: "log1", action: "CREATE", module: "Users" },
      { _id: "log2", action: "UPDATE", module: "Users" },
    ];

    (AuditLog.find as any).mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      populate: vi.fn().mockResolvedValue(mockLogs),
    });
    (AuditLog.countDocuments as any).mockResolvedValue(2);

    const result = await auditService.getLogs();

    expect(result.logs).toEqual(mockLogs);
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.totalPages).toBe(1);
  });

  it("should filter by module", async () => {
    (AuditLog.find as any).mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      populate: vi.fn().mockResolvedValue([]),
    });
    (AuditLog.countDocuments as any).mockResolvedValue(0);

    await auditService.getLogs({ module: "Users" });

    expect(AuditLog.find).toHaveBeenCalledWith(
      expect.objectContaining({ module: "Users" }),
    );
  });

  it("should filter by action", async () => {
    (AuditLog.find as any).mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      populate: vi.fn().mockResolvedValue([]),
    });
    (AuditLog.countDocuments as any).mockResolvedValue(0);

    await auditService.getLogs({ action: "CREATE" });

    expect(AuditLog.find).toHaveBeenCalledWith(
      expect.objectContaining({ action: "CREATE" }),
    );
  });

  it("should filter by date range", async () => {
    (AuditLog.find as any).mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      populate: vi.fn().mockResolvedValue([]),
    });
    (AuditLog.countDocuments as any).mockResolvedValue(0);

    await auditService.getLogs({
      startDate: "2024-01-01",
      endDate: "2024-12-31",
    });

    expect(AuditLog.find).toHaveBeenCalledWith(
      expect.objectContaining({
        created_at: expect.any(Object),
      }),
    );
  });

  it("should handle pagination correctly", async () => {
    (AuditLog.find as any).mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      populate: vi.fn().mockResolvedValue([]),
    });
    (AuditLog.countDocuments as any).mockResolvedValue(100);

    const result = await auditService.getLogs({}, 2, 10);

    expect(result.page).toBe(2);
    expect(result.totalPages).toBe(10);
  });

  it("should ignore TODOS filter values", async () => {
    (AuditLog.find as any).mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      populate: vi.fn().mockResolvedValue([]),
    });
    (AuditLog.countDocuments as any).mockResolvedValue(0);

    await auditService.getLogs({ module: "TODOS", action: "TODOS" });

    expect(AuditLog.find).toHaveBeenCalledWith({});
  });
});

describe("Audit Service - generateDiff (Additional Cases)", () => {
  it("should handle object changes", () => {
    const oldData = { config: { theme: "dark", lang: "es" } };
    const newData = { config: { theme: "light", lang: "es" } };
    const result = auditService.generateDiff(oldData, newData);
    expect(result).toContain("config:");
  });

  it("should handle array changes in secuencia", () => {
    const oldData = {
      secuencia: [
        {
          dia: 1,
          sigla: "D",
          turno_entrada: "08:00",
          turno_salida: "16:00",
          es_libre: false,
        },
      ],
    };
    const newData = {
      secuencia: [
        {
          dia: 1,
          sigla: "N",
          turno_entrada: "20:00",
          turno_salida: "08:00",
          es_libre: false,
        },
      ],
    };
    const result = auditService.generateDiff(oldData, newData);
    expect(result).toContain("Día 1:");
    expect(result).toContain("Sigla:");
  });

  it("should return empty string for null/undefined inputs", () => {
    expect(auditService.generateDiff(null, { name: "test" })).toBe("");
    expect(auditService.generateDiff({ name: "test" }, null)).toBe("");
  });
});
