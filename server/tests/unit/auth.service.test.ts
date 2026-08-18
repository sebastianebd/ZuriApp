import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import authService, {
  AuthError,
  ValidationError,
} from "../../services/auth.service";
import Account from "../../models/account.model";
import Staff from "../../models/staff.model";
import Role from "../../models/role.model";
import LoginHistory from "../../models/login-history.model";
import redis from "../../config/redis.config";
import socketConfig from "../../config/socket";

// Mock global de dependencias:
vi.mock("bcrypt");
vi.mock("jsonwebtoken");
vi.mock("../../models/account.model");
vi.mock("../../models/staff.model");
vi.mock("../../models/role.model");
vi.mock("../../models/login-history.model");
vi.mock("../../config/socket");


describe("Auth Service - Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
      const mockAccount = {
        _id: "acc123",
        rut: "12345678-9",
        password: "hashedPassword",
        staffId: "staff123",
        refresh_token: undefined,
        save: vi.fn().mockResolvedValue(true),
      };

      const mockRole = {
        name: "ADMIN-TI",
        level: 1,
        code: "ADM",
      };

      const mockStaff = {
        _id: "staff123",
        firstName: "Test",
        lastName: "User",
        rut: "12345678-9",
        roleId: mockRole,
        toObject: function () {
          return {
            _id: "staff123",
            firstName: "Test",
            lastName: "User",
            rut: "12345678-9",
            roleId: mockRole,
          };
        },
      };

      (Account.findOne as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValue(mockAccount),
        }),
      });

      (Staff.findById as any).mockReturnValue({
        populate: vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValue(mockStaff),
        }),
      });

      (bcrypt.compare as any).mockResolvedValue(true);
      (bcrypt.hash as any).mockResolvedValue("hashedRefreshToken");
      (jwt.sign as any)
        .mockReturnValueOnce("accessToken")
        .mockReturnValueOnce("refreshToken");
      (LoginHistory.create as any).mockResolvedValue({});
      
      // Importante: Simular que no hay sesión activa en Redis.
      (redis.get as any).mockResolvedValue(null);

      const result = await authService.login(mockLoginData);

      expect(result).toHaveProperty("accessToken", "accessToken");
      expect(result).toHaveProperty("refreshToken", "refreshToken");
      expect(result).toHaveProperty("account");
      expect(result).toHaveProperty("staff");
      expect(result.staff).toHaveProperty("role");
      expect((result.staff.role as any).level).toBe(1);
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

    it("debería lanzar AuthError si la cuenta no existe", async () => {
      (Account.findOne as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValue(null),
        }),
      });

      await expect(authService.login(mockLoginData)).rejects.toThrow(AuthError);
    });

    it("debería lanzar AuthError si la contraseña es incorrecta", async () => {
      const mockAccount = {
        _id: "acc123",
        rut: "12345678-9",
        password: "hashedPassword",
      };

      (Account.findOne as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValue(mockAccount),
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
      const mockAccount = {
        _id: "acc123",
        rut: "12345678-9",
        password: "hashedPassword",
        staffId: "staff123",
      };

      (Account.findOne as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValue(mockAccount),
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
      const mockAccount = {
        _id: "acc123",
        rut: "12345678-9",
        password: "hashedPassword",
        staffId: "staff123",
        save: vi.fn().mockResolvedValue(true),
      };
      
      const mockRole = {
        name: "ADMIN-TI",
        level: 1,
        code: "ADM",
      };

      const mockStaff = {
        _id: "staff123",
        firstName: "Test",
        lastName: "User",
        rut: "12345678-9",
        roleId: mockRole,
        toObject: function () {
          return {
            _id: "staff123",
            firstName: "Test",
            lastName: "User",
            rut: "12345678-9",
            roleId: mockRole,
          };
        },
      };

      (Account.findOne as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValue(mockAccount),
        }),
      });

      (Staff.findById as any).mockReturnValue({
        populate: vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValue(mockStaff),
        }),
      });

      (bcrypt.compare as any).mockResolvedValue(true);
      (bcrypt.hash as any).mockResolvedValue("hashedRefreshToken");
      (jwt.sign as any)
        .mockReturnValueOnce("accessToken")
        .mockReturnValueOnce("refreshToken");
      (LoginHistory.create as any).mockResolvedValue({});
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
      expect(redis.del).toHaveBeenCalledWith("active_session:staff123");
    });
  });

  describe("refresh()", () => {
    it("debería generar un nuevo access token con un refresh token válido", async () => {
      const mockAccount = {
        _id: "acc123",
        refresh_token: "hashedRefreshToken",
      };

      (jwt.verify as any).mockReturnValue({ id: "acc123" });
      (Account.findById as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValue(mockAccount),
        }),
      });
      (bcrypt.compare as any).mockResolvedValue(true);
      (jwt.sign as any)
        .mockReturnValueOnce("newAccessToken")
        .mockReturnValueOnce("newRefreshToken");

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

    it("debería lanzar AuthError si la cuenta no existe", async () => {
      (jwt.verify as any).mockReturnValue({ id: "acc123" });
      (Account.findById as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValue(null),
        }),
      });

      await expect(authService.refresh("validToken")).rejects.toThrow(
        AuthError,
      );
    });

    it("debería lanzar AuthError si el refresh token no coincide con el hash almacenado", async () => {
      const mockAccount = {
        _id: "acc123",
        refresh_token: "hashedRefreshToken",
      };

      (jwt.verify as any).mockReturnValue({ id: "acc123" });
      (Account.findById as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValue(mockAccount),
        }),
      });
      (bcrypt.compare as any).mockResolvedValue(false);

      await expect(authService.refresh("invalidToken")).rejects.toThrow(
        AuthError,
      );
    });
  });

  describe("logout()", () => {
    it("debería eliminar el refresh_token del documento de la cuenta", async () => {
      const mockAccount = {
        _id: "acc123",
        refresh_token: "hashedRefreshToken",
        save: vi.fn().mockResolvedValue(true),
      };

      (jwt.verify as any).mockReturnValue({ id: "acc123" });
      (Account.findById as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValue(mockAccount),
        }),
      });
      (bcrypt.compare as any).mockResolvedValue(true);

      await authService.logout("validRefreshToken");

      expect(mockAccount.refresh_token).toBeUndefined();
      expect(mockAccount.save).toHaveBeenCalled();
    });

    it("debería manejar token faltante sin lanzar error", async () => {
      await expect(authService.logout("")).resolves.toBeUndefined();
    });
  });

  describe("changePassword()", () => {
    it("debería actualizar contraseña cuando la actual es correcta", async () => {
      const mockAccount = {
        _id: "acc123",
        password: "oldHashedPassword",
        save: vi.fn().mockResolvedValue(true),
      };

      (Account.findById as any).mockReturnValue({
        select: vi.fn().mockResolvedValue(mockAccount),
      });
      (bcrypt.compare as any).mockResolvedValue(true);

      await authService.changePassword("acc123", "oldPassword", "newPassword");

      expect(mockAccount.password).toBe("newPassword");
      expect(mockAccount.save).toHaveBeenCalled();
    });

    it("debería lanzar AuthError si la cuenta no existe", async () => {
      (Account.findById as any).mockReturnValue({
        select: vi.fn().mockResolvedValue(null),
      });

      await expect(
        authService.changePassword("acc123", "old", "new"),
      ).rejects.toThrow(AuthError);
    });

    it("debería lanzar AuthError si la contraseña actual es incorrecta", async () => {
      const mockAccount = {
        _id: "acc123",
        password: "hashedPassword",
      };

      (Account.findById as any).mockReturnValue({
        select: vi.fn().mockResolvedValue(mockAccount),
      });
      (bcrypt.compare as any).mockResolvedValue(false);

      await expect(
        authService.changePassword("acc123", "wrongPassword", "newPassword"),
      ).rejects.toThrow(AuthError);
    });
  });

  describe("getLoginHistory()", () => {
    it("debería retornar los últimos 20 intentos de login", async () => {
      const mockHistory = [
        { accountId: "acc123", timestamp: new Date(), status: "SUCCESS" },
        { accountId: "acc123", timestamp: new Date(), status: "FAILED" },
      ];

      (LoginHistory.find as any).mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            exec: vi.fn().mockResolvedValue(mockHistory),
          }),
        }),
      });

      const result = await authService.getLoginHistory("acc123");

      expect(result).toEqual(mockHistory);
      expect(LoginHistory.find).toHaveBeenCalledWith({ accountId: "acc123" });
    });
  });

  describe("generateResetToken()", () => {
    it("debería devolver un token en texto plano", async () => {
      (Account.findByIdAndUpdate as any).mockResolvedValue({});

      const { generateResetToken } = await import("../../services/auth.service");
      const { rawToken } = await generateResetToken("someAccountId");

      expect(typeof rawToken).toBe("string");
      expect(rawToken.length).toBeGreaterThan(0);
    });
  });

  describe("validateResetToken()", () => {
    it("debería devolver la cuenta si el token es válido y no ha expirado", async () => {
      const cryptoLib = await import("crypto");
      const rawToken = cryptoLib.randomBytes(32).toString("hex");
      const hashedToken = cryptoLib.createHash("sha256").update(rawToken).digest("hex");

      (Account.findOne as any).mockResolvedValue({ _id: "acc123", rut: "12345678-9" });

      const { validateResetToken } = await import("../../services/auth.service");
      const account = await validateResetToken(rawToken);

      expect(Account.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          resetPasswordToken: hashedToken,
          resetPasswordExpire: expect.objectContaining({ $gt: expect.any(Date) }),
        })
      );
      expect(account).toMatchObject({ _id: "acc123" });
    });
  });
});
