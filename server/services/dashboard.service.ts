import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import mongoose from "mongoose";
import * as redisConfig from "../config/redis.config";
import socketService from "./socket.service";
import Service from "../models/service.model";
import { TurnAssignmentModel } from "../models/turn-assignment.model";
import Replacement from "../models/replacement.model";
import { ShiftExceptionModel } from "../models/shift-exception.model";
import { TurnSigla } from "../models/turn-sigla.model";
import "../models/position.model";
import "../models/staff.model";
import "../models/turn-type.model";
import { AppError } from "../errors/app-error";
import { calculateDayNightMetrics } from "./report.service";
import { DashboardKPIResponse } from "../types/dashboard.types";
import logger from "../config/logger.config";

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

export class DashboardService {
  /**
   * Cálculo normalizado de tasa de reemplazos (replacementRate)
   * Formula: (totalShiftsReplaced / scheduledShiftDays) * 100
   * Retorna 0 si scheduledShiftDays es 0.
   */
  calculateReplacementRate(
    totalShiftsReplaced: number,
    scheduledShiftDays: number,
  ): number {
    if (scheduledShiftDays <= 0) return 0;
    return Number(((totalShiftsReplaced / scheduledShiftDays) * 100).toFixed(2));
  }

  /**
   * Evaluación de semáforo de cobertura según umbrales configurados
   */
  evaluateCoverageStatus(
    percentage: number,
    thresholds: { verde: number; amarillo: number },
  ): "optimal" | "warning" | "critical" {
    if (percentage >= thresholds.verde) {
      return "optimal";
    }
    if (percentage >= thresholds.amarillo) {
      return "warning";
    }
    return "critical";
  }

  /**
   * Cálculo de deltas comparativos respecto al mes anterior
   */
  calculateComparativeDeltas(
    current: {
      totalReplacements: number;
      replacementRate: number;
      coveragePercentage: number | null;
    },
    previous: {
      totalReplacements: number;
      replacementRate: number;
      coveragePercentage: number | null;
    } | null,
  ) {
    if (!previous) {
      return {
        replacementsDeltaPct: null,
        replacementRateDeltaPoints: null,
        coverageDeltaPoints: null,
      };
    }

    const replacementsDeltaPct =
      previous.totalReplacements > 0
        ? Number(
            (
              ((current.totalReplacements - previous.totalReplacements) /
                previous.totalReplacements) *
              100
            ).toFixed(2),
          )
        : null;

    const replacementRateDeltaPoints = Number(
      (current.replacementRate - previous.replacementRate).toFixed(2),
    );

    const coverageDeltaPoints =
      current.coveragePercentage !== null && previous.coveragePercentage !== null
        ? Number((current.coveragePercentage - previous.coveragePercentage).toFixed(2))
        : null;

    return {
      replacementsDeltaPct,
      replacementRateDeltaPoints,
      coverageDeltaPoints,
    };
  }

