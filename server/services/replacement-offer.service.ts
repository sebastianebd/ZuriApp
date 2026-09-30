import mongoose from 'mongoose';
import ReplacementOffer from '../models/replacement-offer.model';
import Replacement from '../models/replacement.model';
import Staff from '../models/staff.model';
import Service from '../models/service.model';
import Alert from '../models/alert.model';
import socketService from './socket.service';
import { replacementOfferQueue } from '../queues/replacement-offer.queue';
import {
  CreateReplacementOfferDTO,
  ReplacementOfferListItemDTO,
} from '../types/replacement-offer.types';
import logger from '../config/logger.config';
import { delPattern } from '../config/redis.config';

function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

export function countActiveApplicants(applicants?: any[]): number {
  if (!applicants || !Array.isArray(applicants)) return 0;
  return applicants.filter(
    (a: any) => a.status === 'pending' || a.status === 'selected'
  ).length;
}

export class ReplacementOfferService {
  /**
   * Crea una nueva convocatoria de reemplazo y programa el delayed job en BullMQ.
   */
  static async createOffer(
    data: CreateReplacementOfferDTO,
    creatorStaffId: string
  ) {
    const saliente = await Staff.findById(data.id_saliente);
    if (!saliente) {
      const err: any = new Error('Funcionario saliente no encontrado');
      err.status = 404;
      throw err;
    }

    // Resolver Tipo de Turno si viene especificado
    let resolvedTurnTypeId: any = undefined;
    let resolvedSnapshotSecuencia: any = [];

    if (data.tipo_turno) {
      const { default: TurnTypeModel } = await import('../models/turn-type.model');
      const turnTypeDoc = await TurnTypeModel.findOne({
        nombre: {
          $regex: new RegExp(`^${escapeRegex(data.tipo_turno)}$`, 'i'),
        },
        deleted_at: null,
      });
      if (turnTypeDoc) {
        resolvedTurnTypeId = turnTypeDoc._id;
        resolvedSnapshotSecuencia = turnTypeDoc.toObject().secuencia?.map(({ color, ...rest }: any) => rest) || [];
      }
    }

    const offer = await ReplacementOffer.create({
      ...data,
      turn_type_id: resolvedTurnTypeId,
      snapshot_secuencia: resolvedSnapshotSecuencia,
      rut_saliente: saliente.rut,
      nombre_saliente: saliente.firstName,
      apellido_saliente: saliente.lastName,
      creado_por: creatorStaffId,
      status: 'open',
      applicants: [],
    });

    const delayMs = Math.max(0, new Date(data.expiresAt).getTime() - Date.now());
    await replacementOfferQueue.add(
      'expireOffer',
      { offerId: offer._id.toString() },
      { delay: delayMs }
    );

    socketService.emitOfferCreated(offer.serviceId.toString(), {
      offerId: offer._id.toString(),
      positionId: offer.positionId.toString(),
      tipo_turno: offer.tipo_turno,
      expiresAt: offer.expiresAt,
    });

    return {
      id: offer._id.toString(),
      ...offer.toObject ? offer.toObject() : offer,
    };
  }

