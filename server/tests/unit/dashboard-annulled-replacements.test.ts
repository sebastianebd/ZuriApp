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
import Replacement from "../../models/replacement.model";

describe("Dashboard Service - Exclusión Estricta de Reemplazos Anulados (TDD RED)", () => {
  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  it("no debe incluir reemplazos ANULADOS en totalReplacements, totalShiftsReplaced, replacementRate, topReplacedStaff ni hoursBreakdown", async () => {
    // 1. Crear Cargo
    const position = await Position.create({
      name: "Químico Farmacéutico",
      position_code: "QF-FARM",
      estamento: "PROFESIONAL",
      color: "#3b82f6",
    });

    // 2. Crear Servicio Farmacia
    const service = await Service.create({
      nombre: "Farmacia Central",
      codigo: "FARM-CEN",
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

    // 3. Crear Funcionario
    const staff = await Staff.create({
      rut: "12.345.678-9",
      firstName: "Constanza",
      lastName: "Farmacéutica",
      email: "constanza@hospital.cl",
      phone: "+56987654321",
      address: "Calle Salud 123",
      city: "Santiago",
      birthDate: new Date("1992-03-20"),
      roleId: new mongoose.Types.ObjectId(),
      positionId: position._id,
      contractType: "PLANTA",
      isActive: true,
    });

    // 4. Crear TurnSigla L (12 horas)
    await TurnSigla.create({
      sigla: "L",
      nombre: "Largo",
      turno_entrada: "08:00",
      turno_salida: "20:00",
      hours: 12,
      color: "#22c55e",
    });

    // 5. Crear Tipo de Turno con 14 días activos de 30 días (14 jornadas presenciales exactas)
    const secuencia30: any[] = [];
    for (let i = 1; i <= 30; i++) {
      secuencia30.push({
        dia: i,
        turno_entrada: "08:00",
        turno_salida: "20:00",
        es_libre: i > 14, // Días 1 a 14 presenciales, días 15 a 30 libres
        sigla: i <= 14 ? "L" : "X",
      });
    }

    const turnType = await TurnType.create({
      nombre: "Ciclo 14 Jornadas",
      secuencia: secuencia30,
    });

    // 6. Crear Asignación de Turno (14 jornadas programadas en el mes)
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

    // 7. Crear 2 Reemplazos con status "ANULADO"
    // Primer reemplazo anulado: 3 días
    await Replacement.create({
      servicio: service._id,
      id_saliente: staff._id,
      rut_saliente: staff.rut,
      nombre_saliente: staff.firstName,
      apellido_saliente: staff.lastName,
      id_entrante: staff._id,
      rut_entrante: staff.rut,
      nombre_entrante: staff.firstName,
      apellido_entrante: staff.lastName,
      tipo_turno: "L",
      fecha_inicio: new Date(year, month - 1, 2),
      fecha_termino: new Date(year, month - 1, 4),
      creado_por: staff._id,
      motivo: "LICENCIA_MEDICA",
      status: "ANULADO",
    });

    // Segundo reemplazo anulado: 4 días
    await Replacement.create({
      servicio: service._id,
      id_saliente: staff._id,
      rut_saliente: staff.rut,
      nombre_saliente: staff.firstName,
      apellido_saliente: staff.lastName,
      id_entrante: staff._id,
      rut_entrante: staff.rut,
      nombre_entrante: staff.firstName,
      apellido_entrante: staff.lastName,
      tipo_turno: "L",
      fecha_inicio: new Date(year, month - 1, 10),
      fecha_termino: new Date(year, month - 1, 13),
      creado_por: staff._id,
      motivo: "PERMISO_ADMINISTRATIVO",
      status: "ANULADO",
    });

    // 8. Consultar KPIs del Dashboard
    const kpis = await dashboardService.getServiceKPIs(
      service._id.toString(),
      month,
      year,
    );

    // 9. Aserciones de negocio:
    // Jornadas programadas del funcionario de planta deben ser exactamente 14
    expect(kpis.summary.scheduledShiftDays).toBe(14);

    // Los reemplazos ANULADOS NO deben contarse:
    // Total Reemplazos debe ser 0 (NO 2)
    expect(kpis.summary.totalReplacements).toBe(0);

    // Jornadas Reemplazadas debe ser 0 (NO 7)
    expect(kpis.summary.totalShiftsReplaced).toBe(0);

    // Tasa de Reemplazo debe ser 0% (NO 50%)
    expect(kpis.summary.replacementRate).toBe(0);

    // Top 5 funcionarios reemplazados debe ser vacío
    expect(kpis.topReplacedStaff).toEqual([]);

    // Horas de reemplazo deben ser 0
    expect(kpis.hoursBreakdown.totalHours).toBe(0);
    expect(kpis.hoursBreakdown.dayHours).toBe(0);
    expect(kpis.hoursBreakdown.nightHours).toBe(0);
  });
});
