const { getIO } = require("../config/socket");
const cron = require("node-cron");
const Reemplazo = require("../models/replacement.model");
const logger = require("../config/logger.config");

cron.schedule("53 11 * * *", async () => {
  try {
    const now = new Date();
    const fechaActual = new Date(
      Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
    );

    const transicionEnCurso = await Reemplazo.updateMany(
      {
        status: "PENDIENTE",
        fecha_inicio: { $lte: fechaActual },
      },
      {
        $set: { status: "EN CURSO" },
      }
    );

    const transicionFinalizada = await Reemplazo.updateMany(
      {
        status: "EN CURSO",
        fecha_termino: { $lt: fechaActual },
      },
      {
        $set: { status: "FINALIZADO" },
      }
    );

    const transicionInterrumpida = await Reemplazo.updateMany(
      {
        status: "EN CURSO",
        corte_anticipado: true,
        fecha_termino: { $lt: fechaActual },
      },
      {
        $set: { status: "INTERRUMPIDO" },
      }
    );

    const totalModificados =
      transicionEnCurso.modifiedCount +
      transicionFinalizada.modifiedCount +
      transicionInterrumpida.modifiedCount;

    if (totalModificados > 0) {
      const io = getIO();
      io.emit("replacementsUpdated", {
        message: "Estados de reemplazos actualizados automáticamente",
        count: totalModificados,
      });
    }
  } catch (error) {
    logger.error(`❌ Error en cron de estados: ${error.message}`);
  }
});