  /**
   * Obtiene convocatorias de servicio para la jefatura de escritorio con filtros.
   */
  static async getOffers(filters: { serviceId?: string; status?: string }) {
    const query: any = {};
    if (filters.serviceId) query.serviceId = filters.serviceId;
    if (filters.status) query.status = filters.status;

    const offers = await ReplacementOffer.find(query)
      .populate(['serviceId', 'positionId', 'id_saliente', 'creado_por'])
      .sort({ created_at: -1 });

    return offers.map((offer: any) => {
      const srv = offer.serviceId;
      const pos = offer.positionId;
      return {
        id: offer._id.toString(),
        serviceId: srv?._id?.toString() || offer.serviceId?.toString(),
        serviceName: srv?.nombre || 'Servicio Hospitalario',
        positionId: pos?._id?.toString() || offer.positionId?.toString(),
        positionName: pos?.name || 'Cargo',
        status: offer.status,
        expiresAt: offer.expiresAt?.toISOString?.() || offer.expiresAt,
        fecha_inicio: offer.fecha_inicio?.toISOString?.() || offer.fecha_inicio,
        fecha_termino: offer.fecha_termino?.toISOString?.() || offer.fecha_termino,
        tipo_turno: offer.tipo_turno,
        applicantsCount: countActiveApplicants(offer.applicants),
        applicants: offer.applicants,
        id_saliente: offer.id_saliente?._id?.toString() || offer.id_saliente?.toString(),
        nombre_saliente: offer.apellido_saliente ? `${offer.nombre_saliente} ${offer.apellido_saliente}` : offer.nombre_saliente,
        rut_saliente: offer.rut_saliente,
        motivo: offer.motivo,
        observaciones: offer.observaciones,
        awardedStaffId: offer.awardedStaffId?.toString(),
        createdAt: offer.created_at?.toISOString?.() || offer.created_at,
        createdBy: offer.creado_por ? `${offer.creado_por.firstName} ${offer.creado_por.lastName}` : 'Desconocido',
      };
    });
  }

  /**
   * Obtiene convocatorias abiertas para el PWA de Honorarios (Confidencialidad Hospitalaria).
   * Oculta rut_saliente, nombre_saliente y motivo sensible.
   */
  static async getOpenOffersForHonorario(staffId: string) {
    const staff = await Staff.findById(staffId);
    if (!staff) {
      const err: any = new Error('Funcionario no encontrado');
      err.status = 404;
      throw err;
    }

    const posId = (staff.positionId as any)?._id || staff.positionId;

    const offers = await ReplacementOffer.find({
      positionId: posId,
      status: 'open',
      expiresAt: { $gt: new Date() },
    }).populate(['serviceId', 'positionId']);

    return offers.map((offer: any) => {
      const srv = offer.serviceId;
      const pos = offer.positionId;
      const hasApplied = offer.applicants?.some(
        (a: any) => a.staffId?.toString() === staffId && a.status !== 'cancelled_by_staff'
      );

      return {
        id: offer._id.toString(),
        serviceId: srv?._id?.toString() || offer.serviceId?.toString(),
        serviceName: srv?.nombre || 'Servicio Hospitalario',
        positionId: pos?._id?.toString() || offer.positionId?.toString(),
        positionName: pos?.name || 'Cargo',
        status: offer.status,
        expiresAt: offer.expiresAt?.toISOString?.() || offer.expiresAt,
        fecha_inicio: offer.fecha_inicio?.toISOString?.() || offer.fecha_inicio,
        fecha_termino: offer.fecha_termino?.toISOString?.() || offer.fecha_termino,
        tipo_turno: offer.tipo_turno,
        applicantsCount: countActiveApplicants(offer.applicants),
        hasApplied: !!hasApplied,
      };
    });
  }

  /**
   * Obtiene el listado de postulaciones efectuadas por el honorario autenticado.
   */
  static async getMyApplications(staffId: string) {
    const offers = await ReplacementOffer.find({
      'applicants.staffId': staffId,
    }).populate(['serviceId', 'positionId']);

    return offers.map((offer: any) => {
      const srv = offer.serviceId;
      const pos = offer.positionId;
      const myApp = offer.applicants?.find(
        (a: any) => a.staffId?.toString() === staffId
      );

      return {
        offerId: offer._id.toString(),
        serviceName: srv?.nombre || 'Servicio Hospitalario',
        positionName: pos?.name || 'Cargo',
        tipo_turno: offer.tipo_turno,
        fecha_inicio: offer.fecha_inicio?.toISOString?.() || offer.fecha_inicio,
        fecha_termino: offer.fecha_termino?.toISOString?.() || offer.fecha_termino,
        offerStatus: offer.status,
        myStatus: myApp?.status || 'pending',
        appliedAt: myApp?.appliedAt,
      };
    });
  }

