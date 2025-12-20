import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../../app";
import authService from "../../services/auth.service";

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
});
