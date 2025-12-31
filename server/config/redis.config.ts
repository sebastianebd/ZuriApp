import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

const redis = new Redis(redisUrl);

redis.on("connect", () => {
  console.log("Conectado a Redis");
});

redis.on("error", (err: any) => {
  console.error("Error en conexión a Redis:", err);
});

export const get = async (key: string) => {
  const value = await redis.get(key);
  return value ? JSON.parse(value) : null;
};

export const set = async (
  key: string,
  value: any,
  ttlSeconds: number = 300
) => {
  await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
};

export const del = async (key: string) => {
  await redis.del(key);
};

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
