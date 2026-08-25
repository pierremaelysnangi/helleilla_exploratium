/**
 * Connexions Redis partagées.
 * Fournit deux clients ioredis distincts :
 * - `redisConnection` : pour BullMQ (files de tâches), avec retries illimités
 * - `redis` : pour le cache applicatif général
 */

// Client Redis (ioredis)
import IORedis from "ioredis";
import { env } from "./env"; // Variables d'environnement validées

// BullMQ exige maxRetriesPerRequest: null
// Connexion utilisée par BullMQ pour les workers et l'enqueue des jobs
export const redisConnection = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

// Connexion séparée pour le cache applicatif
// Client générique (cache applicatif) indépendant de la connexion BullMQ
export const redis = new IORedis(env.REDIS_URL);
