import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import mongoose from "mongoose";
import { connect, closeDatabase, clearDatabase } from "../db-helper";
import dashboardService from "../../services/dashboard.service";
import Service from "../../models/service.model";
import Position from "../../models/position.model";
import Staff from "../../models/staff.model";
import TurnType from "../../models/turn-type.model";
import { TurnAssignmentModel } from "../../models/turn-assignment.model";
import { TurnSigla } from "../../models/turn-sigla.model";

describe("Dashboard Service - Reproducción Error strictPopulate position_id (TDD RED)", () => {
  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  it("debería calcular KPIs para el servicio de Farmacia sin fallar por strictPopulate en position_id y reflejar los turnos del funcionario", async () => {
    // 1. Crear Cargo (Position)
    const position = await Position.create({
      name: "Químico Farmacéutico",
      position_code: "QF-01",
      estamento: "PROFESIONAL",
      color: "#3b82f6",
    });

    // 2. Crear Servicio Farmacia con dotación mínima
    const service = await Service.create({
      nombre: "Farmacia",
      codigo: "FARM",
      activo: true,
      dotacion_minima: [
        {
          positionId: position._id,
          minimo_dia: 1,
          minimo_noche: 0,
        },
      ],
      umbrales_cobertura: { verde: 90, amarillo: 75 },
    });

    // 3. Crear Funcionario de planta asignado a dicho cargo
    const staff = await Staff.create({
      rut: "11.222.333-4",
      firstName: "Carlos",
      lastName: "Planta",
      email: "carlos.planta@hospital.cl",
      phone: "+56911223344",
      address: "Av. Hospital 123",
      city: "Santiago",
      birthDate: new Date("1990-05-15"),
      roleId: new mongoose.Types.ObjectId(),
      positionId: position._id,
      contractType: "PLANTA",
      isActive: true,
    });

    // 4. Crear TurnSigla "L" (Largo 08:00 - 20:00)
    await TurnSigla.create({
      sigla: "L",
      nombre: "Largo",
      turno_entrada: "08:00",
      turno_salida: "20:00",
      hours: 12,
      color: "#22c55e",
    });

    // 5. Crear Tipo de Turno
    const turnType = await TurnType.create({
      nombre: "Turno Farmacia Diurno",
      secuencia: [
        { dia: 1, turno_entrada: "08:00", turno_salida: "20:00", es_libre: false, sigla: "L" },
        { dia: 2, turno_entrada: "08:00", turno_salida: "20:00", es_libre: true, sigla: "X" },
      ],
    });

    // 6. Crear Asignación de Turno para el funcionario de planta en Farmacia
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    await TurnAssignmentModel.create({
      staffId: staff._id,
      service: service._id,
      turn_type: turnType._id,
      start_date: startDate,
      end_date: endDate,
      snapshot_secuencia: turnType.secuencia,
    });

    // 7. Crear un reemplazo en el servicio para que la consulta de replacements tenga documentos
    const ReplacementModel = (await import("../../models/replacement.model")).default;
    await ReplacementModel.create({
      servicio: service._id,
      id_saliente: staff._id,
      rut_saliente: staff.rut,
      nombre_saliente: staff.firstName,
      apellido_saliente: staff.lastName,
      id_entrante: staff._id,
      rut_entrante: staff.rut,
      nombre_entrante: staff.firstName,
      apellido_entrante: staff.lastName,
      tipo_turno: "Turno Farmacia Diurno",
      fecha_inicio: startDate,
      fecha_termino: endDate,
      creado_por: staff._id,
      motivo: "FERIADO_LEGAL",
    });

    // 8. Ejecutar cálculo de KPIs del Dashboard para el servicio
    // Esto debe ejecutarse exitosamente y calcular los turnos sin lanzar:
    // "Cannot populate path `position_id` because it is not in your schema"
    const kpis = await dashboardService.getServiceKPIs(
      service._id.toString(),
      month,
      year,
    );

    expect(kpis).toBeDefined();
    expect(kpis.service.id).toBe(service._id.toString());
    expect(kpis.service.name).toBe("Farmacia");
    // Debe reflejar las jornadas planificadas del funcionario de planta
    expect(kpis.summary.scheduledShiftDays).toBeGreaterThan(0);
    expect(kpis.coverage.configured).toBe(true);
  });
});