  /**
   * Postula a una convocatoria abierta con pre-validación normativa.
   */
  static async applyToOffer(offerId: string, staffId: string) {
    const [offer, staff] = await Promise.all([
      ReplacementOffer.findById(offerId),
      Staff.findById(staffId),
    ]);

    if (!offer) {
      const err: any = new Error('Convocatoria no encontrada');
      err.status = 404;
      throw err;
    }

    if (offer.status !== 'open' || new Date(offer.expiresAt) < new Date()) {
      const err: any = new Error('La convocatoria no está abierta para postulaciones');
      err.status = 400;
      throw err;
    }

    if (!staff || !staff.isActive) {
      const err: any = new Error('Funcionario no habilitado');
      err.status = 403;
      throw err;
    }

    if (staff.contractType !== 'HONORARIO') {
      const err: any = new Error('Solo los funcionarios con contrato de Honorarios pueden postular a la bolsa');
      err.status = 400;
      throw err;
    }

    const staffPosId = (staff.positionId as any)?._id?.toString() || staff.positionId?.toString();
    const offerPosId = (offer.positionId as any)?._id?.toString() || offer.positionId?.toString();

    if (staffPosId !== offerPosId) {
      const err: any = new Error('Tu cargo no coincide con el perfil requerido en esta convocatoria');
      err.status = 400;
      throw err;
    }

    // Comprobar si ya postuló
    const existingApplicant = offer.applicants?.find(
      (a: any) => a.staffId?.toString() === staffId
    );

    if (existingApplicant && existingApplicant.status !== 'cancelled_by_staff') {
      const err: any = new Error('Ya tienes una postulación activa para esta convocatoria');
      err.status = 400;
      throw err;
    }

    // Pre-validación normativa: Comprobar que no tenga reemplazos activos superpuestos
    const conflictingReplacements = await Replacement.find({
      id_entrante: staffId,
      fecha_inicio: { $lte: offer.fecha_termino },
      fecha_termino: { $gte: offer.fecha_inicio },
      status: { $ne: 'anulado' },
    });

    if (conflictingReplacements.length > 0) {
      const err: any = new Error('Conflicto normativo: Ya tienes un turno asignado en las fechas de esta convocatoria');
      err.status = 400;
      throw err;
    }

    if (existingApplicant) {
      existingApplicant.status = 'pending';
      existingApplicant.appliedAt = new Date();
    } else {
      offer.applicants.push({
        staffId: new mongoose.Types.ObjectId(staffId),
        appliedAt: new Date(),
        status: 'pending',
      });
    }

    await offer.save();

    const activeCount = countActiveApplicants(offer.applicants);

    // 1. Crear alerta operacional OPS-05 en MongoDB para la campana de jefatura
    const staffName = `${staff.firstName} ${staff.lastName}`.trim();
    try {
      const alert = await Alert.create({
        ruleId: 'OPS-05',
        severity: 'medium',
        category: 'operational',
        serviceId: offer.serviceId,
        staffId: staff._id,
        date: offer.fecha_inicio,
        message: `Nuevo postulante a la bolsa de reemplazos: ${staffName} postuló a la convocatoria (${offer.tipo_turno}).`,
        context: {
          offerId: offer._id.toString(),
          applicantStaffId: staff._id.toString(),
          applicantName: staffName,
          applicantsCount: activeCount,
        },
        status: 'active',
      });

      // 2. Emitir notificación de alerta en tiempo real (campana)
      let serviceName: string | undefined;
      try {
        const srv = await Service.findById(offer.serviceId).select('nombre');
        serviceName = srv?.nombre;
      } catch {
        // ignore
      }

      socketService.emitAlertNew(offer.serviceId.toString(), {
        id: alert._id.toString(),
        ruleId: 'OPS-05',
        severity: 'medium',
        category: 'operational',
        serviceId: offer.serviceId.toString(),
        serviceName,
        staffId: staff._id.toString(),
        staffName,
        message: alert.message,
        status: 'active',
        createdAt: alert.created_at || new Date(),
      });
    } catch (alertErr) {
      logger.warn(`[ReplacementOffer] Error al crear alerta OPS-05: ${alertErr}`);
    }

    // 3. Emitir evento en tiempo real para que el contador de postulantes en la vista de bolsa aumente automáticamente
    socketService.emitOfferApplied(offer.serviceId.toString(), {
      offerId: offer._id.toString(),
      applicantsCount: activeCount,
    });

    return {
      success: true,
      message: 'Postulación registrada exitosamente',
    };
  }

