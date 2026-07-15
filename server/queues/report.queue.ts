import { Queue, Worker, Job } from "bullmq";
import dayjs from "dayjs";
import logger from "../config/logger.config";
import { getMonthlyReport } from "../services/report.service";
import ReportSnapshot from "../models/report-snapshot.model";
import Period from "../models/period.model";
import Service from "../models/service.model";
import { TurnAssignmentModel } from "../models/turn-assignment.model";
import { uploadToS3 } from "../config/s3.client";

// --- Configuración de Redis (misma que email.queue) ---
const redisConnection: any = {
  host: "localhost",
  port: 6379,
};

if (process.env.REDIS_URL) {
  const url = new URL(process.env.REDIS_URL);
  redisConnection.host = url.hostname;
  redisConnection.port = Number(url.port);
  redisConnection.password = url.password;
  redisConnection.username = url.username;
}

export const REPORT_CLOSURE_QUEUE = "report-closure-queue";

// 1. Definición de la Cola de Cierre Mensual (Producer)
export const reportClosureQueue = new Queue(REPORT_CLOSURE_QUEUE, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000, // 5s, 10s, 20s — más conservador que email porque los PDFs son pesados
    },
    removeOnComplete: 50,
    removeOnFail: 100, // Conservar más fallos para diagnóstico en bull-board
  },
});

/**
 * Genera un PDF simple como HTML para la cartola de servicio.
 * ponytail: html-pdf-node genera el PDF a partir de HTML string, sin template engine.
 */
