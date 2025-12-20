const { describe, it, expect, vi, beforeEach } = global;
const request = require("supertest");
const replacementService = require("../../services/replacement.service");
const auditService = require("../../services/audit.service");

const path = require("path");

// --- TRUCO DE MOCKING PARA COMMONJS ---
const authPath = path.resolve(
  __dirname,
  "../../middleware/authentication.middleware.js"
);
const mockAuth = (req, res, next) => {
  req.user = { _id: "admin_id", nombre: "TEST", apellido: "ADMIN" };
  next();
};
require.cache[authPath] = {
  id: authPath,
  filename: authPath,
  loaded: true,
  exports: mockAuth,
};
// ---------------------------------------

const app = require("../../app");

// Mocks via Monkey-patching
replacementService.registrar = vi.fn();
replacementService.obtenerActivos = vi.fn();
auditService.logAction = vi.fn();

describe("Replacement Controller - Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/reemplazos", () => {
    it("should create a replacement and log audit", async () => {
      const mockPayload = {
        nombre_saliente: "JUAN",
        apellido_saliente: "PEREZ",
        id_entrante: "user_id_123",
      };

      const mockCreated = {
        _id: "rep_id_123",
        id_negocio: "RP24001",
        ...mockPayload,
      };

      replacementService.registrar.mockResolvedValue(mockCreated);

      const response = await request(app)
        .post("/api/reemplazos")
        .send(mockPayload);

      expect(response.status).toBe(201);

      // Verificar que se llamó al servicio
      expect(replacementService.registrar).toHaveBeenCalledWith(mockPayload);

      // Verificar que se llamó a la auditoría
      expect(auditService.logAction).toHaveBeenCalledWith(
        "CREAR",
        "REEMPLAZOS",
        expect.anything(), // req.user
        expect.stringContaining(mockCreated.id_negocio),
        expect.anything(),
        mockCreated._id
      );
    });
  });

  describe("GET /api/reemplazos", () => {
    it("should return list of active replacements", async () => {
      const mockList = [{ id: 1 }, { id: 2 }];
      replacementService.obtenerActivos.mockResolvedValue(mockList);

      const response = await request(app).get("/api/reemplazos");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockList);
    });
  });
});