  /**
   * Cálculo de métricas de cobertura contra la dotación mínima configurada
   */
  calculateCoverageMetrics(
    service: any,
    dailyStaffing: Map<
      string,
      Map<number, { dayCount: number; nightCount: number }>
    >,
    daysInMonth: number,
  ): DashboardKPIResponse["data"]["coverage"] {
    const dotacion = service.dotacion_minima || [];
    const thresholds = {
      green: service.umbrales_cobertura?.verde ?? 95,
      yellow: service.umbrales_cobertura?.amarillo ?? 85,
    };

    if (dotacion.length === 0) {
      return {
        configured: false,
        overallPercentage: null,
        status: "optimal",
        thresholds,
        uncoveredSlotsCount: 0,
        byPosition: [],
      };
    }

    let totalSlotsRequired = 0;
    let totalSlotsCovered = 0;
    let totalUncovered = 0;

    const byPosition: DashboardKPIResponse["data"]["coverage"]["byPosition"] = [];

    for (const item of dotacion) {
      const posId = (item.positionId?._id || item.positionId || "").toString();
      const posName =
        item.positionId?.name || item.positionName || "Cargo no especificado";
      const minDay = item.minimo_dia || 0;
      const minNight = item.minimo_noche || 0;

      const positionDailyMap = dailyStaffing.get(posId);

      let posSlotsRequired = 0;
      let posSlotsCovered = 0;

      for (let day = 1; day <= daysInMonth; day++) {
        const dayStats = positionDailyMap?.get(day) || { dayCount: 0, nightCount: 0 };
        const dayRequired = minDay + minNight;
        posSlotsRequired += dayRequired;

        const dayCovered =
          Math.min(minDay, dayStats.dayCount) +
          Math.min(minNight, dayStats.nightCount);
        posSlotsCovered += dayCovered;
      }

      const uncovered = Math.max(0, posSlotsRequired - posSlotsCovered);
      const coveragePct =
        posSlotsRequired > 0
          ? Number(((posSlotsCovered / posSlotsRequired) * 100).toFixed(2))
          : 100;

      totalSlotsRequired += posSlotsRequired;
      totalSlotsCovered += posSlotsCovered;
      totalUncovered += uncovered;

      byPosition.push({
        positionId: posId,
        positionName: posName,
        minDay,
        minNight,
        coveragePercentage: coveragePct,
      });
    }

    const overallPercentage =
      totalSlotsRequired > 0
        ? Number(((totalSlotsCovered / totalSlotsRequired) * 100).toFixed(2))
        : 100;

    const status = this.evaluateCoverageStatus(overallPercentage, {
      verde: thresholds.green,
      amarillo: thresholds.yellow,
    });

    return {
      configured: true,
      overallPercentage,
      status,
      thresholds,
      uncoveredSlotsCount: totalUncovered,
      byPosition,
    };
  }

  /**
   * Invalida la caché de Redis para un servicio y emite notificación Socket.io
   */
  async invalidateDashboardCache(serviceId: string): Promise<void> {
    try {
      await redisConfig.delPattern(`kpi:service:${serviceId}:*`);
      socketService.emitDashboardInvalidated(serviceId);
      logger.info(
        `[DashboardService] Caché invalidada para servicio ${serviceId}`,
      );
    } catch (error) {
      logger.error(
        `[DashboardService] Error invalidando caché para ${serviceId}:`,
        error,
      );
    }
  }

