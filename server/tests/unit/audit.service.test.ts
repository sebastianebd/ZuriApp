import { describe, it, expect, vi, beforeEach } from "vitest";
import auditService from "../../services/audit.service";
import AuditLog from "../../models/audit.model";

// Mock del modelo AuditLog:
// Necesitamos simular tanto los métodos estáticos (find, countDocuments) como los de instancia (save).
// Usamos Object.assign para copiar las propiedades al "this" del mock, imitando el comportamiento del constructor de Mongoose.
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
  it("debería retornar un string vacío si no hay cambios", () => {
    const oldData = { nombre: "JUAN", apellido: "PEREZ" };
    const newData = { nombre: "JUAN", apellido: "PEREZ" };
    expect(auditService.generateDiff(oldData, newData)).toBe("");
  });

  it("debería detectar cambios en campos de tipo string", () => {
    const oldData = { nombre: "JUAN", apellido: "PEREZ" };
    const newData = { nombre: "JUAN", apellido: "SOTO" };
    expect(auditService.generateDiff(oldData, newData)).toBe(
      "apellido: PEREZ -> SOTO",
    );
  });

  it("debería ignorar claves restringidas como _id, password, etc.", () => {
    // Seguridad y Limpieza: No queremos exponer datos sensibles o técnicos en los logs de auditoría.
    const oldData = { _id: "123", password: "old", nombre: "JUAN" };
    const newData = { _id: "123", password: "new", nombre: "JUAN" };
    expect(auditService.generateDiff(oldData, newData)).toBe("");
  });

  it("debería detectar cambios en fechas", () => {
    const oldDate = new Date("2023-01-01T10:00:00Z");
    const newDate = new Date("2023-01-02T10:00:00Z");
    const oldData = { fecha: oldDate };
    const newData = { fecha: newDate };

    const result = auditService.generateDiff(oldData, newData);
    expect(result).toContain("fecha:");
    expect(result).toContain("->");
  });

  it("debería manejar valores nulos o indefinidos vs cadenas vacías", () => {
    const oldData = { direccion: null };
    const newData = { direccion: "" };
    expect(auditService.generateDiff(oldData, newData)).toBe("");
  });

  it("debería manejar múltiples cambios simultáneamente", () => {
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

  it("debería crear un registro de auditoría con todos los campos", async () => {
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

  it("debería manejar la falta de campos opcionales sin fallar", async () => {
    const mockUser = {
      _id: "user123",
      id: "user123",
      nombre: "Juan",
      apellido: "Pérez",
    };

    await auditService.logAction("READ", "Reports", mockUser, "Read report");

    expect(AuditLog).toHaveBeenCalled();
  });

  it("debería manejar cadenas de detalles muy largas", async () => {
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

  it("debería manejar caracteres especiales en los detalles (XSS/Injection prevention check)", async () => {
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

  it("no debería lanzar error si falla el guardado en AuditLog (Graceful Degradation)", async () => {
    // Resiliencia: Si el servicio de auditoría falla (ej. DB caída),
    // no deberíamos interrumpir la operación principal del usuario, aunque idealmente se alertaría.
    const mockUser = {
      _id: "user123",
      id: "user123",
      nombre: "Test",
      apellido: "User",
    };

    // Simular fallo en save
    const mockFailingSave = vi
      .fn()
      .mockRejectedValue(new Error("Database error"));
    (AuditLog as any).mockImplementationOnce(function (this: any, data: any) {
      Object.assign(this, data);
      this.save = mockFailingSave;
    });

    await expect(
      auditService.logAction("CREATE", "Test", mockUser, "Test action"),
    ).resolves.toBeUndefined();
  });
});

describe("Audit Service - getLogs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debería retornar logs paginados con parámetros por defecto", async () => {
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

  it("debería filtrar por módulo", async () => {
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

  it("debería filtrar por acción", async () => {
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

  it("debería filtrar por rango de fechas", async () => {
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

  it("debería manejar la paginación correctamente", async () => {
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

  it("debería ignorar filtros con valor 'TODOS'", async () => {
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

describe("Audit Service - generateDiff (Casos Adicionales)", () => {
  it("debería manejar cambios en objetos anidados", () => {
    const oldData = { config: { theme: "dark", lang: "es" } };
    const newData = { config: { theme: "light", lang: "es" } };
    const result = auditService.generateDiff(oldData, newData);
    expect(result).toContain("config:");
  });

  it("debería manejar cambios en arrays (secuencia)", () => {
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

  it("debería retornar string vacío para inputs nulos/indefinidos", () => {
    expect(auditService.generateDiff(null, { name: "test" })).toBe("");
    expect(auditService.generateDiff({ name: "test" }, null)).toBe("");
  });
});