  /**
   * Cancela voluntariamente la postulación activa del honorario.
   */
  static async withdrawApplication(offerId: string, staffId: string) {
    const offer = await ReplacementOffer.findById(offerId);
    if (!offer) {
      const err: any = new Error('Convocatoria no encontrada');
      err.status = 404;
      throw err;
    }

    const applicant = offer.applicants?.find(
      (a: any) => a.staffId?.toString() === staffId
    );

    if (!applicant || applicant.status !== 'pending') {
      const err: any = new Error('No tienes una postulación pendiente para cancelar');
      err.status = 400;
      throw err;
    }

    applicant.status = 'cancelled_by_staff';
    await offer.save();

    const activeCount = countActiveApplicants(offer.applicants);
    const serviceIdStr = (offer.serviceId as any)?._id?.toString() || offer.serviceId?.toString();

    // 1. Emitir evento en tiempo real para que el contador de postulantes se descuente (ej: de 1 a 0)
    if (serviceIdStr) {
      socketService.emitOfferApplied(serviceIdStr, {
        offerId: offer._id.toString(),
        applicantsCount: activeCount,
      });

      socketService.emitOfferWithdrawnConflict(serviceIdStr, {
        offerId: offer._id.toString(),
        staffId,
        applicantsCount: activeCount,
      });

      // 2. Si existía una alerta OPS-05 activa para esta postulación, resolverla y emitir actualización
      try {
        const activeAlert = await Alert.findOne({
          ruleId: 'OPS-05',
          'context.offerId': offer._id.toString(),
          staffId: staffId,
          status: 'active',
        });
        if (activeAlert) {
          activeAlert.status = 'resolved';
          activeAlert.resolutionNote = 'Postulación retirada por el funcionario';
          activeAlert.resolvedAt = new Date();
          await activeAlert.save();

          socketService.emitAlertResolved(serviceIdStr, activeAlert._id.toString());
        }
      } catch (e) {
        logger.warn(`[ReplacementOffer] Error al resolver alerta OPS-05 en retiro: ${e}`);
      }
    }

    return {
      success: true,
      message: 'Postulación cancelada voluntariamente',
    };
  }

