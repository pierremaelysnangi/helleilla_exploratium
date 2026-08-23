import { S3Client } from "@aws-sdk/client-s3";
import { env } from "./env";

export const s3 = new S3Client({
  region: "us-east-1", // arbitraire, MinIO s'en fiche
  endpoint: env.MINIO_ENDPOINT,
  forcePathStyle: true, // obligatoire pour MinIO
  credentials: {
    accessKeyId: env.MINIO_ROOT_USER,
    secretAccessKey: env.MINIO_ROOT_PASSWORD,
  },
});

export const BUCKET = env.MINIO_BUCKET;
