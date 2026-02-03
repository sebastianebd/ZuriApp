import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../../app";
import authService from "../../services/auth.service";

// Mock authentication middleware
vi.mock("../../middleware/authentication.middleware", () => ({
  default: (req: any, res: any, next: any) => {
    req.user = {
      _id: "admin_id",
      nombre: "TEST",
      apellido: "ADMIN",
      rut: "12345678",
      tipo_cargo: "ADMIN-TI",
      toObject: () => ({ _id: "admin_id", nombre: "TEST", apellido: "ADMIN" }),
    };
    next();
  },
  requirePermission: () => (req: any, res: any, next: any) => next(),
}));

// Mock Cargo model
vi.mock("../../models/cargo.model", () => ({
  default: {
    findOne: vi.fn().mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        nivel: 1,
        permisos: ["all"],
      }),
    }),
  },
}));

// Mocking the module
vi.mock("../../services/auth.service");

describe("Auth Controller - Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/auth/login", () => {
    it("should return 200 and tokens on successful login", async () => {
      // Mock return value
      const mockTokens = {
        accessToken: "mock-access-token",
        refreshToken: "mock-refresh-token",
        user: { id: "1", rut: "12345678-9" }, // added user to match controller response
      };

      // Type assertion for mocked function
      (authService.login as any).mockResolvedValue(mockTokens);

      const credentials = {
        rut: "12345678-9",
        password: "password123",
      };

      const response = await request(app)
        .post("/api/auth/login")
        .send(credentials);

      expect(response.status).toBe(200);
      expect(response.body.access_token).toBe(mockTokens.accessToken);

      const cookies = response.headers["set-cookie"];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain(`refresh_token=${mockTokens.refreshToken}`);
      // Check for HttpOnly (case insensitive usually in headers, but value string might vary)
      // Node headers are lowercase, but cookie attributes case depends on implementation.
      // Usually "HttpOnly".
      expect(cookies[0]).toMatch(/HttpOnly/i);
    });

    it("should return 401/500 if service throws error", async () => {
      const mockError: any = new Error("Credenciales inválidas");
      mockError.status = 401;

      (authService.login as any).mockRejectedValue(mockError);

      const response = await request(app)
        .post("/api/auth/login")
        .send({ rut: "bad", password: "bad" });

      expect(response.status).toBe(401);
      expect(response.body.mensaje).toBe("Credenciales inválidas");
    });
  });

  describe("POST /api/auth/refresh", () => {
    it("should return new access token on valid refresh token", async () => {
      const mockAccessToken = "new-access-token";
      (authService.refresh as any).mockResolvedValue(mockAccessToken);

      const response = await request(app)
        .post("/api/auth/refresh")
        .set("Cookie", ["refresh_token=valid-refresh-token"]);

      expect(response.status).toBe(200);
      expect(response.body.access_token).toBe(mockAccessToken);
      expect(authService.refresh).toHaveBeenCalledWith("valid-refresh-token");
    });

    it("should return 401 on invalid refresh token", async () => {
      const mockError: any = new Error("Token inválido");
      mockError.status = 401;
      (authService.refresh as any).mockRejectedValue(mockError);

      const response = await request(app)
        .post("/api/auth/refresh")
        .set("Cookie", ["refresh_token=invalid-token"]);

      expect(response.status).toBe(401);
      expect(response.body.mensaje).toBe("Token inválido");
    });
  });

  describe("POST /api/auth/logout", () => {
    it("should clear refresh token cookie and return 204", async () => {
      (authService.logout as any).mockResolvedValue(undefined);

      const response = await request(app)
        .post("/api/auth/logout")
        .set("Cookie", ["refresh_token=some-token"]);

      expect(response.status).toBe(204);
      expect(authService.logout).toHaveBeenCalledWith("some-token");

      const cookies = response.headers["set-cookie"];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain("refresh_token=");
    });

    it("should handle logout errors gracefully", async () => {
      const mockError: any = new Error("Logout failed");
      mockError.status = 500;
      (authService.logout as any).mockRejectedValue(mockError);

      const response = await request(app)
        .post("/api/auth/logout")
        .set("Cookie", ["refresh_token=some-token"]);

      expect(response.status).toBe(500);
      expect(response.body.mensaje).toBe("Logout failed");
    });
  });

  describe("GET /api/auth/user", () => {
    it("should return user info with permissions", async () => {
      const response = await request(app).get("/api/auth/user");

      // With mocked auth, should return 200
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("_id");
      expect(response.body).toHaveProperty("nombre");
    });
  });

  describe("POST /api/auth/change-password", () => {
    it("should return 400 for invalid payload", async () => {
      const response = await request(app)
        .post("/api/auth/change-password")
        .send({
          currentPassword: "old123",
          newPassword: "new456",
          // Missing confirmPassword
        });

      expect(response.status).toBe(400);
    });
  });

  describe("GET /api/auth/history", () => {
    it("should return login history", async () => {
      const mockHistory = [{ timestamp: "2024-01-01", ip: "127.0.0.1" }];
      (authService.getLoginHistory as any).mockResolvedValue(mockHistory);

      const response = await request(app).get("/api/auth/history");

      expect(response.status).toBe(200);
    });
  });
});
