const { Server } = require("socket.io");
const logger = require("./logger.config");

let ioInstance;

const init = (httpServer, clientUrl) => {
  if (ioInstance) {
    return ioInstance;
  }

  ioInstance = new Server(httpServer, {
    cors: {
      origin: clientUrl,
      methods: ["GET", "POST"],
    },
  });

  ioInstance.on("connection", (socket) => {
    logger.info(`🟢 Cliente conectado: ${socket.id}`);

    socket.on("disconnect", () => {
      logger.info(`🔴 Cliente desconectado: ${socket.id}`);
    });
  });

  return ioInstance;
};

const getIO = () => {
  if (!ioInstance) {
    throw new Error("Socket.io no está inicializado. Llama a init() primero.");
  }
  return ioInstance;
};

module.exports = {
  init,
  getIO,
};
