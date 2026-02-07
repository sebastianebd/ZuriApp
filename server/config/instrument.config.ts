import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

// Inicialización Temprana de Sentry
// Debe ser importado antes de cualquier otro módulo para instrumentar correctamente
// las llamadas a bajo nivel (http, db, etc.).
if (process.env.NODE_ENV !== "development") {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [nodeProfilingIntegration()],
    // Release Tracking
    // Asocia los errores con una versión específica del código, facilitando
    // identificar qué despliegue introdujo una regresión.
    release: "zuri-app@1.0.0",
    // Entorno de Ejecución
    // Permite filtrar errores por (development, staging, production)
    environment: process.env.NODE_ENV || "development",
    // Performance Monitoring
    // Muestreo del 100% (1.0) para capturar todas las trazas en esta etapa.
    // En alto tráfico, esto se debería reducir (ej: 0.1) para ahorrar cuota/costos.
    tracesSampleRate: 1.0,
    // Profiling
    // Permite analizar cuellos de botella de CPU/Memoria en producción.
    profilesSampleRate: 1.0,
  });
}
