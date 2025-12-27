import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

// Ensure Sentry is initialized before any other imports
if (process.env.NODE_ENV !== "development") {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [nodeProfilingIntegration()],
    // Agregamos release para eliminar el warning
    release: "zuri-app@1.0.0",
    // Environment (development, production)
    environment: process.env.NODE_ENV || "development",
    // Performance Monitoring
    tracesSampleRate: 1.0,
    // Profiling
    profilesSampleRate: 1.0,
  });
}