  /**
   * Obtiene todos los KPIs del Dashboard por Servicio con soporte de Redis Cache
   */
  async getServiceKPIs(
    serviceId: string,
    month: number,
    year: number,
    accountStaffId?: string,
    staffRole?: { level?: number; permissions?: string[] },
    bypassCache = false,
  ): Promise<DashboardKPIResponse["data"]> {
    const cacheKey = `kpi:service:${serviceId}:${year}:${month}`;

    if (bypassCache) {
      try {
        await redisConfig.del(cacheKey);
        logger.info(`[DashboardService] Bypass cache solicitado. Clave eliminada: ${cacheKey}`);
      } catch (e) {
        logger.warn(`[DashboardService] Error eliminando clave en bypassCache: ${e}`);
      }
    } else {
      // 1. Intentar recuperar desde Redis
      try {
        const cached = await redisConfig.get(cacheKey);
        if (cached) {
          logger.info(`[DashboardService] Cache HIT para ${cacheKey}`);
          return { ...cached, cached: true };
        }
      } catch (e) {
        logger.warn(`[DashboardService] Error leyendo Redis: ${e}`);
      }
    }

    // 2. Fetch de Servicio
    const service = await Service.findById(serviceId).populate(
      "dotacion_minima.positionId",
    );
    if (!service) {
      throw new AppError(404, "Servicio no encontrado");
    }

    // Determinar si el usuario solicitante puede editar la dotación del servicio
    const isGlobalAdmin =
      staffRole?.level === 100 ||
      staffRole?.permissions?.includes("service.update");
    const isLocalChief =
      accountStaffId &&
      (service.jefe_servicio?.toString() === accountStaffId ||
        service.supervisor?.toString() === accountStaffId ||
        service.coordinadores?.some(
          (c: any) => c.toString() === accountStaffId,
        ));

    const canEditStaffing = Boolean(isGlobalAdmin || isLocalChief);

    // 3. Rangos de Fechas
    const startDate = dayjs()
      .year(year)
      .month(month - 1)
      .startOf("month");
    const endDate = startDate.endOf("month");
    const daysInMonth = endDate.date();

    // 4. Catálogo de Siglas
    const siglasDocs = await TurnSigla.find({});
    const siglaMap = new Map<
      string,
      {
        hours: number;
        dayHours: number;
        nightHours: number;
        start: string;
        end: string;
        isNight: boolean;
        sigla: string;
      }
    >();

    siglasDocs.forEach((s) => {
      const metrics = calculateDayNightMetrics(s.turno_entrada, s.turno_salida);
      const isNight =
        metrics.nightHours > metrics.dayHours ||
        (metrics.nightHours > 0 && metrics.dayHours === 0);
      const siglaData = {
        hours: metrics.totalHours,
        dayHours: metrics.dayHours,
        nightHours: metrics.nightHours,
        start: s.turno_entrada || "",
        end: s.turno_salida || "",
        isNight,
        sigla: s.sigla.toUpperCase(),
      };
      siglaMap.set(s.sigla.toUpperCase(), siglaData);
      if (s.nombre) {
        siglaMap.set(s.nombre.toUpperCase(), siglaData);
      }
    });

    // 5. Asignaciones de Turnos Oficiales (TurnAssignment)
    const assignments = await TurnAssignmentModel.find({
      service: serviceId,
      start_date: { $lte: endDate.toDate() },
      $or: [{ end_date: { $gte: startDate.toDate() } }, { end_date: null }],
    }).populate([
      "turn_type",
      { path: "staffId", populate: { path: "positionId" } },
    ]);

    const serviceFilter = mongoose.Types.ObjectId.isValid(serviceId)
      ? { $in: [new mongoose.Types.ObjectId(serviceId), serviceId] }
      : serviceId;

    const replacements = await Replacement.find({
      servicio: serviceFilter,
      fecha_inicio: { $lte: endDate.toDate() },
      fecha_termino: { $gte: startDate.toDate() },
      status: { $nin: ["ANULADO", "CANCELADO", "RECHAZADO"] },
    }).populate([
      { path: "id_saliente", populate: { path: "positionId" } },
      { path: "id_entrante", populate: { path: "positionId" } },
      "turn_type_id",
    ]);

    // 5.1 Cargar Excepciones de Turno (ShiftException) que alteran los patrones dentro del mes
    const assignmentIds = assignments.map((a: any) => a._id);
    const replacementIds = replacements.map((r: any) => r._id);
    const allTargetIds = [...assignmentIds, ...replacementIds];

    const exceptions =
      allTargetIds.length > 0
        ? await ShiftExceptionModel.find({
            assignment_id: { $in: allTargetIds },
            date: {
              $gte: startDate.startOf("month").toDate(),
              $lte: endDate.endOf("month").toDate(),
            },
          }).lean()
        : [];

    const exceptionMap = new Map<string, any>();
    exceptions.forEach((e: any) => {
      const dateStr = dayjs(e.date).format("YYYY-MM-DD");
      const key = `${e.assignment_id.toString()}_${dateStr}`;
      exceptionMap.set(key, e);
    });

    // Map para staffing diario por posición: positionId -> day -> { dayCount, nightCount }
    const dailyStaffing = new Map<
      string,
      Map<number, { dayCount: number; nightCount: number }>
    >();

    let scheduledShiftDays = 0;

    assignments.forEach((assign: any) => {
      const staff = assign.staffId;
      const positionId =
        staff?.positionId?._id?.toString() ||
        staff?.positionId?.toString() ||
        "sin_cargo";

      if (!dailyStaffing.has(positionId)) {
        dailyStaffing.set(positionId, new Map());
      }
      const positionMap = dailyStaffing.get(positionId)!;

      const seq =
        assign.snapshot_secuencia && assign.snapshot_secuencia.length > 0
          ? assign.snapshot_secuencia
          : assign.turn_type?.secuencia || [];

      for (let day = 1; day <= daysInMonth; day++) {
        const currentParamDate = startDate.date(day);
        const isWithin =
          dayjs(assign.start_date).isSameOrBefore(currentParamDate, "day") &&
          (!assign.end_date ||
            dayjs(assign.end_date).isSameOrAfter(currentParamDate, "day"));

        if (!isWithin) continue;

        let sigla = "";
        let esLibre = false;

        if (seq.length > 0) {
          const diff = currentParamDate.diff(
            dayjs(assign.start_date).startOf("day"),
            "day",
          );
          if (diff >= 0) {
            const patternDay = seq[diff % seq.length];
            sigla = patternDay.sigla.toUpperCase();
            esLibre = Boolean(patternDay.es_libre);
          }
        }

        // Aplicar excepción de turno si existe para esta asignación y fecha
        const dateStr = currentParamDate.format("YYYY-MM-DD");
        const exceptionKey = `${assign._id.toString()}_${dateStr}`;
        const exception = exceptionMap.get(exceptionKey);
        if (exception) {
          const override = (exception.override_type || "").toUpperCase();
          if (["LIBRE", "X", "-", ""].includes(override)) {
            esLibre = true;
            sigla = "X";
          } else {
            esLibre = false;
            const mappedInfo = siglaMap.get(override);
            sigla = mappedInfo ? mappedInfo.sigla : override;
          }
        }

        // Jornadas presenciales planificadas excluyen libres ('X', '-')
        if (sigla && !["X", "-", ""].includes(sigla) && !esLibre) {
          scheduledShiftDays++;

          const siglaInfo = siglaMap.get(sigla);
          const isNight = siglaInfo ? siglaInfo.isNight : sigla === "N";

          if (!positionMap.has(day)) {
            positionMap.set(day, { dayCount: 0, nightCount: 0 });
          }
          const currentCounts = positionMap.get(day)!;
          if (isNight) {
            currentCounts.nightCount++;
          } else {
            currentCounts.dayCount++;
          }
        }
      }
    });

    const totalReplacements = replacements.length;
    let totalShiftsReplaced = 0;
    let totalHours = 0;
    let dayHours = 0;
    let nightHours = 0;

    // Conteo por funcionario saliente para Top 5
    const salienteMap = new Map<
      string,
      {
        staffId: string;
        fullName: string;
        rut: string;
        positionName: string;
        replacementCount: number;
        totalShiftsReplaced: number;
      }
    >();

    replacements.forEach((rep: any) => {
      const saliente = rep.id_saliente;
      const salienteId = (saliente?._id || saliente || "unknown").toString();

      if (saliente && saliente._id) {
        if (!salienteMap.has(salienteId)) {
          salienteMap.set(salienteId, {
            staffId: salienteId,
            fullName: `${saliente.firstName || ""} ${saliente.lastName || ""}`.trim(),
            rut: saliente.rut || "N/A",
            positionName:
              (saliente.positionId as any)?.name ||
              saliente.cargo ||
              "Sin Cargo",
            replacementCount: 0,
            totalShiftsReplaced: 0,
          });
        }
        salienteMap.get(salienteId)!.replacementCount++;
      }

      // Conteo de jornadas efectivas dentro del mes
      const repStart = dayjs(rep.fecha_inicio).startOf("day");
      const repEnd = dayjs(rep.fecha_termino).endOf("day");

      const entrante = rep.id_entrante;
      const entrantePositionId =
        entrante?.positionId?._id?.toString() ||
        entrante?.positionId?.toString() ||
        (saliente?.positionId as any)?._id?.toString() ||
        (saliente?.positionId as any)?.toString() ||
        "sin_cargo";

      for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = startDate.date(day);
        if (
          currentDate.isSameOrAfter(repStart, "day") &&
          currentDate.isSameOrBefore(repEnd, "day")
        ) {
          let sigla = (rep.tipo_turno || "").toUpperCase();
          let esLibre = false;

          const secuencia =
            rep.snapshot_secuencia && rep.snapshot_secuencia.length > 0
              ? rep.snapshot_secuencia
              : rep.turn_type_id?.secuencia && rep.turn_type_id.secuencia.length > 0
                ? rep.turn_type_id.secuencia
                : null;

          if (secuencia && secuencia.length > 0) {
            const diff = currentDate.diff(repStart, "day");
            if (diff >= 0) {
              const pattern = secuencia[diff % secuencia.length];
              sigla = (pattern.sigla || "").toUpperCase();
              esLibre = Boolean(pattern.es_libre);
            }
          }

          // Aplicar excepción si existe para este reemplazo y fecha
          const dateStr = currentDate.format("YYYY-MM-DD");
          const exceptionKey = `${rep._id.toString()}_${dateStr}`;
          const exception = exceptionMap.get(exceptionKey);
          if (exception) {
            const override = (exception.override_type || "").toUpperCase();
            if (["LIBRE", "X", "-", ""].includes(override)) {
              esLibre = true;
              sigla = "X";
            } else {
              esLibre = false;
              const mappedInfo = siglaMap.get(override);
              sigla = mappedInfo ? mappedInfo.sigla : override;
            }
          }

          if (!["X", "-", ""].includes(sigla) && !esLibre) {
            totalShiftsReplaced++;
            scheduledShiftDays++;
            if (saliente && salienteMap.has(salienteId)) {
              salienteMap.get(salienteId)!.totalShiftsReplaced++;
            }

            const siglaInfo = siglaMap.get(sigla);
            const isNight = siglaInfo ? siglaInfo.isNight : sigla === "N";

            if (siglaInfo) {
              totalHours += siglaInfo.hours;
              dayHours += siglaInfo.dayHours;
              nightHours += siglaInfo.nightHours;
            } else {
              // Si no está la sigla mapeada, estimar horas default (8h)
              totalHours += 8;
              dayHours += 8;
            }

            // Cobertura de dotación diaria aportada por el reemplazante entrante
            if (!dailyStaffing.has(entrantePositionId)) {
              dailyStaffing.set(entrantePositionId, new Map());
            }
            const posDailyMap = dailyStaffing.get(entrantePositionId)!;
            if (!posDailyMap.has(day)) {
              posDailyMap.set(day, { dayCount: 0, nightCount: 0 });
            }
            const currentCounts = posDailyMap.get(day)!;
            if (isNight) {
              currentCounts.nightCount++;
            } else {
              currentCounts.dayCount++;
            }
          }
        }
      }
    });

