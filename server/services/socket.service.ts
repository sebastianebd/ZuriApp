import socketConfig from "../config/socket";
import logger from "../config/logger.config";

/**
 * Servicio de Eventos en Tiempo Real (Socket.IO).
 * Abstrae la emisión de eventos para desacoplar la lógica de negocio de la infraestructura de websockets.
 */

const emitTurnUpdate = (userId: string) => {
  try {
    const io = socketConfig.getIO();
    // Evento: turn:update
    // Notifica al cliente (frontend) que debe re-fetch datos de calendario.
    io.emit("turn:update", { userId });
    logger.info(`[SocketService] Emitido turn:update para usuario ${userId}`);
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

export default {
  emitTurnUpdate,
  emitHistoryUpdate,
};
