import mongoose from "mongoose";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isoWeek from "dayjs/plugin/isoWeek";
import Alert, { IAlert } from "../models/alert.model";
import Service from "../models/service.model";
import { TurnAssignmentModel } from "../models/turn-assignment.model";
import Replacement from "../models/replacement.model";
import { ShiftExceptionModel } from "../models/shift-exception.model";
import { TurnSigla } from "../models/turn-sigla.model";
import socketService from "./socket.service";
import logger from "../config/logger.config";
import { AppError } from "../errors/app-error";
import { AlertDTO, AlertsListResponse } from "../types/alert.types";
import { AlertCandidate, RuleContext } from "./alert-rules/alert-rule.interface";
import { norm01Rule } from "./alert-rules/norm-01.rule";
import { norm02Rule } from "./alert-rules/norm-02.rule";
import { norm03Rule } from "./alert-rules/norm-03.rule";
import { ops01Rule } from "./alert-rules/ops-01.rule";
import { ops02Rule } from "./alert-rules/ops-02.rule";

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(isoWeek);

export class AlertService {
  /**
   * Obtiene la lista de alertas filtrada por servicio y/o estado,
   * calculando unreadCount y la distribución por severidad.
   */
  async getAlerts(filters: {
    serviceId?: string;
    status?: string;
    user?: {
      staffId?: string;
      isAdmin?: boolean;
    };
  }): Promise<AlertsListResponse["data"]> {
    const query: any = {};
    if (filters.status) {
      query.status = filters.status;
    }

    const isAdmin = filters.user?.isAdmin ?? true;
    const staffId = filters.user?.staffId;

    if (isAdmin) {
      if (filters.serviceId) {
        query.serviceId = filters.serviceId;
      }
    } else {
      if (!staffId) {
        return {
          alerts: [],
          unreadCount: 0,
          countsBySeverity: { critical: 0, high: 0, medium: 0 },
        };
      }

      // Buscar servicios asignados al funcionario como líder/jefatura
      const assignedServices = await Service.find({
        $or: [
          { jefe_servicio: staffId },
          { supervisor: staffId },
          { coordinadores: staffId },
          { jefes_turno: staffId },
        ],
        deleted_at: null,
        activo: true,
      }).select("_id");

      const assignedServiceIds = assignedServices.map((s: any) =>
        s._id ? s._id.toString() : s.toString(),
      );

      if (filters.serviceId) {
        if (assignedServiceIds.includes(filters.serviceId)) {
          query.serviceId = filters.serviceId;
        } else {
          // El usuario no está autorizado a ver alertas de este servicio
          return {
            alerts: [],
            unreadCount: 0,
            countsBySeverity: { critical: 0, high: 0, medium: 0 },
          };
        }
      } else {
        if (assignedServiceIds.length === 0) {
          return {
            alerts: [],
            unreadCount: 0,
            countsBySeverity: { critical: 0, high: 0, medium: 0 },
          };
        }
        query.serviceId = { $in: assignedServiceIds };
      }
    }

    const alerts = await Alert.find(query)
      .populate("serviceId", "nombre")
      .populate("staffId", "firstName lastName rut")
      .populate("positionId", "name")
      .sort({ created_at: -1 });

    const dtoList: AlertDTO[] = alerts.map((a: any) => {
      const staff = a.staffId as any;
      const position = a.positionId as any;
      const service = a.serviceId as any;

      return {
        id: a._id.toString(),
        ruleId: a.ruleId,
        severity: a.severity,
        category: a.category,
        serviceId: service?._id ? service._id.toString() : a.serviceId?.toString() || "",
        serviceName: service?.nombre,
        staffId: staff?._id ? staff._id.toString() : staff ? staff.toString() : undefined,
        staffName: staff?.firstName ? `${staff.firstName} ${staff.lastName}`.trim() : undefined,
        rut: staff?.rut,
        date: a.date ? dayjs(a.date).toISOString() : undefined,
        shiftSlot: a.shiftSlot,
        positionName: position?.name,
        message: a.message,
        context: a.context || {},
        status: a.status,
        resolutionNote: a.resolutionNote,
        createdAt: a.created_at ? dayjs(a.created_at).toISOString() : dayjs().toISOString(),
        acknowledgedAt: a.acknowledgedAt ? dayjs(a.acknowledgedAt).toISOString() : undefined,
        resolvedAt: a.resolvedAt ? dayjs(a.resolvedAt).toISOString() : undefined,
      };
    });

    const unreadCount = dtoList.filter((a) => a.status === "active").length;
    const countsBySeverity = {
      critical: dtoList.filter((a) => a.severity === "critical").length,
      high: dtoList.filter((a) => a.severity === "high").length,
      medium: dtoList.filter((a) => a.severity === "medium").length,
    };

    return {
      alerts: dtoList,
      unreadCount,
      countsBySeverity,
    };
  }

