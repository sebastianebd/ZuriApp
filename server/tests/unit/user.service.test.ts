import { describe, it, expect, vi, beforeEach } from "vitest";
import userService from "../../services/user.service";
import User from "../../models/user.model";
import bcrypt from "bcrypt";
import { emailQueue } from "../../queues/email.queue";

// Mock de Dependencias:
// Mockeamos el modelo User y las colas de trabajo (emailQueue) para aislar la lógica del servicio.
vi.mock("../../models/user.model", () => ({
  default: Object.assign(
    vi.fn(), // Constructor
    {
      find: vi.fn(),
      findById: vi.fn(),
      findByIdAndUpdate: vi.fn(),
      create: vi.fn(),
      exists: vi.fn(),
      countDocuments: vi.fn(),
    },
  ),
}));

vi.mock("bcrypt");
// Mock de cola de emails para evitar intentos de conexión a Redis/Bull.
vi.mock("../../queues/email.queue", () => ({
  emailQueue: {
    add: vi.fn(),
  },
}));

describe("User Service - Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("register()", () => {
    const baseUserData = {
      rut: "12345678-9",
      nombre: "Juan",
      apellido: "Pérez",
      fecha_nac: "1990-01-01",
      direccion: "Calle 123",
      telefono: "+56950572047",
      email: "juan@example.com",
      ciudad: "Santiago",
      tipo_cargo: "TENS",
    };

    it("debería crear un usuario TENS sin contraseña (login deshabilitado)", async () => {
      (User.exists as any).mockResolvedValue(false);
      (User.create as any).mockResolvedValue({
        _id: "user123",
        ...baseUserData,
        rut: baseUserData.rut.toUpperCase(),
        nombre: baseUserData.nombre.toUpperCase(),
      });

      const result = await userService.register(baseUserData, "ADMIN-TI");

      // Verificación de Normalización:
      // Es importante que los datos se guarden estandarizados (Mayúsculas para nombres).
      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({
          rut: "12345678-9",
          nombre: "JUAN",
          apellido: "PÉREZ",
          tipo_cargo: "TENS",
        }),
      );
      expect(result).toBeDefined();
    });

    it("debería crear un usuario ADMIN-TI con contraseña autogenerada y enviar email", async () => {
      const adminData = { ...baseUserData, tipo_cargo: "ADMIN-TI" };
      (User.exists as any).mockResolvedValue(false);
      (bcrypt.hash as any).mockResolvedValue("hashedPassword123");
      (User.create as any).mockResolvedValue({
        _id: "admin123",
        ...adminData,
      });

      await userService.register(adminData, "ADMIN-TI");

      // Seguridad y Onboarding:
      // Los administradores DEBEN tener credenciales. Se hashea la pass y se envía al correo.
      expect(bcrypt.hash).toHaveBeenCalled();
      expect(emailQueue.add).toHaveBeenCalledWith(
        "send-welcome-email",
        expect.objectContaining({
          to: adminData.email.toLowerCase(),
          nombre: `${adminData.nombre} ${adminData.apellido}`,
        }),
      );
    });

    it("debería lanzar 403 si RRHH intenta crear un ADMIN-TI (Segregación de funciones)", async () => {
      const adminData = { ...baseUserData, tipo_cargo: "ADMIN-TI" };

      await expect(
        userService.register(adminData, "RECURSOS HUMANOS"),
      ).rejects.toMatchObject({
        status: 403,
        message: expect.stringContaining("No tienes permisos"),
      });
    });

    it("debería lanzar 409 si el RUT ya existe", async () => {
      (User.exists as any).mockResolvedValueOnce(true);

      await expect(
        userService.register(baseUserData, "ADMIN-TI"),
      ).rejects.toMatchObject({
        status: 409,
        message: "El RUT ya está registrado.",
      });
    });

    it("debería lanzar 409 si el email ya existe", async () => {
      (User.exists as any)
        .mockResolvedValueOnce(false) // RUT check
        .mockResolvedValueOnce(true); // Email check

      await expect(
        userService.register(baseUserData, "ADMIN-TI"),
      ).rejects.toMatchObject({
        status: 409,
        message: "Ya existe un usuario con ese email.",
      });
    });

    it("debería lanzar 409 si el teléfono ya existe", async () => {
      (User.exists as any)
        .mockResolvedValueOnce(false) // RUT check
        .mockResolvedValueOnce(false) // Email check
        .mockResolvedValueOnce(true); // Phone check

      await expect(
        userService.register(baseUserData, "ADMIN-TI"),
      ).rejects.toMatchObject({
        status: 409,
        message: "Ya existe un usuario con ese teléfono.",
      });
    });

    it("debería añadir el campo 'habilitado' automáticamente para usuarios TENS", async () => {
      // Regla de Negocio: Los TENS deben marcarse explícitamente como habilitados
      // para aparecer en las listas de selección de turnos.
      const tensData = { ...baseUserData, habilitado: "SI" };
      (User.exists as any).mockResolvedValue(false);
      (User.create as any).mockResolvedValue({ _id: "tens123" });

      await userService.register(tensData, "ADMIN-TI");

      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({
          habilitado: "SI",
        }),
      );
    });

    it("debería añadir el campo 'servicio' para usuarias JEFA SERVICIO", async () => {
      const jefaData = {
        ...baseUserData,
        tipo_cargo: "JEFA SERVICIO",
        servicio: "UCI",
      };
      (User.exists as any).mockResolvedValue(false);
      (User.create as any).mockResolvedValue({ _id: "jefa123" });

      await userService.register(jefaData, "ADMIN-TI");

      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({
          servicio: "UCI",
        }),
      );
    });
  });

  describe("obtenerUsuariosTENS()", () => {
    it("debería retornar usuarios excluyendo ADMIN-TI y RRHH", async () => {
      const mockUsers = [
        { _id: "1", tipo_cargo: "TENS" },
        { _id: "2", tipo_cargo: "JEFA SERVICIO" },
      ];
      (User.find as any).mockResolvedValue(mockUsers);

      const result = await userService.obtenerUsuariosTENS();

      expect(User.find).toHaveBeenCalledWith({
        eliminado: false,
        tipo_cargo: { $nin: ["ADMIN-TI", "RECURSOS HUMANOS"] },
      });
      expect(result).toEqual(mockUsers);
    });
  });

  describe("obtenerPorId()", () => {
    it("debería retornar un usuario por su ID", async () => {
      const mockUser = { _id: "user123", nombre: "JUAN" };
      (User.findById as any).mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockUser),
      });

      const result = await userService.obtenerPorId("user123");

      expect(User.findById).toHaveBeenCalledWith("user123");
      expect(result).toEqual(mockUser);
    });
  });

  describe("obtenerTodos()", () => {
    it("debería retornar todos los usuarios no eliminados", async () => {
      const mockUsers = [{ _id: "1" }, { _id: "2" }];
      (User.find as any).mockResolvedValue(mockUsers);

      const result = await userService.obtenerTodos();

      expect(User.find).toHaveBeenCalledWith({ eliminado: false });
      expect(result).toEqual(mockUsers);
    });

    it("debería filtrar por lista de cargos permitidos", async () => {
      (User.find as any).mockResolvedValue([]);

      await userService.obtenerTodos(["TENS", "JEFA SERVICIO"]);

      expect(User.find).toHaveBeenCalledWith({
        eliminado: false,
        tipo_cargo: { $in: ["TENS", "JEFA SERVICIO"] },
      });
    });

    it("debería buscar por término", async () => {
      (User.find as any).mockResolvedValue([]);

      await userService.obtenerTodos(undefined, "JUAN");

      expect(User.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $and: expect.any(Array),
        }),
      );
    });
  });

  describe("obtenerTodosPaginado()", () => {
    it("debería retornar usuarios paginados", async () => {
      const mockUsers = [{ _id: "1" }, { _id: "2" }];
      (User.find as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockUsers),
      });
      (User.countDocuments as any).mockResolvedValue(10);

      const result = await userService.obtenerTodosPaginado({
        page: 1,
        limit: 5,
      });

      expect(result.usuarios).toEqual(mockUsers);
      expect(result.pagination.currentPage).toBe(1);
      expect(result.pagination.totalPages).toBe(2);
      expect(result.pagination.totalItems).toBe(10);
    });

    it("debería filtrar por cargo", async () => {
      (User.find as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([]),
      });
      (User.countDocuments as any).mockResolvedValue(0);

      await userService.obtenerTodosPaginado({
        cargo: "TENS",
        page: 1,
        limit: 10,
      });

      expect(User.find).toHaveBeenCalledWith(
        expect.objectContaining({
          tipo_cargo: "TENS",
        }),
      );
    });

    it("debería filtrar por estado de habilitación", async () => {
      (User.find as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([]),
      });
      (User.countDocuments as any).mockResolvedValue(0);

      await userService.obtenerTodosPaginado({
        habilitado: "SI",
        page: 1,
        limit: 10,
      });

      expect(User.find).toHaveBeenCalledWith(
        expect.objectContaining({
          habilitado: "SI",
        }),
      );
    });

    it("debería buscar por RUT", async () => {
      (User.find as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([]),
      });
      (User.countDocuments as any).mockResolvedValue(0);

      await userService.obtenerTodosPaginado({
        rut: "12345",
        page: 1,
        limit: 10,
      });

      expect(User.find).toHaveBeenCalledWith(
        expect.objectContaining({
          rut: expect.any(Object),
        }),
      );
    });
  });

  describe("actualizar()", () => {
    it("debería actualizar usuario y retornar la lista actualizada", async () => {
      const mockUsers = [{ _id: "1" }, { _id: "2" }];
      (User.findByIdAndUpdate as any).mockResolvedValue({ _id: "user123" });
      (User.find as any).mockResolvedValue(mockUsers);

      const result = await userService.actualizar("user123", {
        nombre: "PEDRO",
      });

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        "user123",
        { nombre: "PEDRO" },
        { new: true },
      );
      expect(result).toEqual(mockUsers);
    });
  });

  describe("eliminar()", () => {
    it("debería realizar borrado lógico (soft delete) y retornar usuarios activos", async () => {
      const mockUsers = [{ _id: "1" }, { _id: "2" }];
      (User.findByIdAndUpdate as any).mockResolvedValue({ _id: "user123" });
      (User.find as any).mockResolvedValue(mockUsers);

      const result = await userService.eliminar("user123");

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        "user123",
        { eliminado: true },
        { new: true },
      );
      expect(result).toEqual(mockUsers);
    });
  });
});
