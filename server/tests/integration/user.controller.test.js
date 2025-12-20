const { describe, it, expect, beforeAll, afterAll, beforeEach, vi } = global;
const request = require("supertest");
const path = require("path");
const dbHelper = require("../db-helper");

// --- TRUCO DE MOCKING PARA COMMONJS ---
// Limpiamos y pre-cargamos el mock en la caché de require de Node.js
const authPath = path.resolve(
  __dirname,
  "../../middleware/authentication.middleware.js"
);
const mockAuth = (req, res, next) => {
  req.user = {
    _id: "641b1b1b1b1b1b1b1b1b1b1b",
    nombre: "TEST",
    apellido: "ADMIN",
    rut: "99999999-9",
  };
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
const User = require("../../models/user.model");
const AuditLog = require("../../models/audit.model");

describe("User Controller - Integration", () => {
  beforeAll(async () => await dbHelper.connect());
  afterAll(async () => await dbHelper.closeDatabase());
  beforeEach(async () => await dbHelper.clearDatabase());

  it("POST /api/users should create a new user and log the action", async () => {
    const newUser = {
      rut: "12345678-9",
      nombre: "JUAN",
      apellido: "PEREZ",
      fecha_nac: "1990-01-01",
      direccion: "CALLE 123",
      telefono: "11223344",
      email: "juan@test.com",
      ciudad: "SANTIAGO",
      tipo_cargo: "ADMIN-TI",
    };

    const response = await request(app).post("/api/users").send(newUser);

    expect(response.status).toBe(201);
    expect(response.body.rut).toBe(newUser.rut);

    const userInDb = await User.findOne({ rut: newUser.rut });
    expect(userInDb).toBeTruthy();
    expect(userInDb.nombre).toBe(newUser.nombre);

    const auditLog = await AuditLog.findOne({
      action: "CREAR",
      module: "USUARIOS",
    });
    expect(auditLog).toBeTruthy();
    expect(auditLog.description).toContain(`RUT ${newUser.rut}`);
  });

  it("POST /api/users should fail if user already exists", async () => {
    const newUser = {
      rut: "12345678-9",
      nombre: "JUAN",
      apellido: "PEREZ",
      fecha_nac: "1990-01-01",
      direccion: "CALLE 123",
      telefono: "11223344",
      email: "juan@test.com",
      ciudad: "SANTIAGO",
      tipo_cargo: "ADMIN-TI",
    };

    await User.create({ ...newUser, password: "hash" });

    const response = await request(app).post("/api/users").send(newUser);

    expect(response.status).toBe(409);
    expect(response.body.mensaje).toBe("Usuario ya registrado");
  });
});