  /**
   * Marca una alerta como reconocida (acknowledged).
   */
  async acknowledgeAlert(id: string, staffId: string): Promise<IAlert> {
    const alert = await Alert.findById(id);
    if (!alert) {
      throw new AppError(404, "Alerta no encontrada");
    }

    alert.status = "acknowledged";
    alert.acknowledgedBy = staffId as any;
    alert.acknowledgedAt = new Date();
    await alert.save();

    socketService.emitAlertAcknowledged(
      alert.serviceId.toString(),
      alert._id.toString(),
    );

    return alert;
  }

  /**
   * Resuelve manualmente una alerta con justificación obligatoria.
   */
  async resolveAlert(
    id: string,
    resolutionNote: string,
    staffId?: string,
  ): Promise<IAlert> {
    const alert = await Alert.findById(id);
    if (!alert) {
      throw new AppError(404, "Alerta no encontrada");
    }

    alert.status = "resolved";
    alert.resolutionNote = resolutionNote;
    alert.resolvedAt = new Date();
    await alert.save();

    socketService.emitAlertResolved(
      alert.serviceId.toString(),
      alert._id.toString(),
    );

    return alert;
  }

  /**
   * Obtiene la clave única de transición para una alerta normativa,
   * permitiendo correlacionar alertas producidas en la misma frontera entre turnos.
   */
  private getTransitionKey(c: AlertCandidate): string | null {
    if (c.context?.transitionKey) {
      return `${c.staffId || ""}_${c.context.transitionKey}`;
    }
    const prevDate =
      c.context?.previousShiftDate ||
      c.context?.firstShiftDate ||
      (c.context?.nightShiftExit
        ? dayjs(c.context.nightShiftExit).format("YYYY-MM-DD")
        : null);
    const nextDate =
      c.context?.nextShiftDate ||
      c.context?.secondShiftDate ||
      (c.context?.nextShiftEntry
        ? dayjs(c.context.nextShiftEntry).format("YYYY-MM-DD")
        : null);

    if (prevDate && nextDate) {
      return `${c.staffId || ""}_${prevDate}_${nextDate}`;
    }
    return null;
  }

  /**
   * Jerarquía de Supresión y Deduplicación de Alertas:
   * Evita la ráfaga (cascada) de alertas sobre una misma transición o movimiento de turno.
   *
   * Jerarquía:
   * 1. NORM-02 (Jornada continua extrema / doble turno >= 20h):
   *    Causa raíz crítica que absorbe y suprime NORM-01 (< 12h descanso) y NORM-03 (< 24h descanso post-noche).
   * 2. NORM-03 (Descanso post-noche < 24h):
   *    Regla específica que absorbe y suprime NORM-01 (< 12h descanso) en transiciones de salida nocturna.
   * 3. NORM-01 (Descanso genérico < 12h):
   *    Se emite únicamente si no aplica NORM-02 ni NORM-03.
   * 4. Deduplicación por (ruleId, staffId, date).
   */
  public suppressCascadingAlerts(candidates: AlertCandidate[]): AlertCandidate[] {
    if (!candidates || candidates.length <= 1) {
      return candidates;
    }

    const transitionGroups = new Map<string, AlertCandidate[]>();
    const nonTransitionCandidates: AlertCandidate[] = [];

    for (const c of candidates) {
      const key = this.getTransitionKey(c);
      if (key) {
        const group = transitionGroups.get(key) || [];
        group.push(c);
        transitionGroups.set(key, group);
      } else {
        nonTransitionCandidates.push(c);
      }
    }

    const filteredTransitionCandidates: AlertCandidate[] = [];

    for (const [_key, group] of transitionGroups) {
      const hasNorm02 = group.some((c) => c.ruleId === "NORM-02");
      const hasNorm03 = group.some((c) => c.ruleId === "NORM-03");

      let filteredGroup = group;

      if (hasNorm02) {
        filteredGroup = filteredGroup.filter(
          (c) => c.ruleId !== "NORM-01" && c.ruleId !== "NORM-03",
        );
      } else if (hasNorm03) {
        filteredGroup = filteredGroup.filter((c) => c.ruleId !== "NORM-01");
      }

      filteredTransitionCandidates.push(...filteredGroup);
    }

    const seen = new Set<string>();
    const result: AlertCandidate[] = [];

    for (const c of [...filteredTransitionCandidates, ...nonTransitionCandidates]) {
      const dateStr = dayjs(c.date).format("YYYY-MM-DD");
      const dedupKey = `${c.ruleId}_${c.staffId || ""}_${dateStr}`;
      if (!seen.has(dedupKey)) {
        seen.add(dedupKey);
        result.push(c);
      }
    }

    return result;
  }

