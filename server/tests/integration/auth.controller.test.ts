import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../../app";
import authService from "../../services/auth.service";

// Mock del middleware de autenticación:
// Necesario para pruebas que requieren un usuario ya logueado en `req.user` sin pasar por el proceso real de login.
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

// Mock del modelo Cargo:
// Evitamos consultas reales a la BD para permisos. Devolvemos permisos por defecto para las pruebas.
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

// Mock completo del servicio de auth para aislar la lógica del controlador (unit testing del controller).
vi.mock("../../services/auth.service");

describe("Auth Controller - Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/auth/login", () => {
    it("debería retornar 200 y tokens en un login exitoso", async () => {
      // Valor de retorno simulado que imita la estructura real.
      const mockTokens = {
        accessToken: "mock-access-token",
        refreshToken: "mock-refresh-token",
        user: { id: "1", rut: "12345678-9" }, // Usuario agregado para coincidir con respuesta del controlador
      };

      // Mockeamos el servicio para que resuelva exitosamente sin tocar la BD.
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
      // Validación de Seguridad:
      // Verificamos "HttpOnly" para mitigar ataques XSS (Cross-Site Scripting).
      // Aunque las cabeceras de Node son minúsculas, la cookie suele mantener el case estándar.
      expect(cookies[0]).toMatch(/HttpOnly/i);
    });

    it("debería retornar 401/500 si el servicio lanza un error", async () => {
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
    it("debería retornar nuevo access token con un refresh token válido", async () => {
      const mockAccessToken = "new-access-token";
      (authService.refresh as any).mockResolvedValue(mockAccessToken);

      const response = await request(app)
        .post("/api/auth/refresh")
        .set("Cookie", ["refresh_token=valid-refresh-token"]);

      expect(response.status).toBe(200);
      expect(response.body.access_token).toBe(mockAccessToken);
      expect(authService.refresh).toHaveBeenCalledWith("valid-refresh-token");
    });

    it("debería retornar 401 con un refresh token inválido", async () => {
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
    it("debería limpiar la cookie de refresh token y retornar 204", async () => {
      (authService.logout as any).mockResolvedValue(undefined);

      const response = await request(app)
        .post("/api/auth/logout")
        .set("Cookie", ["refresh_token=some-token"]);

      expect(response.status).toBe(204);
      expect(authService.logout).toHaveBeenCalledWith("some-token");

      const cookies = response.headers["set-cookie"];
      expect(cookies).toBeDefined();
      // Esperamos que la cookie se setee vacía para borrarla
      expect(cookies[0]).toContain("refresh_token=");
    });

    it("debería manejar errores de logout correctamente", async () => {
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
    it("debería retornar información del usuario con permisos", async () => {
      const response = await request(app).get("/api/auth/user");

      // Con el auth mockeado, debería retornar 200 directo
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("_id");
      expect(response.body).toHaveProperty("nombre");
    });
  });

  describe("POST /api/auth/change-password", () => {
    it("debería retornar 400 para payloads inválidos", async () => {
      const response = await request(app)
        .post("/api/auth/change-password")
        .send({
          currentPassword: "old123",
          newPassword: "new456",
          // Falta confirmPassword a propósito para probar la validación
        });

      expect(response.status).toBe(400);
    });
  });

  describe("GET /api/auth/history", () => {
    it("debería retornar el historial de login", async () => {
      const mockHistory = [{ timestamp: "2024-01-01", ip: "127.0.0.1" }];
      (authService.getLoginHistory as any).mockResolvedValue(mockHistory);

      const response = await request(app).get("/api/auth/history");

      expect(response.status).toBe(200);
    });
  });
});
