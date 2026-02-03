import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  vi,
} from "vitest";
import request from "supertest";
import * as dbHelper from "../db-helper";
import app from "../../app";
import User from "../../models/user.model";
import AuditLog from "../../models/audit.model";

// Mock middleware
vi.mock("../../middleware/authentication.middleware", () => ({
  default: (req: any, res: any, next: any) => {
    req.user = {
      _id: "641b1b1b1b1b1b1b1b1b1b1b",
      nombre: "TEST",
      apellido: "ADMIN",
      rut: "99999999-9",
    };
    next();
  },
  requirePermission: () => (req: any, res: any, next: any) => next(),
}));

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
      password: "password123", // Required by model
    };

    const response = await request(app).post("/api/users").send(newUser);

    expect(response.status).toBe(201);
    expect(response.body.rut).toBe(newUser.rut);

    const userInDb = await User.findOne({ rut: newUser.rut });
    expect(userInDb).toBeTruthy();
    expect(userInDb?.nombre).toBe(newUser.nombre);

    const auditLog = await AuditLog.findOne({
      action: "CREAR",
      module: "Funcionarios",
    });
    expect(auditLog).toBeTruthy();
    expect(auditLog?.description).toContain(`RUT ${newUser.rut}`);
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
      password: "password123",
    };

    await User.create({ ...newUser, password: "hash" });

    const response = await request(app).post("/api/users").send(newUser);

    expect(response.status).toBe(409);
    expect(response.body.mensaje).toBe("El RUT ya está registrado.");
  });
});