  /**
   * Nivel 1: Evaluación quirúrgica en tiempo real para un funcionario (< 10ms).
   * Se ejecuta ante eventos de mutación en asignaciones, reemplazos o excepciones.
   */
  async evaluateForStaff(
    staffId: string,
    serviceId: string,
    targetDate: Date = new Date(),
  ): Promise<AlertCandidate[]> {
    const startTime = performance.now();

    // Rango mínimo ±2 días y semana ISO completa para NORM-06
    const weekStart = dayjs(targetDate).startOf("isoWeek");
    const weekEnd = dayjs(targetDate).endOf("isoWeek");
    const sub2 = dayjs(targetDate).subtract(2, "day").startOf("day");
    const add2 = dayjs(targetDate).add(2, "day").endOf("day");

    const start = sub2.isBefore(weekStart) ? sub2.toDate() : weekStart.toDate();
    const end = add2.isAfter(weekEnd) ? add2.toDate() : weekEnd.toDate();

    // Carga paralela de turnos y reemplazos para el funcionario
    const [assignments, replacements, siglas] = await Promise.all([
      TurnAssignmentModel.find({
        staffId,
        $or: [
          { start_date: { $lte: end }, end_date: { $gte: start } },
          { start_date: { $lte: end }, end_date: null },
        ],
      }).lean(),
      Replacement.find({
        $or: [{ id_entrante: staffId }, { id_saliente: staffId }],
        fecha_inicio: { $lte: end },
        fecha_termino: { $gte: start },
        status: { $in: ["PENDIENTE", "EN CURSO", "FINALIZADO"] },
      }).lean(),
      TurnSigla.find({ deleted_at: null }).lean(),
    ]);

    const targetAssignmentIds = [
      ...assignments.map((a: any) => a._id),
      ...replacements.map((r: any) => r._id),
      staffId,
    ];

    const exceptions = await ShiftExceptionModel.find({
      assignment_id: { $in: targetAssignmentIds },
      date: { $gte: start, $lte: end },
    }).lean();

    const siglaMap = new Map<string, any>();
    siglas.forEach((s: any) => siglaMap.set(s.sigla, s));

    // Construir lista de turnos diarios consolidados
    const shifts: any[] = [];
    const totalDays = dayjs(end).diff(dayjs(start), "day") + 1;

    for (let i = 0; i < totalDays; i++) {
      const currentDay = dayjs(start).add(i, "day");
      const dateStr = currentDay.format("YYYY-MM-DD");

      // 1. Verificar excepción de turno
      const exception = exceptions.find(
        (e: any) => dayjs(e.date).format("YYYY-MM-DD") === dateStr,
      );
      if (exception) {
        const overrideSigla = exception.override_type;
        if (
          overrideSigla === "LIBRE" ||
          overrideSigla === "X" ||
          overrideSigla === "-"
        ) {
          continue;
        }
        const siglaInfo = siglaMap.get(overrideSigla);
        if (siglaInfo) {
          const entry = siglaInfo.start || "08:00";
          const exit = siglaInfo.end || "20:00";
          const isNight =
            overrideSigla.toUpperCase().includes("N") ||
            (entry >= "19:00" && exit <= "09:00");
          shifts.push({
            date: dateStr,
            entry,
            exit,
            sigla: overrideSigla,
            staffId,
            serviceId,
            hours: siglaInfo.hours || 12,
            isNight,
          });
          continue;
        }
      }

      // 2. Verificar reemplazos
      // Si el funcionario es el AUSENTE, no trabaja ese día
      const isAbsent = replacements.some(
        (r: any) =>
          r.id_saliente?.toString() === staffId &&
          dayjs(r.fecha_inicio).isSameOrBefore(currentDay, "day") &&
          dayjs(r.fecha_termino).isSameOrAfter(currentDay, "day"),
      );
      if (isAbsent) {
        continue;
      }

      // Si el funcionario es el REEMPLAZANTE, trabaja el turno asignado
      const replacement = replacements.find(
        (r: any) =>
          r.id_entrante?.toString() === staffId &&
          dayjs(r.fecha_inicio).isSameOrBefore(currentDay, "day") &&
          dayjs(r.fecha_termino).isSameOrAfter(currentDay, "day"),
      );

      if (replacement) {
        let entry = "08:00";
        let exit = "20:00";
        let sigla = replacement.tipo_turno || "L";
        const siglaInfo = siglaMap.get(sigla);

        if (siglaInfo) {
          entry = siglaInfo.start || entry;
          exit = siglaInfo.end || exit;
        }

        const isNight =
          sigla.toUpperCase().includes("N") ||
          (entry >= "19:00" && exit <= "09:00");
        const hours = siglaInfo?.hours || 12;

        shifts.push({
          date: dateStr,
          entry,
          exit,
          sigla,
          staffId,
          serviceId: replacement.servicio?.toString() || serviceId,
          hours,
          isNight,
        });
        continue;
      }

      // 3. Turno regular por asignación de ciclo
      const assignment = assignments.find(
        (a: any) =>
          dayjs(a.start_date).isSameOrBefore(currentDay, "day") &&
          (!a.end_date || dayjs(a.end_date).isSameOrAfter(currentDay, "day")),
      );

      if (assignment && assignment.snapshot_secuencia?.length) {
        const diffDays = currentDay.diff(dayjs(assignment.start_date).startOf("day"), "day");
        if (diffDays >= 0) {
          const seqIndex = diffDays % assignment.snapshot_secuencia.length;
          const seqDay = assignment.snapshot_secuencia[seqIndex];

          if (!seqDay.es_libre && seqDay.sigla !== "X" && seqDay.sigla !== "-") {
            const siglaInfo = siglaMap.get(seqDay.sigla);
            const entry = seqDay.turno_entrada || siglaInfo?.start || "08:00";
            const exit = seqDay.turno_salida || siglaInfo?.end || "20:00";
            const isNight =
              seqDay.sigla.toUpperCase().includes("N") ||
              (entry >= "19:00" && exit <= "09:00");
            const hours = siglaInfo?.hours || 12;

            shifts.push({
              date: dateStr,
              entry,
              exit,
              sigla: seqDay.sigla,
              staffId,
              serviceId: assignment.service?.toString() || serviceId,
              hours,
              isNight,
            });
          }
        }
      }
    }

    const context: RuleContext = {
      staffId,
      serviceId,
      dateRange: { start, end },
      assignments,
      replacements,
      exceptions,
    };
    (context as any).shifts = shifts;

    // Evaluación en memoria de las reglas individuales
    const [norm01, norm02, norm03, ops02] = await Promise.all([
      norm01Rule.evaluate(context),
      norm02Rule.evaluate(context),
      norm03Rule.evaluate(context),
      ops02Rule.evaluate(context),
    ]);

    const rawCandidates: AlertCandidate[] = [
      ...norm01,
      ...norm02,
      ...norm03,
      ...ops02,
    ];

    // Aplicar jerarquía de supresión y deduplicación (evita ráfaga/cascada de alertas)
    const candidates = this.suppressCascadingAlerts(rawCandidates);

    // Persistencia idempotente de alertas activas
    for (const candidate of candidates) {
      try {
        const candidateDay = dayjs(candidate.date).startOf("day").toDate();
        const nextDay = dayjs(candidateDay).add(1, "day").toDate();

        const existing = await Alert.findOne({
          staffId: candidate.staffId,
          ruleId: candidate.ruleId,
          date: { $gte: candidateDay, $lt: nextDay },
          status: "active",
        });

        if (!existing) {
          const newAlert = await Alert.create({
            ...candidate,
            serviceId: candidate.serviceId || serviceId,
            date: candidateDay,
            status: "active",
          });

          socketService.emitAlertNew(serviceId, newAlert);
        }
      } catch (err: any) {
        // En caso de conflicto de índice único de concurrencia, omitimos silenciosamente
        if (err.code !== 11000) {
          logger.warn(`[AlertService] Error guardando alerta: ${err.message}`);
        }
      }
    }

    // Auto-resolución de alertas normativas activas que dejaron de ser infracción en la ventana analizada
    try {
      const activeNormAlerts = await Alert.find({
        staffId,
        ruleId: { $in: ["NORM-01", "NORM-02", "NORM-03"] },
        date: { $gte: start, $lte: end },
        status: "active",
      });

      if (Array.isArray(activeNormAlerts)) {
        for (const activeAlert of activeNormAlerts) {
        const alertDateStr = dayjs(activeAlert.date).format("YYYY-MM-DD");
        const stillViolated = candidates.some(
          (c) =>
            c.ruleId === activeAlert.ruleId &&
            dayjs(c.date).format("YYYY-MM-DD") === alertDateStr,
        );

        if (!stillViolated) {
          activeAlert.status = "resolved";
          activeAlert.resolutionNote = "Auto-resuelto: infracción corregida";
          activeAlert.resolvedAt = new Date();
          await activeAlert.save();

          socketService.emitAlertResolved(
            (activeAlert.serviceId || serviceId).toString(),
            activeAlert._id.toString(),
          );
        }
      }
    }
  } catch (err: any) {
      logger.warn(`[AlertService] Error en auto-resolución para staff ${staffId}: ${err.message}`);
    }

    const duration = (performance.now() - startTime).toFixed(2);
    logger.info(
      `[AlertService] Evaluación para funcionario ${staffId} completada en ${duration}ms (${candidates.length} candidato/s detectados)`,
    );

    return candidates;
  }