    const replacementRate = this.calculateReplacementRate(
      totalShiftsReplaced,
      scheduledShiftDays,
    );

    // 7. Métricas de Cobertura
    const coverage = this.calculateCoverageMetrics(
      service,
      dailyStaffing,
      daysInMonth,
    );

    // 8. Top 5 Funcionarios Reemplazados
    const topReplacedStaff = Array.from(salienteMap.values())
      .sort((a, b) => b.totalShiftsReplaced - a.totalShiftsReplaced)
      .slice(0, 5);

    // 9. Horas y Porcentaje Nocturno
    totalHours = Number(totalHours.toFixed(2));
    dayHours = Number(dayHours.toFixed(2));
    nightHours = Number(nightHours.toFixed(2));
    const nightPercentage =
      totalHours > 0 ? Number(((nightHours / totalHours) * 100).toFixed(2)) : 0;

    // 10. Periodo Anterior y Comparativa
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;

    // Intentamos obtener el KPI del mes anterior de Redis si estuviera en caché
    let previousData: any = null;
    try {
      const prevCached = await redisConfig.get(
        `kpi:service:${serviceId}:${prevYear}:${prevMonth}`,
      );
      if (prevCached) {
        previousData = {
          totalReplacements: prevCached.summary?.totalReplacements ?? 0,
          replacementRate: prevCached.summary?.replacementRate ?? 0,
          coveragePercentage: prevCached.coverage?.overallPercentage ?? null,
        };
      }
    } catch {
      // Ignorar error de caché previa
    }

    const comparativeDeltas = this.calculateComparativeDeltas(
      {
        totalReplacements,
        replacementRate,
        coveragePercentage: coverage.overallPercentage,
      },
      previousData,
    );

    const resultData: DashboardKPIResponse["data"] = {
      period: { month, year },
      service: {
        id: service._id.toString(),
        name: service.nombre,
        canEditStaffing,
      },
      summary: {
        totalReplacements,
        replacementRate,
        scheduledShiftDays,
        totalShiftsReplaced,
      },
      coverage,
      hoursBreakdown: {
        totalHours,
        dayHours,
        nightHours,
        nightPercentage,
      },
      topReplacedStaff,
      comparative: {
        previousPeriod: { month: prevMonth, year: prevYear },
        ...comparativeDeltas,
      },
      cached: false,
      generatedAt: new Date().toISOString(),
    };

    // Guardar en Redis con TTL de 24 horas (86400s)
    try {
      await redisConfig.set(cacheKey, resultData, 86400);
      logger.info(`[DashboardService] Guardado en caché Redis: ${cacheKey}`);
    } catch (e) {
      logger.warn(`[DashboardService] Error guardando en Redis: ${e}`);
    }

    return resultData;
  }
}

export default new DashboardService();
