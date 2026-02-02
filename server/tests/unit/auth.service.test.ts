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

// Mock all dependencies
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
    // Reset environment variable
    delete process.env.DISABLE_CONCURRENT_SESSION;
  });

  describe("login()", () => {
    const mockLoginData = {
      rut: "12345678-9",
      password: "password123",
      ip: "127.0.0.1",
      userAgent: "Mozilla/5.0",
    };

    it("should authenticate valid credentials and return tokens", async () => {
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

    it("should throw ValidationError if rut or password missing", async () => {
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

    it("should throw AuthError if user not found", async () => {
      (User.findOne as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValue(null),
        }),
      });

      await expect(authService.login(mockLoginData)).rejects.toThrow(AuthError);
    });

    it("should throw AuthError if password incorrect", async () => {
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

    it("should throw 409 error if user has active session (concurrent login)", async () => {
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

      const mockSocket = { id: "socket123" };
      const mockSockets = new Map([["socket123", mockSocket]]);
      (socketConfig.getIO as any).mockReturnValue({
        sockets: { sockets: mockSockets },
      });

      await expect(authService.login(mockLoginData)).rejects.toThrow(
        "Cuenta conectada",
      );
    });

    it("should allow login if session is stale (socket disconnected)", async () => {
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

      const mockSockets = new Map(); // Empty - socket not connected
      (socketConfig.getIO as any).mockReturnValue({
        sockets: { sockets: mockSockets },
      });

      const result = await authService.login(mockLoginData);

      expect(result).toHaveProperty("accessToken");
      expect(redis.del).toHaveBeenCalledWith("active_session:user123");
    });
  });

  describe("refresh()", () => {
    it("should generate new access token with valid refresh token", async () => {
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

    it("should throw AuthError if refresh token missing", async () => {
      await expect(authService.refresh("")).rejects.toThrow(AuthError);
    });

    it("should throw AuthError if refresh token expired", async () => {
      (jwt.verify as any).mockImplementation(() => {
        throw new Error("Token expired");
      });

      await expect(authService.refresh("expiredToken")).rejects.toThrow(
        AuthError,
      );
    });

    it("should throw AuthError if user not found", async () => {
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

    it("should throw AuthError if refresh token doesn't match stored hash", async () => {
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
    it("should clear refresh_token from user document", async () => {
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

    it("should handle missing refresh token gracefully", async () => {
      await expect(authService.logout("")).resolves.toBeUndefined();
    });

    it("should handle invalid refresh token gracefully", async () => {
      (jwt.verify as any).mockImplementation(() => {
        throw new Error("Invalid token");
      });

      await expect(authService.logout("invalidToken")).resolves.toBeUndefined();
    });

    it("should handle user not found gracefully", async () => {
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
    it("should update password when current password is correct", async () => {
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

    it("should throw AuthError if user not found", async () => {
      (User.findById as any).mockReturnValue({
        select: vi.fn().mockResolvedValue(null),
      });

      await expect(
        authService.changePassword("user123", "old", "new"),
      ).rejects.toThrow(AuthError);
    });

    it("should throw AuthError if current password incorrect", async () => {
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
    it("should return last 20 login attempts for user", async () => {
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
});
