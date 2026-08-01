import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import authService, {
  AuthError,
  ValidationError,
} from "../../services/auth.service";
import User from "../../models/user.model";
import Cargo from "../../models/cargo.model";
import LoginHistory from "../../models/login-history.model";
import redis from "../../config/redis.config";
import socketConfig from "../../config/socket";

// Mock global de dependencias:
// Control total sobre librerías externas y modelos para pruebas unitarias deterministas.
vi.mock("bcrypt");
vi.mock("jsonwebtoken");
vi.mock("../../models/user.model");
vi.mock("../../models/cargo.model");
vi.mock("../../models/login-history.model");
vi.mock("../../config/redis.config");
vi.mock("../../config/socket");

describe("Auth Service - Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Limpieza de estado: Asegurar que variables de entorno temporales no filtren entre tests.
    delete process.env.DISABLE_CONCURRENT_SESSION;
  });

  describe("login()", () => {
    const mockLoginData = {
      rut: "12345678-9",
      password: "password123",
      ip: "127.0.0.1",
      userAgent: "Mozilla/5.0",
    };

    it("debería autenticar credenciales válidas y retornar tokens (Access & Refresh)", async () => {
      const mockUser = {
        _id: "user123",
        id: "user123",
        rut: "12345678-9",
        password: "hashedPassword",
        tipo_cargo: "ADMIN-TI",
        refresh_token: undefined,
        save: vi.fn().mockResolvedValue(true),
        toObject: () => ({ _id: "user123", rut: "12345678-9" }),
      };

      const mockCargo = {
        nivel: 1,
        permisos: ["all"],
      };

      (User.findOne as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValue(mockUser),
        }),
      });

      (bcrypt.compare as any).mockResolvedValue(true);
      (bcrypt.hash as any).mockResolvedValue("hashedRefreshToken");
      (jwt.sign as any)
        .mockReturnValueOnce("accessToken")
        .mockReturnValueOnce("refreshToken");
      (LoginHistory.create as any).mockResolvedValue({});
      (Cargo.findOne as any).mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockCargo),
      });
      // Importante: Simular que no hay sesión activa en Redis.
      (redis.get as any).mockResolvedValue(null);

      const result = await authService.login(mockLoginData);

      expect(result).toHaveProperty("accessToken", "accessToken");
      expect(result).toHaveProperty("refreshToken", "refreshToken");
      expect(result).toHaveProperty("user");
      expect(result.user.nivel).toBe(1);
      expect(result.user.permisos).toEqual(["all"]);
      expect(LoginHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: "SUCCESS" }),
      );
    });

    it("debería lanzar ValidationError si falta rut o contraseña", async () => {
      await expect(
        authService.login({ rut: "", password: "test", ip: "", userAgent: "" }),
      ).rejects.toThrow(ValidationError);

      await expect(
        authService.login({
          rut: "12345678-9",
          password: "",
          ip: "",
          userAgent: "",
        }),
      ).rejects.toThrow(ValidationError);
    });

    it("debería lanzar AuthError si el usuario no existe", async () => {
      (User.findOne as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValue(null),
        }),
      });

      await expect(authService.login(mockLoginData)).rejects.toThrow(AuthError);
    });

    it("debería lanzar AuthError si la contraseña es incorrecta", async () => {
      const mockUser = {
        _id: "user123",
        rut: "12345678-9",
        password: "hashedPassword",
      };

      (User.findOne as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValue(mockUser),
        }),
      });

      (bcrypt.compare as any).mockResolvedValue(false);
      (LoginHistory.create as any).mockResolvedValue({});

      await expect(authService.login(mockLoginData)).rejects.toThrow(AuthError);
      expect(LoginHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: "FAILED" }),
      );
    });

    it("debería lanzar error 409 si el usuario ya tiene una sesión activa (Concurrencia)", async () => {
      const mockUser = {
        _id: "user123",
        id: "user123",
        rut: "12345678-9",
        password: "hashedPassword",
        tipo_cargo: "ADMIN-TI",
      };

      (User.findOne as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValue(mockUser),
        }),
      });

      (bcrypt.compare as any).mockResolvedValue(true);
      (redis.get as any).mockResolvedValue(
        JSON.stringify({ socket_id: "socket123", device: "Chrome" }),
      );

      // Simular que el socket asociado está realmente conectado.
      const mockSocket = { id: "socket123" };
      const mockSockets = new Map([["socket123", mockSocket]]);
      (socketConfig.getIO as any).mockReturnValue({
        sockets: { sockets: mockSockets },
      });

      await expect(authService.login(mockLoginData)).rejects.toThrow(
        "Cuenta conectada",
      );
    });

    it("debería permitir login si la sesión es 'stale' (socket desconectado)", async () => {
      // Caso Borde Crítico: El registro en Redis dice "conectado", pero el socket real user ya no existe.
      // Esto pasa si el servidor se reinicia o el socket se cae sin limpiar Redis.
      const mockUser = {
        _id: "user123",
        id: "user123",
        rut: "12345678-9",
        password: "hashedPassword",
        tipo_cargo: "ADMIN-TI",
        refresh_token: undefined,
        save: vi.fn().mockResolvedValue(true),
        toObject: () => ({ _id: "user123", rut: "12345678-9" }),
      };

      (User.findOne as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValue(mockUser),
        }),
      });

      (bcrypt.compare as any).mockResolvedValue(true);
      (bcrypt.hash as any).mockResolvedValue("hashedRefreshToken");
      (jwt.sign as any)
        .mockReturnValueOnce("accessToken")
        .mockReturnValueOnce("refreshToken");
      (LoginHistory.create as any).mockResolvedValue({});
      (Cargo.findOne as any).mockReturnValue({
        lean: vi.fn().mockResolvedValue({ nivel: 1, permisos: [] }),
      });
      (redis.get as any).mockResolvedValue(
        JSON.stringify({ socket_id: "stale_socket", device: "Chrome" }),
      );
      (redis.del as any).mockResolvedValue(1);

      const mockSockets = new Map(); // Vacío - socket no conectado
      (socketConfig.getIO as any).mockReturnValue({
        sockets: { sockets: mockSockets },
      });

      const result = await authService.login(mockLoginData);

      expect(result).toHaveProperty("accessToken");
      expect(redis.del).toHaveBeenCalledWith("active_session:user123");
    });
  });

  describe("refresh()", () => {
    it("debería generar un nuevo access token con un refresh token válido", async () => {
      const mockUser = {
        _id: "user123",
        id: "user123",
        refresh_token: "hashedRefreshToken",
      };

      (jwt.verify as any).mockReturnValue({ id: "user123" });
      (User.findById as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValue(mockUser),
        }),
      });
      (bcrypt.compare as any).mockResolvedValue(true);
      (jwt.sign as any).mockReturnValue("newAccessToken");

      const result = await authService.refresh("validRefreshToken");

      expect(result).toBe("newAccessToken");
      expect(jwt.verify).toHaveBeenCalledWith(
        "validRefreshToken",
        process.env.REFRESH_TOKEN_SECRET,
      );
    });

    it("debería lanzar AuthError si falta el refresh token", async () => {
      await expect(authService.refresh("")).rejects.toThrow(AuthError);
    });

    it("debería lanzar AuthError si el refresh token ha expirado", async () => {
      (jwt.verify as any).mockImplementation(() => {
        throw new Error("Token expired");
      });

      await expect(authService.refresh("expiredToken")).rejects.toThrow(
        AuthError,
      );
    });

    it("debería lanzar AuthError si el usuario no existe", async () => {
      (jwt.verify as any).mockReturnValue({ id: "user123" });
      (User.findById as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValue(null),
        }),
      });

      await expect(authService.refresh("validToken")).rejects.toThrow(
        AuthError,
      );
    });

    it("debería lanzar AuthError si el refresh token no coincide con el hash almacenado (Posible robo)", async () => {
      const mockUser = {
        _id: "user123",
        refresh_token: "hashedRefreshToken",
      };

      (jwt.verify as any).mockReturnValue({ id: "user123" });
      (User.findById as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValue(mockUser),
        }),
      });
      (bcrypt.compare as any).mockResolvedValue(false);

      await expect(authService.refresh("invalidToken")).rejects.toThrow(
        AuthError,
      );
    });
  });

  describe("logout()", () => {
    it("debería eliminar el refresh_token del documento del usuario", async () => {
      const mockUser = {
        _id: "user123",
        refresh_token: "hashedRefreshToken",
        save: vi.fn().mockResolvedValue(true),
      };

      (jwt.verify as any).mockReturnValue({ id: "user123" });
      (User.findById as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValue(mockUser),
        }),
      });
      (bcrypt.compare as any).mockResolvedValue(true);

      await authService.logout("validRefreshToken");

      expect(mockUser.refresh_token).toBeUndefined();
      expect(mockUser.save).toHaveBeenCalled();
    });

    it("debería manejar token faltante sin lanzar error", async () => {
      await expect(authService.logout("")).resolves.toBeUndefined();
    });

    it("debería manejar token inválido sin lanzar error", async () => {
      (jwt.verify as any).mockImplementation(() => {
        throw new Error("Invalid token");
      });

      await expect(authService.logout("invalidToken")).resolves.toBeUndefined();
    });

    it("debería manejar usuario no encontrado sin lanzar error", async () => {
      (jwt.verify as any).mockReturnValue({ id: "user123" });
      (User.findById as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValue(null),
        }),
      });

      await expect(authService.logout("validToken")).resolves.toBeUndefined();
    });
  });

  describe("changePassword()", () => {
    it("debería actualizar contraseña cuando la actual es correcta", async () => {
      const mockUser = {
        _id: "user123",
        rut: "12345678-9",
        password: "oldHashedPassword",
        save: vi.fn().mockResolvedValue(true),
      };

      (User.findById as any).mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUser),
      });
      (bcrypt.compare as any).mockResolvedValue(true);

      await authService.changePassword("user123", "oldPassword", "newPassword");

      expect(mockUser.password).toBe("newPassword");
      expect(mockUser.save).toHaveBeenCalled();
    });

    it("debería lanzar AuthError si el usuario no existe", async () => {
      (User.findById as any).mockReturnValue({
        select: vi.fn().mockResolvedValue(null),
      });

      await expect(
        authService.changePassword("user123", "old", "new"),
      ).rejects.toThrow(AuthError);
    });

    it("debería lanzar AuthError si la contraseña actual es incorrecta", async () => {
      const mockUser = {
        _id: "user123",
        password: "hashedPassword",
      };

      (User.findById as any).mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUser),
      });
      (bcrypt.compare as any).mockResolvedValue(false);

      await expect(
        authService.changePassword("user123", "wrongPassword", "newPassword"),
      ).rejects.toThrow(AuthError);
    });
  });

  describe("getLoginHistory()", () => {
    it("debería retornar los últimos 20 intentos de login", async () => {
      const mockHistory = [
        { user: "user123", timestamp: new Date(), status: "SUCCESS" },
        { user: "user123", timestamp: new Date(), status: "FAILED" },
      ];

      (LoginHistory.find as any).mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            exec: vi.fn().mockResolvedValue(mockHistory),
          }),
        }),
      });

      const result = await authService.getLoginHistory("user123");

      expect(result).toEqual(mockHistory);
      expect(LoginHistory.find).toHaveBeenCalledWith({ user: "user123" });
    });
  });

  // RED: One-Time Link
  // Estas funciones aún no existen en auth.service.ts
  describe("generateResetToken()", () => {
    it("debería devolver un token en texto plano (para la URL del correo)", async () => {
      (User.findByIdAndUpdate as any).mockResolvedValue({});

      const { generateResetToken } = await import("../../services/auth.service");
      const { rawToken } = await generateResetToken("someUserId");

      expect(typeof rawToken).toBe("string");
      expect(rawToken.length).toBeGreaterThan(0);
    });

    it("debería guardar en la BD el HASH del token, nunca el token en plano", async () => {
      let savedData: any = null;
      (User.findByIdAndUpdate as any).mockImplementation((_id: any, data: any) => {
        savedData = data;
        return Promise.resolve({});
      });

      const { generateResetToken } = await import("../../services/auth.service");
      const { rawToken } = await generateResetToken("someUserId");

      expect(savedData.$set.resetPasswordToken).toBeDefined();
      expect(savedData.$set.resetPasswordToken).not.toBe(rawToken);
    });

    it("debería guardar una fecha de expiración de 24 horas en la BD", async () => {
      let savedData: any = null;
      (User.findByIdAndUpdate as any).mockImplementation((_id: any, data: any) => {
        savedData = data;
        return Promise.resolve({});
      });

      const { generateResetToken } = await import("../../services/auth.service");
      const before = Date.now();
      await generateResetToken("someUserId");
      const after = Date.now();

      const expire = new Date(savedData.$set.resetPasswordExpire).getTime();
      const in24h = 24 * 60 * 60 * 1000;

      expect(expire).toBeGreaterThanOrEqual(before + in24h - 1000);
      expect(expire).toBeLessThanOrEqual(after + in24h + 1000);
    });
  });

  describe("validateResetToken()", () => {
    it("debería devolver el usuario si el token es válido y no ha expirado", async () => {
      const cryptoLib = await import("crypto");
      const rawToken = cryptoLib.randomBytes(32).toString("hex");
      const hashedToken = cryptoLib.createHash("sha256").update(rawToken).digest("hex");

      (User.findOne as any).mockResolvedValue({ _id: "user123", email: "test@test.com" });

      const { validateResetToken } = await import("../../services/auth.service");
      const user = await validateResetToken(rawToken);

      expect(User.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          resetPasswordToken: hashedToken,
          resetPasswordExpire: expect.objectContaining({ $gt: expect.any(Date) }),
        })
      );
      expect(user).toMatchObject({ _id: "user123" });
    });

    it("debería lanzar AppError si el token no existe o está expirado", async () => {
      (User.findOne as any).mockResolvedValue(null);

      const { validateResetToken } = await import("../../services/auth.service");
      const { AppError } = await import("../../errors/app-error");

      await expect(validateResetToken("token-invalido")).rejects.toThrow(AppError);
    });
  });
});

