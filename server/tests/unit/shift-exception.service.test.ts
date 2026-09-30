import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import mongoose from "mongoose";
import { connect, closeDatabase, clearDatabase } from "../db-helper";
import shiftExceptionService from "../../services/shift-exception.service";
import Staff from "../../models/staff.model";
import Position from "../../models/position.model";
import Service from "../../models/service.model";
import Role from "../../models/role.model";
import TurnType from "../../models/turn-type.model";
import { TurnAssignmentModel } from "../../models/turn-assignment.model";

describe("ShiftExceptionService - createException populated fields (TDD RED)", () => {
  beforeAll(async () => {
    await connect();
  }, 60000);

  afterAll(async () => {
    await closeDatabase();
  }, 30000);

  afterEach(async () => {
    await clearDatabase();
  });

  it("debe retornar la excepción creada con created_by poblado (firstName, lastName) y staffId con positionId", async () => {
    // 1. Crear Role
    const role = await Role.create({
      name: "Técnico",
      code: "TEC",
      hasSystemAccess: true,
      permissions: ["*"],
    });

    // 2. Crear Position
    const position = await Position.create({
      name: "Técnico en Enfermería",
      position_code: "TENS-01",
      estamento: "TECNICO",
    });

    // 3. Crear Servicio
    const service = await Service.create({
      nombre: "Farmacia",
      sigla: "FARM",
      codigo: "FARM-01",
    });

    // 4. Crear TurnType
    const turnType = await TurnType.create({
      nombre: "Cuarto Turno",
      secuencia: [
        { dia: 1, turno_entrada: "08:00", turno_salida: "20:00", es_libre: false, sigla: "L" },
        { dia: 2, turno_entrada: "20:00", turno_salida: "08:00", es_libre: false, sigla: "N" },
        { dia: 3, turno_entrada: "08:00", turno_salida: "20:00", es_libre: true, sigla: "X" },
        { dia: 4, turno_entrada: "08:00", turno_salida: "20:00", es_libre: true, sigla: "X" },
      ],
    });

    // 5. Crear Staff (Funcionario asignado)
    const staff = await Staff.create({
      firstName: "Omar",
      lastName: "Barria",
      rut: "12.345.678-9",
      email: "omar.barria@hospital.cl",
      roleId: role._id,
      positionId: position._id,
      contractType: "CONTRATA",
      birthDate: new Date("1990-01-01"),
      address: "Calle 123",
      phone: "+56911112222",
      city: "Punta Arenas",
      department: "Farmacia",
      service: service._id,
      hireDate: new Date("2020-01-01"),
    });

    // 6. Crear Usuario creador (Enrique Admin)
    const creatorUser = await Staff.create({
      firstName: "Enrique",
      lastName: "Admin",
      rut: "11.222.333-4",
      email: "enrique.admin@hospital.cl",
      roleId: role._id,
      positionId: position._id,
      contractType: "PLANTA",
      birthDate: new Date("1985-05-15"),
      address: "Avenida Central 456",
      phone: "+56933334444",
      city: "Punta Arenas",
      department: "Administración",
      service: service._id,
      hireDate: new Date("2019-01-01"),
    });

    // 7. Crear TurnAssignment
    const assignment = await TurnAssignmentModel.create({
      staffId: staff._id,
      service: service._id,
      turn_type: turnType._id,
      start_date: new Date(2026, 8, 1),
      end_date: new Date(2026, 8, 30),
      snapshot_secuencia: turnType.secuencia,
    });

    // 8. Ejecutar createException
    const payload = {
      assignment_id: assignment._id.toString(),
      date: "2026-09-10T00:00:00.000Z",
      original_type: "Libre",
      override_type: "N",
      reason: "Cobertura de turno nocturno",
      created_by: creatorUser._id.toString(),
    };

    const createdException = await shiftExceptionService.createException(payload, {
      _id: creatorUser._id,
      firstName: "Enrique",
      lastName: "Admin",
    });

    // Validar que created_by esté poblado como objeto y contenga firstName y lastName
    expect(createdException.created_by).toBeDefined();
    expect(typeof createdException.created_by).toBe("object");
    expect((createdException.created_by as any).firstName).toBe("Enrique");
    expect((createdException.created_by as any).lastName).toBe("Admin");

    // Validar que assignment_id.staffId tenga positionId disponible
    const populatedAssignment = createdException.assignment_id as any;
    expect(populatedAssignment).toBeDefined();
    expect(populatedAssignment.staffId).toBeDefined();
    expect(populatedAssignment.staffId.positionId).toBeDefined();
  });
});