  /**
   * Nivel 2: Evaluación programada diaria (06:00 AM) para los próximos 7 días.
   * Evalúa la dotación mínima (OPS-01) y auto-resuelve cuando un déficit ha sido cubierto.
   */
  async evaluateAllDaily(): Promise<{ evaluatedServices: number; newAlerts: number; autoResolved: number }> {
    const startTime = performance.now();
    const startDate = dayjs().startOf("day").toDate();
    const endDate = dayjs().add(6, "day").endOf("day").toDate();

    const services = await Service.find({
      activo: true,
      deleted_at: null,
      dotacion_minima: { $exists: true, $ne: [] },
    }).populate("dotacion_minima.positionId", "name");

    let totalNew = 0;
    let totalAutoResolved = 0;

    for (const service of services) {
      const serviceId = service._id.toString();
      const dotacion = service.dotacion_minima || [];
      if (dotacion.length === 0) continue;

      // Obtener asignaciones y reemplazos del servicio en la ventana de 7 días
      const [assignments, replacements] = await Promise.all([
        TurnAssignmentModel.find({
          service: service._id,
          $or: [
            { start_date: { $lte: endDate }, end_date: { $gte: startDate } },
            { start_date: { $lte: endDate }, end_date: null },
          ],
        }).populate("staffId", "positionId"),
        Replacement.find({
          servicio: service._id,
          fecha_inicio: { $lte: endDate },
          fecha_termino: { $gte: startDate },
          status: { $in: ["PENDIENTE", "EN CURSO"] },
        }).populate("id_entrante", "positionId"),
      ]);

      // Mapear conteo de personal presente efectivo por día, slot y cargo
      const dailyMap = new Map<string, number>();

      const totalDays = dayjs(endDate).diff(dayjs(startDate), "day") + 1;
      for (let d = 0; d < totalDays; d++) {
        const currentDay = dayjs(startDate).add(d, "day");
        const dateStr = currentDay.format("YYYY-MM-DD");

        // 1. Asignaciones regulares activas (excluyendo si tienen reemplazo ausente)
        for (const a of assignments) {
          const staff = a.staffId as any;
          const posId = staff?.positionId?.toString();
          if (!posId || !a.snapshot_secuencia?.length) continue;

          // Verificar si este funcionario está ausente por reemplazo ese día
          const isAbsent = replacements.some(
            (r: any) =>
              r.id_saliente?.toString() === staff._id?.toString() &&
              dayjs(r.fecha_inicio).isSameOrBefore(currentDay, "day") &&
              dayjs(r.fecha_termino).isSameOrAfter(currentDay, "day"),
          );
          if (isAbsent) continue;

          const diffDays = currentDay.diff(dayjs(a.start_date).startOf("day"), "day");
          if (diffDays >= 0) {
            const seqIndex = diffDays % a.snapshot_secuencia.length;
            const seqDay = a.snapshot_secuencia[seqIndex];
            if (!seqDay.es_libre && seqDay.sigla !== "X" && seqDay.sigla !== "-") {
              const slot = seqDay.sigla.toUpperCase().includes("N") ? "NOCHE" : "DIA";
              const key = `${dateStr}_${slot}_${posId}`;
              dailyMap.set(key, (dailyMap.get(key) || 0) + 1);
            }
          }
        }

        // 2. Reemplazantes presentes
        for (const r of replacements) {
          const staff = (r as any).id_entrante as any;
          const posId = staff?.positionId?.toString();
          if (!posId) continue;

          if (
            dayjs(r.fecha_inicio).isSameOrBefore(currentDay, "day") &&
            dayjs(r.fecha_termino).isSameOrAfter(currentDay, "day")
          ) {
            const slot = (r.tipo_turno || "").toUpperCase().includes("N") ? "NOCHE" : "DIA";
            const key = `${dateStr}_${slot}_${posId}`;
            dailyMap.set(key, (dailyMap.get(key) || 0) + 1);
          }
        }
      }

      const dailyPresent: any[] = [];
      dailyMap.forEach((count, key) => {
        const [dateStr, slot, positionId] = key.split("_");
        dailyPresent.push({
          date: dateStr,
          slot,
          positionId,
          count,
        });
      });

      const context: RuleContext = {
        serviceId,
        dateRange: { start: startDate, end: endDate },
        assignments,
        replacements,
        exceptions: [],
        dotacionMinima: dotacion,
      };
      (context as any).dailyPresent = dailyPresent;

      // Evaluar regla OPS-01
      const deficits = await ops01Rule.evaluate(context);

      // Conjunto de claves con déficit actual detectado: `${dateStr}_${slot}_${posId}`
      const activeDeficitKeys = new Set<string>();

      for (const def of deficits) {
        const dateStr = dayjs(def.date).format("YYYY-MM-DD");
        const key = `${dateStr}_${def.shiftSlot}_${def.positionId}`;
        activeDeficitKeys.add(key);

        const candidateDay = dayjs(def.date).startOf("day").toDate();
        const nextDay = dayjs(candidateDay).add(1, "day").toDate();

        // Idempotencia: Verificar si ya existe alerta activa
        const existing = await Alert.findOne({
          serviceId,
          ruleId: "OPS-01",
          date: { $gte: candidateDay, $lt: nextDay },
          shiftSlot: def.shiftSlot,
          positionId: def.positionId,
          status: "active",
        });

        if (!existing) {
          const created = await Alert.create({
            ...def,
            serviceId,
            date: candidateDay,
            status: "active",
          });
          socketService.emitAlertNew(serviceId, created);
          totalNew++;
        }
      }

      // Auto-resolución de alertas OPS-01 cuyo déficit ya se cubrió
      const activeOpsAlerts = await Alert.find({
        serviceId,
        ruleId: "OPS-01",
        date: { $gte: startDate, $lte: endDate },
        status: "active",
      });

      for (const activeAlert of activeOpsAlerts) {
        const dateStr = dayjs(activeAlert.date).format("YYYY-MM-DD");
        const posId = activeAlert.positionId ? activeAlert.positionId.toString() : "";
        const alertKey = `${dateStr}_${activeAlert.shiftSlot}_${posId}`;

        // Si ya no está en los déficits actuales, fue cubierto!
        if (!activeDeficitKeys.has(alertKey)) {
          activeAlert.status = "resolved";
          activeAlert.resolutionNote = "Auto-resuelto: dotación cubierta";
          activeAlert.resolvedAt = new Date();
          await activeAlert.save();

          socketService.emitAlertResolved(serviceId, activeAlert._id.toString());
          totalAutoResolved++;
        }
      }
    }

    const duration = (performance.now() - startTime).toFixed(2);
    logger.info(
      `[AlertService] Barrido diario completado en ${duration}ms. Evaluados: ${services.length} servicios, Nuevas alertas: ${totalNew}, Auto-resueltas: ${totalAutoResolved}`,
    );

    return {
      evaluatedServices: services.length,
      newAlerts: totalNew,
      autoResolved: totalAutoResolved,
    };
  }
}

export default new AlertService();
