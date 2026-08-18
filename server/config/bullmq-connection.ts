import env from "./env.config";

// --- Configuración compartida de Redis para BullMQ ---
// Se estandarizan los detalles de conexión para soportar tanto desarrollo local (host)
// como despliegues (parseando la REDIS_URL central).
const bullmqConnection: any = {
  host: "localhost", // Default Fallback (DX Local)
  port: 6379,
};

if (env.REDIS_URL) {
  const url = new URL(env.REDIS_URL);
  bullmqConnection.host = url.hostname;
  bullmqConnection.port = Number(url.port);
  bullmqConnection.password = url.password;
  bullmqConnection.username = url.username;
}

export default bullmqConnection;
