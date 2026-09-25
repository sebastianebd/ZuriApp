import socketConfig from "../config/socket";
import logger from "../config/logger.config";

/**
 * Servicio de Eventos en Tiempo Real (Socket.IO).
 * Abstrae la emisión de eventos para desacoplar la lógica de negocio de la infraestructura de websockets.
 */

const emitTurnUpdate = (staffId: string) => {
  try {
    const io = socketConfig.getIO();
    // Evento: turn:update
    // Notifica al cliente (frontend) que debe re-fetch datos de calendario.
    io.emit("turn:update", { staffId });
    logger.info(`[SocketService] Emitido turn:update para staff ${staffId}`);
  } catch (e) {
    // Fail-safe: Si Socket.IO falla (ej: server reiniciando), no interrumpimos el flujo principal.
    logger.warn(`[SocketService] Fallo al emitir update: ${e}`);
  }
};

const emitHistoryUpdate = (action: string, id: string) => {
  try {
    const io = socketConfig.getIO();
    io.emit("history:update", { action, id });
    logger.info(
      `[SocketService] Emitido history:update (${action}) para id ${id}`,
    );
  } catch (e) {
    logger.warn(`[SocketService] Fallo al emitir history update: ${e}`);
  }
};

const emitDashboardInvalidated = (serviceId: string) => {
  try {
    const io = socketConfig.getIO();
    io.to(`service:${serviceId}`).emit("dashboard:invalidated", { serviceId });
    logger.info(
      `[SocketService] Emitido dashboard:invalidated para servicio ${serviceId}`,
    );
  } catch (e) {
    logger.warn(`[SocketService] Fallo al emitir dashboard:invalidated: ${e}`);
  }
};

const emitAlertNew = (serviceId: string, alert: any) => {
  try {
    const io = socketConfig.getIO();
    io.to(`service:${serviceId}`).to("hospital:all").emit("alert:new", alert);
    logger.info(
      `[SocketService] Emitido alert:new para servicio ${serviceId}, regla ${alert.ruleId || alert._id}`,
    );
  } catch (e) {
    logger.warn(`[SocketService] Fallo al emitir alert:new: ${e}`);
  }
};

const emitAlertAcknowledged = (serviceId: string, alertId: string) => {
  try {
    const io = socketConfig.getIO();
    io.to(`service:${serviceId}`).to("hospital:all").emit("alert:acknowledged", { alertId });
    logger.info(
      `[SocketService] Emitido alert:acknowledged para servicio ${serviceId}, alert ${alertId}`,
    );
  } catch (e) {
    logger.warn(`[SocketService] Fallo al emitir alert:acknowledged: ${e}`);
  }
};

const emitAlertResolved = (serviceId: string, alertId: string) => {
  try {
    const io = socketConfig.getIO();
    io.to(`service:${serviceId}`).to("hospital:all").emit("alert:resolved", { alertId });
    logger.info(
      `[SocketService] Emitido alert:resolved para servicio ${serviceId}, alert ${alertId}`,
    );
  } catch (e) {
    logger.warn(`[SocketService] Fallo al emitir alert:resolved: ${e}`);
  }
};

const emitOfferCreated = (serviceId: string, payload: any) => {
  try {
    const io = socketConfig.getIO();
    io.to(`service:${serviceId}`).emit("offer:created", payload);
    io.emit("offer:created", payload);
    logger.info(`[SocketService] Emitido offer:created para servicio ${serviceId}`);
  } catch (e) {
    logger.warn(`[SocketService] Fallo al emitir offer:created: ${e}`);
  }
};

const emitOfferWithdrawnConflict = (serviceId: string, payload: any) => {
  try {
    const io = socketConfig.getIO();
    io.to(`service:${serviceId}`).emit("offer:applicant_withdrawn", payload);
    io.emit("offer:applicant_withdrawn", payload);
    logger.info(`[SocketService] Emitido offer:applicant_withdrawn para servicio ${serviceId}`);
  } catch (e) {
    logger.warn(`[SocketService] Fallo al emitir offer:applicant_withdrawn: ${e}`);
  }
};

const emitOfferApplied = (serviceId: string, payload: any) => {
  try {
    const io = socketConfig.getIO();
    io.to(`service:${serviceId}`).emit("offer:applied", payload);
    io.emit("offer:applied", payload);
    logger.info(`[SocketService] Emitido offer:applied para servicio ${serviceId}, offer ${payload.offerId}`);
  } catch (e) {
    logger.warn(`[SocketService] Fallo al emitir offer:applied: ${e}`);
  }
};

const emitOfferCancelled = (serviceId: string, payload: any) => {
  try {
    const io = socketConfig.getIO();
    io.to(`service:${serviceId}`).emit("offer:cancelled", payload);
    io.emit("offer:cancelled", payload);
    logger.info(`[SocketService] Emitido offer:cancelled para servicio ${serviceId}, offer ${payload.offerId}`);
  } catch (e) {
    logger.warn(`[SocketService] Fallo al emitir offer:cancelled: ${e}`);
  }
};

const emitOfferAwarded = (staffId: string, payload: any) => {
  try {
    const io = socketConfig.getIO();
    io.to(`staff:${staffId}`).emit("offer:awarded", payload);
    io.emit("offer:awarded", payload);
    logger.info(`[SocketService] Emitido offer:awarded para staff ${staffId}, offer ${payload.offerId}`);
  } catch (e) {
    logger.warn(`[SocketService] Fallo al emitir offer:awarded: ${e}`);
  }
};

export default {
  emitTurnUpdate,
  emitHistoryUpdate,
  emitDashboardInvalidated,
  emitAlertNew,
  emitAlertAcknowledged,
  emitAlertResolved,
  emitOfferCreated,
  emitOfferApplied,
  emitOfferWithdrawnConflict,
  emitOfferCancelled,
  emitOfferAwarded,
};

