const { describe, it, expect, vi, beforeEach } = global;
const request = require("supertest");
const app = require("../../app");
const authService = require("../../services/auth.service");

// Monkey-patching directo para CommonJS
authService.login = vi.fn();
authService.logout = vi.fn();
authService.refresh = vi.fn();

describe("Auth Controller - Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/auth/login", () => {
    it("should return 200 and tokens on successful login", async () => {
      // Configurar el mock para retornar tokens simulados
      const mockTokens = {
        accessToken: "mock-access-token",
        refreshToken: "mock-refresh-token",
      };

      // Acceder a la versión mockeada del servicio
      authService.login.mockResolvedValue(mockTokens);

      const credentials = {
        rut: "12345678-9",
        password: "password123",
      };

      const response = await request(app)
        .post("/api/auth/login")
        .send(credentials);

      // Verificaciones
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ access_token: mockTokens.accessToken });

      // Verificar cookie
      const cookies = response.headers["set-cookie"];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain(`refresh_token=${mockTokens.refreshToken}`);
      expect(cookies[0]).toContain("HttpOnly"); // Seguridad crítica
    });

    it("should return 401/500 if service throws error", async () => {
      // Simular error de credenciales incorrectas
      const mockError = new Error("Credenciales inválidas");
      mockError.status = 401;

      authService.login.mockRejectedValue(mockError);

      const response = await request(app)
        .post("/api/auth/login")
        .send({ rut: "bad", password: "bad" });

      expect(response.status).toBe(401);
      expect(response.body.mensaje).toBe("Credenciales inválidas");
    });
  });
});