  /**
   * Adjudica atómicamente la convocatoria a un postulante y aplica el retiro en cascada.
   */
  static async awardOffer(offerId: string, targetStaffId: string, awardedBy: string) {
    const offer = await ReplacementOffer.findById(offerId);
    if (!offer) {
      const err: any = new Error('Convocatoria no encontrada');
      err.status = 404;
      throw err;
    }

    if (offer.status !== 'open' && offer.status !== 'finalized') {
      const err: any = new Error('La convocatoria no está en estado adjudicable');
      err.status = 400;
      throw err;
    }

    const winningApplicant = offer.applicants?.find(
      (a: any) => a.staffId?.toString() === targetStaffId
    );

    if (!winningApplicant || winningApplicant.status !== 'pending') {
      const err: any = new Error('El funcionario seleccionado no es un postulante activo');
      err.status = 400;
      throw err;
    }

    const winnerStaff = await Staff.findById(targetStaffId);
    if (!winnerStaff) {
      const err: any = new Error('Funcionario adjudicado no encontrado');
      err.status = 404;
      throw err;
    }

    // 1. Marcar la oferta como adjudicada
    offer.status = 'filled';
    offer.awardedStaffId = new mongoose.Types.ObjectId(targetStaffId);
    offer.awardedAt = new Date();

    offer.applicants.forEach((a: any) => {
      if (a.staffId?.toString() === targetStaffId) {
        a.status = 'selected';
      } else if (a.status === 'pending') {
        a.status = 'not_selected';
      }
    });

    // 2. Crear el registro formal en Replacement
    const year = new Date(offer.fecha_inicio).getFullYear();
    const id_negocio = `REP-${year}-${offer._id.toString().slice(-4).toUpperCase()}`;

    const now = new Date();
    const initialStatus =
      new Date(offer.fecha_inicio).getTime() <= now.getTime()
        ? 'EN CURSO'
        : 'PENDIENTE';

    let turnTypeId = offer.turn_type_id;
    let snapshotSecuencia = offer.snapshot_secuencia;

    if (!snapshotSecuencia || snapshotSecuencia.length === 0) {
      const { default: TurnTypeModel } = await import('../models/turn-type.model');
      const turnTypeDoc = await TurnTypeModel.findOne({
        nombre: {
          $regex: new RegExp(`^${escapeRegex(offer.tipo_turno || '')}$`, 'i'),
        },
        deleted_at: null,
      });
      if (turnTypeDoc) {
        turnTypeId = turnTypeDoc._id;
        snapshotSecuencia = turnTypeDoc.toObject().secuencia?.map(({ color, ...rest }: any) => rest) || [];
        offer.turn_type_id = turnTypeId;
        offer.snapshot_secuencia = snapshotSecuencia;
      }
    }

    const replacement = await Replacement.create({
      id_negocio,
      id_saliente: offer.id_saliente,
      rut_saliente: offer.rut_saliente,
      nombre_saliente: offer.nombre_saliente,
      apellido_saliente: offer.apellido_saliente,
      id_entrante: winnerStaff._id,
      rut_entrante: winnerStaff.rut,
      nombre_entrante: winnerStaff.firstName,
      apellido_entrante: winnerStaff.lastName,
      servicio: offer.serviceId,
      fecha_inicio: offer.fecha_inicio,
      fecha_termino: offer.fecha_termino,
      motivo: offer.motivo,
      observaciones: offer.observaciones,
      tipo_turno: offer.tipo_turno,
      turn_type_id: turnTypeId,
      snapshot_secuencia: snapshotSecuencia,
      creado_por: new mongoose.Types.ObjectId(awardedBy),
      status: initialStatus,
    });

    offer.replacementId = replacement._id;
    await offer.save();

    await delPattern('replacements:*');
    if (replacement.servicio) {
      const dashboardService = (await import('./dashboard.service')).default;
      await dashboardService.invalidateDashboardCache(replacement.servicio.toString());
      const alertService = (await import('./alert.service')).default;
      alertService
        .evaluateForStaff(
          winnerStaff._id.toString(),
          replacement.servicio.toString(),
          replacement.fecha_inicio
        )
        .catch((err) => console.error('Error evaluating alerts on award:', err));
    }

    let serviceName: string | undefined;
    try {
      const srv = await Service.findById(offer.serviceId).select('nombre');
      serviceName = srv?.nombre;
    } catch {
      // ignore
    }

    socketService.emitOfferAwarded(winnerStaff._id.toString(), {
      offerId: offer._id.toString(),
      replacementId: replacement._id.toString(),
      staffId: winnerStaff._id.toString(),
      serviceId: offer.serviceId.toString(),
      serviceName,
      tipo_turno: offer.tipo_turno,
      fecha_inicio: offer.fecha_inicio,
      fecha_termino: offer.fecha_termino,
      message: `¡Felicitaciones! Has sido adjudicado/a para el reemplazo en ${serviceName || 'Servicio'} (${offer.tipo_turno}). Revisa tus turnos en el calendario.`,
    });

    socketService.emitTurnUpdate(winnerStaff._id.toString());

    // 3. Retiro en Cascada: buscar otras ofertas abiertas donde targetStaffId figure como postulante
    const conflictingOffers = await ReplacementOffer.find({
      _id: { $ne: offer._id },
      status: 'open',
      'applicants.staffId': targetStaffId,
      'applicants.status': 'pending',
    });

    for (const other of conflictingOffers) {
      // Comprobamos colisión temporal o de descanso continuo
      const otherStart = new Date(other.fecha_inicio).getTime();
      const otherEnd = new Date(other.fecha_termino).getTime();
      const offerStart = new Date(offer.fecha_inicio).getTime();
      const offerEnd = new Date(offer.fecha_termino).getTime();

      // Conflicto de superposición o descanso insuficiente (< 12 hrs entre turnos)
      const twelveHoursMs = 12 * 60 * 60 * 1000;
      const isOverlap = otherStart <= offerEnd && otherEnd >= offerStart;
      const isRestConflict =
        Math.abs(otherStart - offerEnd) < twelveHoursMs ||
        Math.abs(offerStart - otherEnd) < twelveHoursMs;

      if (isOverlap || isRestConflict) {
        const applicantToWithdraw = other.applicants?.find(
          (a: any) => a.staffId?.toString() === targetStaffId
        );
        if (applicantToWithdraw) {
          applicantToWithdraw.status = 'withdrawn_conflict';
          await other.save();

          socketService.emitOfferWithdrawnConflict(other.serviceId.toString(), {
            offerId: other._id.toString(),
            staffId: targetStaffId,
            reason: 'Adjudicación en otra convocatoria colisionante',
          });
        }
      }
    }

    return {
      success: true,
      message: 'Convocatoria adjudicada y reemplazo creado formalmente',
      replacementId: replacement._id,
      id_negocio,
    };
  }

