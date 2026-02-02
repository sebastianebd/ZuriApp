import socketConfig from "../config/socket";
import logger from "../config/logger.config";

/**
 * Service to handle real-time Socket.IO events
 */

const emitTurnUpdate = (userId: string) => {
  try {
    const io = socketConfig.getIO();
    io.emit("turn:update", { userId });
    logger.info(`[SocketService] Emitted turn:update for user ${userId}`);
  } catch (e) {
    logger.warn(`[SocketService] Failed to emit update: ${e}`);
  }
};

const emitHistoryUpdate = (action: string, id: string) => {
  try {
    const io = socketConfig.getIO();
    io.emit("history:update", { action, id });
    logger.info(
      `[SocketService] Emitted history:update (${action}) for id ${id}`,
    );
  } catch (e) {
    logger.warn(`[SocketService] Failed to emit history update: ${e}`);
  }
};

export default {
  emitTurnUpdate,
  emitHistoryUpdate,
};
