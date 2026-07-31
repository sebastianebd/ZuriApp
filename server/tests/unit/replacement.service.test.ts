import { describe, it, expect, vi, beforeEach } from "vitest";
import replacementService from "../../services/replacement.service";
import Reemplazo from "../../models/replacement.model";

// Mock de Dependencias:
// Mockeamos totalmente el modelo Mongoose 'Reemplazo' y 'TurnType' para que las pruebas unitarias
// no dependan de una conexión a base de datos.
vi.mock("../../models/replacement.model", () => ({
  default: Object.assign(
    vi.fn(), // Constructor
    {
      find: vi.fn(),
      findById: vi.fn(),
      findByIdAndUpdate: vi.fn(),
      countDocuments: vi.fn(),
    },
  ),
}));
vi.mock("../../models/turn-type.model", () => ({
  default: {
    findOne: vi.fn(),
  },
}));

describe("Replacement Service - Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("registrar()", () => {
    it("debería crear un reemplazo con estado PENDIENTE para una fecha futura", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      const mockData = {
        fecha_inicio: futureDate.toISOString(),
        fecha_termino: new Date(
          futureDate.getTime() + 86400000 * 30,
        ).toISOString(),
        tipo_turno: "DIURNO",
        servicio: "UCI",
      };

      const mockTurnType = {
        _id: "turntype123",
        nombre: "DIURNO",
        toObject: () => ({
          secuencia: [{ dia: 1, turno: "D", color: "#fff" }],
        }),
      };

      const mockSavedReplacement = {
        ...mockData,
        status: "PENDIENTE",
        _id: "replacement123",
      };

      // Import dinámico necesario dentro del mock de vitest si se usa fuera del factory inicial
      const TurnTypeModel = await import("../../models/turn-type.model");
      (TurnTypeModel.default.findOne as any).mockResolvedValue(mockTurnType);
      (Reemplazo as any).mockImplementation(function (this: any, data: any) {
        Object.assign(this, data);
        this.save = vi.fn().mockResolvedValue(mockSavedReplacement);
      });

      const result = await replacementService.registrar(mockData);

      // Regla de Negocio:
      // Si el reemplazo inicia en el futuro, no debe estar activo inmediatamente.
      expect(result.status).toBe("PENDIENTE");
    });

    it("debería crear un reemplazo con estado EN CURSO para fechas actuales o pasadas", async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);

      const mockData = {
        fecha_inicio: pastDate.toISOString(),
        fecha_termino: new Date().toISOString(),
        tipo_turno: "NOCTURNO",
      };

      const mockTurnType = {
        _id: "turntype456",
        toObject: () => ({ secuencia: [] }),
      };

      const mockSavedReplacement = {
        ...mockData,
        status: "EN CURSO",
      };

      const TurnTypeModel = await import("../../models/turn-type.model");
      (TurnTypeModel.default.findOne as any).mockResolvedValue(mockTurnType);
      (Reemplazo as any).mockImplementation(function (this: any, data: any) {
        Object.assign(this, data);
        this.save = vi.fn().mockResolvedValue(mockSavedReplacement);
      });

      const result = await replacementService.registrar(mockData);

      // Regla de Negocio:
      // Si la fecha de inicio ya pasó o es hoy, el reemplazo entra en vigor inmediatamente.
      expect(result.status).toBe("EN CURSO");
    });

    it("debería manejar gracefully si TurnType no existe (aunque idealmente debería validarse antes)", async () => {
      const mockData = {
        fecha_inicio: new Date().toISOString(),
        fecha_termino: new Date().toISOString(),
        tipo_turno: "INVALID",
      };

      const TurnTypeModel = await import("../../models/turn-type.model");
      (TurnTypeModel.default.findOne as any).mockResolvedValue(null);
      (Reemplazo as any).mockImplementation(function (this: any, data: any) {
        Object.assign(this, data);
        this.save = vi.fn().mockResolvedValue({ ...data, _id: "test" });
      });

      const result = await replacementService.registrar(mockData);

      expect(result).toBeDefined();
    });
  });

  describe("obtenerActivosPaginado()", () => {
    it("debería retornar reemplazos activos paginados", async () => {
      const mockReplacements = [
        { _id: "1", status: "EN CURSO" },
        { _id: "2", status: "PENDIENTE" },
      ];

      (Reemplazo.find as any).mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockReplacements),
      });
      (Reemplazo.countDocuments as any).mockResolvedValue(2);

      const result = await replacementService.obtenerActivosPaginado({
        page: 1,
        limit: 10,
      });

      expect(result.reemplazos).toEqual(mockReplacements);
      expect(result.pagination.totalItems).toBe(2);
      expect(result.pagination.currentPage).toBe(1);
    });

    it("debería filtrar por término de búsqueda (nombre/apellido)", async () => {
      (Reemplazo.find as any).mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([]),
      });
      (Reemplazo.countDocuments as any).mockResolvedValue(0);

      await replacementService.obtenerActivosPaginado({
        search: "Juan",
        page: 1,
        limit: 10,
      });

      expect(Reemplazo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: expect.any(Array),
        }),
      );
    });

    it("debería filtrar por servicio", async () => {
      (Reemplazo.find as any).mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([]),
      });
      (Reemplazo.countDocuments as any).mockResolvedValue(0);

      await replacementService.obtenerActivosPaginado({
        servicio: "UCI",
        page: 1,
        limit: 10,
      });

      expect(Reemplazo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          servicio: "UCI",
        }),
      );
    });
  });

  describe("actualizar()", () => {
    it("debería actualizar campos de un reemplazo", async () => {
      const mockUpdated = {
        _id: "replacement123",
        status: "EN CURSO",
        servicio: "Urgencias",
      };

      (Reemplazo.findByIdAndUpdate as any).mockResolvedValue(mockUpdated);
      (Reemplazo.findById as any).mockResolvedValue(mockUpdated);

      const result = await replacementService.actualizar("replacement123", {
        servicio: "Urgencias",
      });

      expect(result).toEqual(mockUpdated);
      expect(Reemplazo.findByIdAndUpdate).toHaveBeenCalledWith(
        "replacement123",
        { servicio: "Urgencias" },
        { new: true },
      );
    });
  });

  describe("finalizarReemplazo()", () => {
    it("debería establecer el estado a FINALIZADO", async () => {
      const mockFinalized = {
        _id: "replacement123",
        status: "FINALIZADO",
      };

      (Reemplazo.findByIdAndUpdate as any).mockResolvedValue(mockFinalized);
      (Reemplazo.findById as any).mockResolvedValue(mockFinalized);

      const result =
        await replacementService.finalizarReemplazo("replacement123");

      expect(result).toBeDefined();
      expect(result?.status).toBe("FINALIZADO");
      expect(Reemplazo.findByIdAndUpdate).toHaveBeenCalledWith(
        "replacement123",
        expect.objectContaining({ status: "FINALIZADO" }),
        { new: true },
      );
    });
  });

  describe("anularReemplazo()", () => {
    it("debería establecer el estado a ANULADO", async () => {
      const mockAnulled = {
        _id: "replacement123",
        status: "ANULADO",
      };

      (Reemplazo.findByIdAndUpdate as any).mockResolvedValue(mockAnulled);
      (Reemplazo.findById as any).mockResolvedValue(mockAnulled);

      const result = await replacementService.anularReemplazo("replacement123");

      expect(result).toBeDefined();
      expect(result?.status).toBe("ANULADO");
    });
  });

  describe("sustituir()", () => {
    it("debería finalizar (corte anticipado) el reemplazo antiguo y crear uno nuevo", async () => {
      // Caso Complejo: Sustitución de reemplazo
      // Esto sucede cuando un reemplazante no puede continuar y otro toma su lugar a mitad del periodo.
      const mockPayload = {
        id_registro_a: "old123",
        fecha_corte_a: "2024-06-15",
        nuevo_entrante: {
          id_entrante: "user456",
          rut_entrante: "98765432-1",
          nombre_entrante: "Maria",
          apellido_entrante: "Lopez",
        },
        datos_base_evento: {
          id_evento_principal: "event123",
          id_saliente: "user789",
          rut_saliente: "11111111-1",
          nombre_saliente: "Pedro",
          apellido_saliente: "Gomez",
          tipo_cargo: "ENFERMERA",
          tipo_turno: "DIURNO",
          servicio: "UCI",
          fecha_termino_original: "2024-12-31",
        },
      };

      const mockOldReplacement = {
        _id: "old123",
        status: "INTERRUMPIDO",
        creado_por: "admin123",
      };

      const mockNewReplacement = {
        _id: "new123",
        status: "EN CURSO",
        save: vi.fn().mockResolvedValue({ _id: "new123", status: "EN CURSO" }),
      };

      (Reemplazo.findByIdAndUpdate as any).mockResolvedValue(
        mockOldReplacement,
      );
      (Reemplazo as any).mockImplementation(function (this: any, data: any) {
        Object.assign(this, data);
        this.save = vi
          .fn()
          .mockResolvedValue({ _id: "new123", status: "EN CURSO" });
      });

      const result = await replacementService.sustituir(mockPayload);

      expect(result).toHaveLength(2);
      expect(result![0]).toEqual(mockOldReplacement);
      // Validamos que se marque el corte anticipado en el registro original
      expect(Reemplazo.findByIdAndUpdate).toHaveBeenCalledWith(
        "old123",
        expect.objectContaining({
          corte_anticipado: true,
        }),
        { new: true },
      );
    });

    it("debería lanzar error si el reemplazo antiguo no existe", async () => {
      const mockPayload = {
        id_registro_a: "invalid123",
        fecha_corte_a: "2024-06-15",
        nuevo_entrante: {
          id_entrante: "user456",
          rut_entrante: "98765432-1",
          nombre_entrante: "Maria",
          apellido_entrante: "Lopez",
        },
        datos_base_evento: {
          id_evento_principal: "event123",
          id_saliente: "user789",
          rut_saliente: "11111111-1",
          nombre_saliente: "Pedro",
          apellido_saliente: "Gomez",
          tipo_cargo: "ENFERMERA",
          tipo_turno: "DIURNO",
          servicio: "UCI",
          fecha_termino_original: "2024-12-31",
        },
      };

      (Reemplazo.findByIdAndUpdate as any).mockResolvedValue(null);

      await expect(replacementService.sustituir(mockPayload)).rejects.toThrow(
        "no encontrado",
      );
    });

    it("debería lanzar error si faltan datos esenciales", async () => {
      await expect(
        replacementService.sustituir({
          id_registro_a: "",
          fecha_corte_a: "",
          nuevo_entrante: null as any,
          datos_base_evento: null as any,
        }),
      ).rejects.toThrow("Faltan datos esenciales");
    });
  });

  describe("obtenerHistorialUsuario()", () => {
    it("debería retornar historial unificado (como entrante y como saliente)", async () => {
      // Vista 360 del usuario: Necesitamos ver todas las veces que ha reemplazado
      // Y todas las veces que ha sido reemplazado.
      const mockHistory = [
        { _id: "1", id_entrante: "user123" },
        { _id: "2", id_saliente: "user123" },
      ];

      (Reemplazo.find as any).mockResolvedValue(mockHistory);

      const result =
        await replacementService.obtenerHistorialUsuario("user123");

      expect(result).toEqual(mockHistory);
      expect(Reemplazo.find).toHaveBeenCalledWith({
        $or: [{ id_entrante: "user123" }, { id_saliente: "user123" }],
      });
    });
  });
});