  /**
   * Anula una convocatoria por parte de la jefatura.
   */
  static async cancelOffer(offerId: string, cancelledBy: string, reason?: string) {
    const offer = await ReplacementOffer.findById(offerId);
    if (!offer) {
      const err: any = new Error('Convocatoria no encontrada');
      err.status = 404;
      throw err;
    }

    if (offer.status === 'filled') {
      const err: any = new Error('No se puede cancelar una convocatoria ya adjudicada');
      err.status = 400;
      throw err;
    }

    offer.status = 'cancelled';
    if (reason) {
      offer.observaciones = `${offer.observaciones || ''} [Cancelada: ${reason}]`.trim();
    }
    await offer.save();

    socketService.emitOfferCancelled(offer.serviceId.toString(), {
      offerId: offer._id.toString(),
      status: 'cancelled',
    });

    return {
      success: true,
      message: 'Convocatoria cancelada exitosamente',
    };
  }

  /**
   * Procesa la expiración de una oferta (invocado por el worker BullMQ al vencer expiresAt).
   */
  static async processOfferExpiration(offerId: string) {
    const offer = await ReplacementOffer.findById(offerId);
    if (!offer || offer.status !== 'open') {
      return;
    }

    offer.status = 'finalized';

    const applicantsCount = offer.applicants?.length || 0;
    
    const isDesierta = applicantsCount === 0;
    const alertMessage = isDesierta
      ? `Convocatoria de reemplazo para ${offer.tipo_turno} finalizó desierta (0 postulantes). Requiere búsqueda activa.`
      : `Convocatoria de reemplazo para ${offer.tipo_turno} finalizada. Tienes ${applicantsCount} postulante(s) pendiente(s) de asignación.`;
    
    const severity = isDesierta ? 'high' : 'medium';

    if (isDesierta) {
      logger.warn(`[ReplacementOffer] Convocatoria ${offerId} finalizó desierta (0 postulantes).`);
    } else {
      logger.info(`[ReplacementOffer] Convocatoria ${offerId} finalizada con ${applicantsCount} postulante(s).`);
    }
      
    const alert = await Alert.create({
      ruleId: 'OPS-04',
      severity: severity,
      category: 'operational',
      serviceId: offer.serviceId,
      date: offer.fecha_inicio,
      message: alertMessage,
      context: {
        offerId: offer._id.toString(),
        tipo_turno: offer.tipo_turno,
      },
      status: 'active',
    });

    socketService.emitAlertNew(offer.serviceId.toString(), {
      id: alert._id.toString(),
      ruleId: 'OPS-04',
      severity: severity,
      category: 'operational',
      serviceId: offer.serviceId.toString(),
      message: alert.message,
      context: alert.context,
      status: 'active',
      createdAt: new Date().toISOString(),
    });

    await offer.save();
  }
}

export default ReplacementOfferService;
