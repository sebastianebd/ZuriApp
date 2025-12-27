import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

// Ensure Sentry is initialized before any other imports
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [nodeProfilingIntegration()],
  // Agregamos release para eliminar el warning
  release: "zuri-app@1.0.0",
  // Performance Monitoring
  tracesSampleRate: 1.0,
  // Profiling
  profilesSampleRate: 1.0,
});
