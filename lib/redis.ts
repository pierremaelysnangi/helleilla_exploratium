import IORedis from "ioredis";
import { env } from "./env";

// BullMQ exige maxRetriesPerRequest: null
export const redisConnection = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

// Connexion séparée pour le cache applicatif
export const redis = new IORedis(env.REDIS_URL);