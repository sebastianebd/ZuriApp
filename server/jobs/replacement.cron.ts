import socketIO from "../config/socket";
import cron from "node-cron";
import Replacement from "../models/replacement.model";
import logger from "../config/logger.config";
import * as Sentry from "@sentry/node";

cron.schedule("53 11 * * *", async () => {
  try {
    const now = new Date();
    const fechaActual = new Date(
      Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()),
    );

    const transicionEnCurso = await Replacement.updateMany(
      {
        status: "PENDIENTE",
        fecha_inicio: { $lte: fechaActual },
      },
      {
        $set: { status: "EN CURSO" },
      },
    );

    const transicionFinalizada = await Replacement.updateMany(
      {
        status: "EN CURSO",
        // fecha_termino: { $lt: fechaActual }, // lt logic depends on if terminiation is inclusive or exclusive. Assuming previous logic was correct.
        fecha_termino: { $lt: fechaActual },
      },
      {
        $set: { status: "FINALIZADO" },
      },
    );

    const transicionInterrumpida = await Replacement.updateMany(
      {
        status: "EN CURSO",
        corte_anticipado: true,
        fecha_termino: { $lt: fechaActual },
      },
      {
        $set: { status: "INTERRUMPIDO" },
      },
    );

    const totalModificados =
      transicionEnCurso.modifiedCount +
      transicionFinalizada.modifiedCount +
      transicionInterrumpida.modifiedCount;

    if (totalModificados > 0) {
      const io = socketIO.getIO();
      io.emit("replacementsUpdated", {
        message: "Estados de reemplazos actualizados automáticamente",
        count: totalModificados,
      });
    }
  } catch (error: any) {
    logger.error(`❌ Error en cron de estados: ${error.message}`);
    Sentry.captureException(error);
  }
});