async function generateServicePDF(
  serviceId: string,
  serviceName: string,
  month: number,
  year: number,
  usersData: any[],
): Promise<Buffer> {
  // ponytail: HTML inline en lugar de un template engine externo.
  // Techo conocido: para >500 usuarios el HTML puede ser grande; si ocurre OOM,
  // upgrade path = usar pdf con paginación o Puppeteer stream.
  const rows = usersData
    .map(
      (u) =>
        `<tr>
      <td>${u.user?.rut ?? ""}</td>
      <td>${u.user?.nombre ?? ""} ${u.user?.apellido ?? ""}</td>
      <td>${u.user?.cargo ?? ""}</td>
      <td style="text-align:center">${(u.totals?.hours ?? 0).toFixed(2)}</td>
      <td style="text-align:center">${(u.totals?.dayHours ?? 0).toFixed(2)}</td>
      <td style="text-align:center">${(u.totals?.nightHours ?? 0).toFixed(2)}</td>
    </tr>`,
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8"/>
      <style>
        body { font-family: Arial, sans-serif; font-size: 11px; padding: 20px; }
        h1 { color: #1e3a5f; font-size: 16px; }
        h2 { color: #2563eb; font-size: 13px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th { background: #1e3a5f; color: white; padding: 6px 8px; text-align: left; }
        td { padding: 5px 8px; border-bottom: 1px solid #e2e8f0; }
        tr:nth-child(even) { background: #f8fafc; }
        .footer { margin-top: 30px; font-size: 10px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 10px; }
      </style>
    </head>
    <body>
      <h1>🏥 Hospital Base San José de Osorno</h1>
      <h2>Cartola Oficial de Servicio — ${serviceName}</h2>
      <p>Período: ${dayjs(`${year}-${String(month).padStart(2, "0")}-01`).format("MMMM YYYY")} | Generado: ${dayjs().format("DD/MM/YYYY HH:mm")}</p>
      <table>
        <thead>
          <tr>
            <th>RUT</th><th>Funcionario</th><th>Cargo</th>
            <th>Hrs Totales</th><th>Hrs Diurnas</th><th>Hrs Nocturnas</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="footer">
        ZuriApp — Sistema de Gestión de Turnos y Reemplazos | Documento oficial inmutable
      </div>
    </body>
    </html>
  `;

  // Reemplazamos html-pdf-node por puppeteer puro para tener control total del ejecutable
  const puppeteer = await import("puppeteer");
  const browser = await puppeteer.launch({
    executablePath:
      process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium-browser",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "domcontentloaded" });
  const pdfBuffer = await page.pdf({ format: "a4", landscape: false });

  await browser.close();
  // page.pdf returns a Uint8Array in newer puppeteer, convert to Buffer
  return Buffer.from(pdfBuffer);
}

// 2. Definición del Worker de Cierre Mensual (Consumer)
export const setupReportClosureWorker = () => {
  const worker = new Worker(
    REPORT_CLOSURE_QUEUE,
    async (job: Job) => {
      const { month, year } = job.data as { month: number; year: number };
      logger.info(
        `[ReportWorker] Iniciando cierre mensual ${month}/${year} — Job ${job.id}`,
      );

      // 1. Obtener o crear el Period del mes a cerrar
      let period = await Period.findOne({ month, year });
      if (!period) {
        period = await Period.create({ month, year, status: "OPEN" });
      }
      if (period.status === "CLOSED") {
        logger.info(
          `[ReportWorker] Período ${month}/${year} ya está cerrado — saltando`,
        );
        return;
      }

      // 2. Obtener todos los servicios activos
      const services = await Service.find({ activo: true });
      logger.info(`[ReportWorker] Procesando ${services.length} servicios`);

      const pdfUrls = new Map<string, string>();

      // 3. Procesar servicios de a 1 (secuencial — protección de RAM)
      // ponytail: for...of garantiza ejecución secuencial sin saturar memoria.
      // Techo conocido: con 100+ servicios puede tardar varios minutos.
      // Upgrade path: paralelizar en grupos de 5 con Promise.all si el hardware lo permite.
      for (const service of services) {
        const serviceId = service._id.toString();
        const startOfMonth = dayjs(
          `${year}-${String(month).padStart(2, "0")}-01`,
        ).toDate();
        const endOfMonth = dayjs(startOfMonth).endOf("month").toDate();

        // Obtener todos los usuarios con turnos en este servicio/mes
        const userIds = await TurnAssignmentModel.find({
          service: service._id,
          start_date: { $lte: endOfMonth },
          $or: [{ end_date: { $gte: startOfMonth } }, { end_date: null }],
        }).distinct("user_id");

        if (userIds.length === 0) {
          logger.info(
            `[ReportWorker] Servicio ${service.nombre}: sin usuarios, saltando`,
          );
          continue;
        }

        const usersData: any[] = [];

        // 4. Calcular y guardar Snapshot por usuario
        for (const userId of userIds) {
          const userIdStr = userId.toString();
          try {
            // Reutilizar snapshot existente si ya fue creado
            const existing = await ReportSnapshot.findOne({
              user_id: userId,
              period_id: period._id,
            });

            let data: any;
            if (existing) {
              data = existing.snapshot_data;
            } else {
              data = await getMonthlyReport({ month, year, userId: userIdStr });
              await ReportSnapshot.create({
                user_id: userId,
                period_id: period._id,
                snapshot_data: data as Record<string, unknown>,
                generated_at: new Date(),
              });
            }
            usersData.push(data);
          } catch (err: any) {
            logger.warn(
              `[ReportWorker] Error procesando usuario ${userIdStr} en ${service.nombre}: ${err.message}`,
            );
          }
        }

        // 5. Generar PDF de la Cartola del Servicio
        try {
          const pdfBuffer = await generateServicePDF(
            serviceId,
            service.nombre,
            month,
            year,
            usersData,
          );

          // 6. Subir PDF a S3/MinIO
          const s3Key = `reportes/${year}/${String(month).padStart(2, "0")}/${serviceId}.pdf`;
          await uploadToS3(s3Key, pdfBuffer, "application/pdf");
          pdfUrls.set(serviceId, s3Key);

          logger.info(
            `[ReportWorker] ✅ Servicio ${service.nombre}: PDF generado y subido → ${s3Key}`,
          );
        } catch (err: any) {
          logger.error(
            `[ReportWorker] ❌ Error generando PDF para ${service.nombre}: ${err.message || err.name || JSON.stringify(err)}`,
          );
          console.error(err);
          // Continuar con el siguiente servicio — no abortar todo el Job
        }

        // Reportar progreso en bull-board
        await job.updateProgress(
          Math.round(((services.indexOf(service) + 1) / services.length) * 100),
        );
      }

      // 7. Actualizar el Period a CLOSED con las URLs de S3
      await Period.findByIdAndUpdate(period._id, {
        status: "CLOSED",
        closedAt: new Date(),
        pdfUrls,
      });

      logger.info(
        `[ReportWorker] ✅ Cierre mensual ${month}/${year} completado. ${pdfUrls.size} PDFs generados.`,
      );
    },
    { connection: redisConnection },
  );

  worker.on("failed", (job, err) => {
    logger.error(
      `[ReportWorker] Job ${job?.id} falló tras reintentos: ${err.message}`,
    );
  });

  worker.on("completed", (job) => {
    logger.info(`[ReportWorker] Job ${job.id} completado exitosamente`);
  });

  logger.info(
    `[ReportWorker] Worker inicializado en '${REPORT_CLOSURE_QUEUE}'`,
  );
  return worker;
};
