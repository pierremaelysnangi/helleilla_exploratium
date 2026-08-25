/**
 * Client S3 (compatible MinIO) partagé et nom du bucket.
 * Centralise la configuration du SDK AWS S3 pointant vers l'instance MinIO.
 */

// SDK AWS S3, utilisé en mode compatible MinIO
import { S3Client } from "@aws-sdk/client-s3";
import { env } from "./env"; // Variables d'environnement validées

/**
 * Client S3 configuré pour MinIO :
 * - région arbitraire (MinIO l'ignore)
 * - forcePathStyle obligatoire pour un endpoint MinIO auto-hébergé
 */
export const s3 = new S3Client({
  region: "us-east-1", // arbitraire, MinIO s'en fiche
  endpoint: env.MINIO_ENDPOINT,
  forcePathStyle: true, // obligatoire pour MinIO
  credentials: {
    accessKeyId: env.MINIO_ROOT_USER,
    secretAccessKey: env.MINIO_ROOT_PASSWORD,
  },
});

// Nom du bucket MinIO utilisé pour le stockage des images
export const BUCKET = env.MINIO_BUCKET;
