import Redis from "ioredis";
import env from "./env.config";
import logger from "./logger.config";

// Cliente Redis Singleton
// Utilizamos 'ioredis' por su soporte robusto para Promesas y Cluster.
const redisUrl = env.REDIS_URL;

const redis = new Redis(redisUrl);

redis.on("connect", () => {
  logger.info("✅ Conectado a Redis");
});

redis.on("error", (err: any) => {
  logger.error("❌ Error en conexión a Redis:", err);
});

// A continuación, exportamos wrappers tipados para operaciones comunes.
// Esto nos permite cambiar la implementación subyacente o añadir logging/métricas
// centralizado sin afectar al resto de la aplicación.

// Lectura Tipada (JSON)
export const get = async (key: string) => {
  const value = await redis.get(key);
  return value ? JSON.parse(value) : null;
};

// Escritura con TTL
// TTL (Time To Live) por defecto de 300s (5 min) para evitar datos obsoletos (Stale Data).
export const set = async (
  key: string,
  value: any,
  ttlSeconds: number = 300,
) => {
  await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
};

// Eliminación Directa
export const del = async (key: string) => {
  await redis.del(key);
};

// Invalidación por Patrón (Wildcard)
// Utiliza SCAN en lugar de KEYS para evitar bloquear el hilo principal de Redis
// en bases de datos con gran volumen de claves.
// Útil para invalidar grupos de caché (ej: "users:*") tras una actualización.
export const delPattern = (pattern: string) => {
  return new Promise<void>((resolve, reject) => {
    const stream = redis.scanStream({
      match: pattern,
    });

    stream.on("data", (keys) => {
      if (keys.length) {
        const pipeline = redis.pipeline();
        keys.forEach((key: any) => {
          pipeline.del(key);
        });
        pipeline.exec();
      }
    });

    stream.on("end", () => {
      resolve();
    });

    stream.on("error", (err) => {
      reject(err);
    });
  });
};

export default redis;
