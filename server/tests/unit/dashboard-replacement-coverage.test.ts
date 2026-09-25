import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import mongoose from "mongoose";
import { connect, closeDatabase, clearDatabase } from "../db-helper";
import dashboardService from "../../services/dashboard.service";
import Service from "../../models/service.model";
import Staff from "../../models/staff.model";
import Position from "../../models/position.model";
import Role from "../../models/role.model";
import TurnType from "../../models/turn-type.model";
import { TurnAssignmentModel } from "../../models/turn-assignment.model";
import Replacement from "../../models/replacement.model";
import { TurnSigla } from "../../models/turn-sigla.model";

describe("Dashboard Service - Inclusión de Reemplazantes en Jornadas Programadas y Cobertura (TDD RED)", () => {
  beforeAll(async () => {
    await connect();
  }, 60000);

  afterAll(async () => {
    await closeDatabase();
  }, 30000);

  afterEach(async () => {
    await clearDatabase();
  });

  it("debe incluir las 8 jornadas de Rumina García (reemplazante entrante) sumadas a las 14 de Omar Barría (planta) dando 22 jornadas programadas y cobertura total", async () => {
    const month = 9; // Septiembre
    const year = 2026;

    // 1. Crear Cargo / Posición
    const position = await Position.create({
      name: "TENS Farmacia",
      position_code: "TENS-FARM",
      estamento: "TECNICO",
    });

    // 3. Crear Servicio con Dotación Mínima de 1 persona en el día para este cargo
    const service = await Service.create({
      nombre: "Farmacia",
      sigla: "FARM",
      codigo: "FARM-01",
      dotacion_minima: [
        {
          positionId: position._id,
          minimo_dia: 1,
          minimo_noche: 0,
        },
      ],
      umbrales_cobertura: {
        verde: 90,
        amarillo: 75,
      },
    });

    // 4. Catálogo de Siglas
    await TurnSigla.create({
      sigla: "D",
      nombre: "Diurno",
      tipo: "DIURNO",
      turno_entrada: "08:00",
      turno_salida: "17:00",
      horas_totales: 9,
      jornada: 9,
      horas_diurnas: 9,
      horas_nocturnas: 0,
    });

    // 5. Tipo de Turno Diario (D)
    const turnType = await TurnType.create({
      nombre: "Diurno Continuo",
      secuencia: [
        { dia: 1, turno_entrada: "08:00", turno_salida: "17:00", es_libre: false, sigla: "D" },
      ],
    });

    // 6. Funcionario de Planta: Omar Barría
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

    // 7. Funcionario Honorario: Rumina García
    const rumina = await Staff.create({
      rut: "22.222.222-2",
      firstName: "Rumina",
      lastName: "García",
      email: "rumina.garcia@hospital.cl",
      phone: "+56922222222",
      address: "Calle 2",
      city: "Punta Arenas",
      birthDate: new Date("1990-01-01"),
      contractType: "HONORARIO",
      roleId: new mongoose.Types.ObjectId(),
      positionId: position._id,
      serviceId: service._id,
    });

    // 8. Crear 14 jornadas para Omar Barría (días 1 al 14 de Septiembre de 2026)
    await TurnAssignmentModel.create({
      staffId: omar._id,
      service: service._id,
      turn_type: turnType._id,
      start_date: new Date(year, month - 1, 1),
      end_date: new Date(year, month - 1, 14),
      snapshot_secuencia: turnType.secuencia,
    });

    // 9. Crear 8 jornadas para Rumina García como reemplazante entrante (días 15 al 22 de Septiembre)
    await Replacement.create({
      servicio: service._id,
      id_saliente: omar._id,
      rut_saliente: omar.rut,
      nombre_saliente: omar.firstName,
      apellido_saliente: omar.lastName,
      id_entrante: rumina._id,
      rut_entrante: rumina.rut,
      nombre_entrante: rumina.firstName,
      apellido_entrante: rumina.lastName,
      tipo_turno: "D",
      fecha_inicio: new Date(year, month - 1, 15),
      fecha_termino: new Date(year, month - 1, 22),
      creado_por: omar._id,
      motivo: "LICENCIA_MEDICA",
      status: "CONFIRMADO",
    });

    // 10. Consultar KPIs del Dashboard
    const kpis = await dashboardService.getServiceKPIs(
      service._id.toString(),
      month,
      year,
    );

    // 11. Validaciones:
    // a) Jornadas programadas debe sumar Omar (14) + Rumina (8) = 22
    expect(kpis.summary.scheduledShiftDays).toBe(22);

    // b) Total de reemplazos = 1 y jornadas reemplazadas = 8
    expect(kpis.summary.totalReplacements).toBe(1);
    expect(kpis.summary.totalShiftsReplaced).toBe(8);

    // c) Cobertura de dotación: los 22 días (14 de Omar + 8 de Rumina) deben estar cubiertos
    // En el mes de 30 días, habiendo 22 días cubiertos (del 1 al 22), 22 de 30 días están cubiertos.
    // Verificamos que los días cubiertos sumen 22 (y no se quede solo en 14)
    const posCoverage = kpis.coverage.byPosition.find(
      (p) => p.positionId === position._id.toString(),
    );
    expect(posCoverage).toBeDefined();

    // 22 slots cubiertos de 30 slots requeridos = (22 / 30) * 100 = 73.33%
    // (Si solo considerara los 14 de Omar, daría 14 / 30 = 46.67%)
    expect(posCoverage!.coveragePercentage).toBe(73.33);
  });

  it("debe procesar turnos de reemplazo utilizando snapshot_secuencia cuando no hay turn_type poblado y respetar bypassCache", async () => {
    const month = 9;
    const year = 2026;

    const position = await Position.create({
      name: "Técnico Farmacia 2",
      position_code: "TF2",
      estamento: "TECNICO",
    });

    const service = await Service.create({
      nombre: "Farmacia Central",
      sigla: "FC",
      codigo: "FC-01",
      dotacion_minima: [
        {
          positionId: position._id,
          minimo_dia: 1,
          minimo_noche: 1,
        },
      ],
      umbrales_cobertura: { verde: 90, amarillo: 75 },
    });

    await TurnSigla.create({
      sigla: "L",
      nombre: "Largo",
      tipo: "DIURNO",
      turno_entrada: "08:00",
      turno_salida: "20:00",
      horas_totales: 12,
      jornada: 12,
      horas_diurnas: 12,
      horas_nocturnas: 0,
    });

    await TurnSigla.create({
      sigla: "N",
      nombre: "Noche",
      tipo: "NOCTURNO",
      turno_entrada: "20:00",
      turno_salida: "08:00",
      horas_totales: 12,
      jornada: 12,
      horas_diurnas: 0,
      horas_nocturnas: 12,
    });

    const staffSaliente = await Staff.create({
      rut: "33.333.333-3",
      firstName: "Saliente",
      lastName: "Test",
      email: "saliente@hospital.cl",
      phone: "+56933333333",
      address: "Calle 3",
      city: "Punta Arenas",
      birthDate: new Date("1980-01-01"),
      contractType: "PLANTA",
      roleId: new mongoose.Types.ObjectId(),
      positionId: position._id,
      serviceId: service._id,
    });

    const staffEntrante = await Staff.create({
      rut: "44.444.444-4",
      firstName: "Entrante",
      lastName: "Test",
      email: "entrante@hospital.cl",
      phone: "+56944444444",
      address: "Calle 4",
      city: "Punta Arenas",
      birthDate: new Date("1992-01-01"),
      contractType: "HONORARIO",
      roleId: new mongoose.Types.ObjectId(),
      positionId: position._id,
      serviceId: service._id,
    });

    // Reemplazo con snapshot_secuencia (L, L, N, N, X, X) del 21 al 30 de septiembre (10 días: 4L, 4N, 2X = 8 efectivas)
    await Replacement.create({
      servicio: service._id,
      id_saliente: staffSaliente._id,
      rut_saliente: staffSaliente.rut,
      nombre_saliente: staffSaliente.firstName,
      apellido_saliente: staffSaliente.lastName,
      id_entrante: staffEntrante._id,
      rut_entrante: staffEntrante.rut,
      nombre_entrante: staffEntrante.firstName,
      apellido_entrante: staffEntrante.lastName,
      tipo_turno: "TERCER TURNO",
      snapshot_secuencia: [
        { dia: 1, sigla: "L", es_libre: false, turno_entrada: "08:00", turno_salida: "20:00" },
        { dia: 2, sigla: "L", es_libre: false, turno_entrada: "08:00", turno_salida: "20:00" },
        { dia: 3, sigla: "N", es_libre: false, turno_entrada: "20:00", turno_salida: "08:00" },
        { dia: 4, sigla: "N", es_libre: false, turno_entrada: "20:00", turno_salida: "08:00" },
        { dia: 5, sigla: "X", es_libre: true, turno_entrada: null, turno_salida: null },
        { dia: 6, sigla: "X", es_libre: true, turno_entrada: null, turno_salida: null },
      ],
      fecha_inicio: new Date(year, month - 1, 21),
      fecha_termino: new Date(year, month - 1, 30),
      creado_por: staffSaliente._id,
      motivo: "LICENCIA_MEDICA",
      status: "PENDIENTE",
    });

    const kpis = await dashboardService.getServiceKPIs(
      service._id.toString(),
      month,
      year,
      undefined,
      undefined,
      true, // bypassCache
    );

    expect(kpis.summary.scheduledShiftDays).toBe(8);
    expect(kpis.summary.totalShiftsReplaced).toBe(8);
    expect(kpis.summary.totalReplacements).toBe(1);
    expect(kpis.hoursBreakdown.dayHours).toBe(48); // 4 L * 12h
    expect(kpis.hoursBreakdown.nightHours).toBe(48); // 4 N * 12h
  });
});
