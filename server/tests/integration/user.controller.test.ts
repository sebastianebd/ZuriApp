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

// Mock del middleware de autenticación:
// Simulamos un usuario con permisos totales (ADMIN) para validar la lógica del controlador
// sin depender de la generación y validación real de tokens JWT.
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
  // Configuración de Base de Datos Real (Integration):
  // A diferencia de otras pruebas que mockean Mongoose, aquí usamos una DB real (in-memory o contenedor)
  // gestionada por dbHelper. Esto asegura que las queries, índices y validaciones de esquema funcionen correctamente.
  beforeAll(async () => await dbHelper.connect());
  afterAll(async () => await dbHelper.closeDatabase());
  beforeEach(async () => await dbHelper.clearDatabase());

  it("POST /api/users debería crear un nuevo usuario y registrar la acción en auditoría", async () => {
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

    const response = await request(app).post("/api/users").send(newUser);

    expect(response.status).toBe(201);
    expect(response.body.rut).toBe(newUser.rut);

    // Verificación de Persistencia:
    // Confirmamos que el dato realmente se guardó en la base de datos.
    const userInDb = await User.findOne({ rut: newUser.rut });
    expect(userInDb).toBeTruthy();
    expect(userInDb?.nombre).toBe(newUser.nombre);

    // Verificación de "Side-Effect" (Auditoría):
    // Es vital que la creación de usuarios deje rastro para seguridad y compliance.
    const auditLog = await AuditLog.findOne({
      action: "CREAR",
      module: "Funcionarios",
    });
    expect(auditLog).toBeTruthy();
    expect(auditLog?.description).toContain(`RUT ${newUser.rut}`);
  });

  it("POST /api/users debería fallar si el usuario ya existe (Unicidad)", async () => {
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

    // Pre-insertar usuario para provocar conflicto.
    await User.create({ ...newUser, password: "hash" });

    const response = await request(app).post("/api/users").send(newUser);

    expect(response.status).toBe(409);
    expect(response.body.mensaje).toBe("El RUT ya está registrado.");
  });
});
