import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import mongoose from "mongoose";
import { connect, closeDatabase, clearDatabase } from "../db-helper";
import dashboardService from "../../services/dashboard.service";
import Service from "../../models/service.model";
import Staff from "../../models/staff.model";
import Position from "../../models/position.model";
import TurnType from "../../models/turn-type.model";
import { TurnAssignmentModel } from "../../models/turn-assignment.model";
import { ShiftExceptionModel } from "../../models/shift-exception.model";
import { TurnSigla } from "../../models/turn-sigla.model";

describe("Dashboard Service - Inclusión de Excepciones de Turno en Jornadas Programadas y Cobertura (TDD RED)", () => {
  beforeAll(async () => {
    await connect();
  }, 60000);

  afterAll(async () => {
    await closeDatabase();
  }, 30000);

  afterEach(async () => {
    await clearDatabase();
  });

  it("debe contabilizar 3 jornadas programadas cuando el patrón base L N X X tiene una excepción en día libre convirtiéndolo en L N N X", async () => {
    const month = 9; // Septiembre 2026
    const year = 2026;

    // 1. Crear Cargo / Posición
    const position = await Position.create({
      name: "Técnico en Farmacia",
      position_code: "TENS-FARM",
      estamento: "TECNICO",
    });

    // 2. Crear Servicio Farmacia con dotación mínima
    const service = await Service.create({
      nombre: "Farmacia",
      sigla: "FARM",
      codigo: "FARM-01",
      dotacion_minima: [
        {
          positionId: position._id,
          minimo_dia: 1,
          minimo_noche: 1,
        },
      ],
      umbrales_cobertura: { verde: 90, amarillo: 75 },
    });

    // 3. Catálogo de Siglas: L (Largo), N (Noche), X (Libre)
    await TurnSigla.create([
      {
        sigla: "L",
        nombre: "Largo",
        turno_entrada: "08:00",
        turno_salida: "20:00",
        activo: true,
      },
      {
        sigla: "N",
        nombre: "Noche",
        turno_entrada: "20:00",
        turno_salida: "08:00",
        activo: true,
      },
      {
        sigla: "X",
        nombre: "Libre",
        turno_entrada: "08:00",
        turno_salida: "20:00",
        activo: true,
      },
    ]);

    // 4. Tipo de Turno 4to Turno (L N X X)
    const turnType = await TurnType.create({
      nombre: "Cuarto Turno",
      secuencia: [
        { dia: 1, turno_entrada: "08:00", turno_salida: "20:00", es_libre: false, sigla: "L" },
        { dia: 2, turno_entrada: "20:00", turno_salida: "08:00", es_libre: false, sigla: "N" },
        { dia: 3, turno_entrada: "08:00", turno_salida: "20:00", es_libre: true, sigla: "X" },
        { dia: 4, turno_entrada: "08:00", turno_salida: "20:00", es_libre: true, sigla: "X" },
      ],
    });

    // 5. Funcionario: Omar Barría
    const omar = await Staff.create({
      rut: "11.111.111-1",
      firstName: "Omar",
      lastName: "Barría",
      email: "omar.barria@hospital.cl",
      phone: "+56911111111",
      address: "Calle 1",
      city: "Punta Arenas",
      birthDate: new Date("1985-01-01"),
      contractType: "PLANTA",
      roleId: new mongoose.Types.ObjectId(),
      positionId: position._id,
      serviceId: service._id,
    });

    // 6. Asignación oficial de 4 días (del 1 al 4 de Septiembre de 2026)
    // Patrón base: Día 1: L, Día 2: N, Día 3: X, Día 4: X
    // Sin excepción: 2 jornadas programadas (L y N)
    const assignment = await TurnAssignmentModel.create({
      staffId: omar._id,
      service: service._id,
      turn_type: turnType._id,
      start_date: new Date(year, month - 1, 1),
      end_date: new Date(year, month - 1, 4),
      snapshot_secuencia: turnType.secuencia,
    });

    // 7. Crear Excepción en el Día 3 (2026-09-03): cambiando de libre a Noche ('N')
    // El patrón resultante para Omar es L N N X
    await ShiftExceptionModel.create({
      assignment_id: assignment._id,
      assignment_model: "TurnAssignment",
      date: new Date(year, month - 1, 3),
      original_type: "Libre",
      override_type: "N",
      reason: "Cobertura urgente por falta de personal",
      created_by: omar._id,
    });

    // 8. Consultar KPIs del Dashboard
    const kpis = await dashboardService.getServiceKPIs(
      service._id.toString(),
      month,
      year,
    );

    // 9. Validaciones:
    // a) Debe contabilizar 3 jornadas programadas (L en día 1, N en día 2, N en día 3 por excepción)
    expect(kpis.summary.scheduledShiftDays).toBe(3);

    // b) En dailyStaffing del día 3 debe registrar 1 noche para el cargo
    const posCoverage = kpis.coverage.byPosition.find(
      (p) => p.positionId === position._id.toString(),
    );
    expect(posCoverage).toBeDefined();
  });

  it("debe restar una jornada programada cuando una excepción convierte un día laborable L en LIBRE (X)", async () => {
    const month = 9;
    const year = 2026;

    const position = await Position.create({
      name: "Técnico en Farmacia",
      position_code: "TENS-FARM",
      estamento: "TECNICO",
    });

    const service = await Service.create({
      nombre: "Farmacia",
      sigla: "FARM",
      codigo: "FARM-01",
      dotacion_minima: [{ positionId: position._id, minimo_dia: 1, minimo_noche: 0 }],
      umbrales_cobertura: { verde: 90, amarillo: 75 },
    });

    await TurnSigla.create([
      { sigla: "L", nombre: "Largo", turno_entrada: "08:00", turno_salida: "20:00", activo: true },
      { sigla: "N", nombre: "Noche", turno_entrada: "20:00", turno_salida: "08:00", activo: true },
      { sigla: "X", nombre: "Libre", turno_entrada: "08:00", turno_salida: "20:00", activo: true },
    ]);

    const turnType = await TurnType.create({
      nombre: "Cuarto Turno",
      secuencia: [
        { dia: 1, turno_entrada: "08:00", turno_salida: "20:00", es_libre: false, sigla: "L" },
        { dia: 2, turno_entrada: "20:00", turno_salida: "08:00", es_libre: false, sigla: "N" },
        { dia: 3, turno_entrada: "08:00", turno_salida: "20:00", es_libre: true, sigla: "X" },
        { dia: 4, turno_entrada: "08:00", turno_salida: "20:00", es_libre: true, sigla: "X" },
      ],
    });

    const omar = await Staff.create({
      rut: "11.111.111-1",
      firstName: "Omar",
      lastName: "Barría",
      email: "omar.barria@hospital.cl",
      phone: "+56911111111",
      address: "Calle 1",
      city: "Punta Arenas",
      birthDate: new Date("1985-01-01"),
      contractType: "PLANTA",
      roleId: new mongoose.Types.ObjectId(),
      positionId: position._id,
      serviceId: service._id,
    });

    // 4 días: L N X X -> 2 jornadas base
    const assignment = await TurnAssignmentModel.create({
      staffId: omar._id,
      service: service._id,
      turn_type: turnType._id,
      start_date: new Date(year, month - 1, 1),
      end_date: new Date(year, month - 1, 4),
      snapshot_secuencia: turnType.secuencia,
    });

    // Excepción en Día 1 convirtiendo L en X (Libre) -> resultado: X N X X
    await ShiftExceptionModel.create({
      assignment_id: assignment._id,
      assignment_model: "TurnAssignment",
      date: new Date(year, month - 1, 1),
      original_type: "Largo",
      override_type: "X",
      reason: "Permiso administrativo",
      created_by: omar._id,
    });

    const kpis = await dashboardService.getServiceKPIs(
      service._id.toString(),
      month,
      year,
    );

    // Debe contabilizar solo 1 jornada (la del día 2 N)
    expect(kpis.summary.scheduledShiftDays).toBe(1);
  });
});
