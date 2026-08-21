import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3, BUCKET } from "@/lib/s3";
import { randomUUID } from "crypto";

type ImageFolder = "logos" | "covers";

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 Mo
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export class ImageValidationError extends Error {}

function assertValidImage(file: File) {
  if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
    throw new ImageValidationError(
      `Type de fichier non autorisé : ${file.type}. Formats acceptés : JPEG, PNG, WEBP.`
    );
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new ImageValidationError(
      `Fichier trop volumineux (${(file.size / 1024 / 1024).toFixed(1)} Mo). Max 5 Mo.`
    );
  }
}

function extFromMime(mime: string) {
  return mime === "image/jpeg" ? "jpg" : mime === "image/png" ? "png" : "webp";
}

/**
 * Upload une image vers MinIO dans le dossier donné (logos/ ou covers/).
 * Retourne l'URL publique complète.
 */
export async function uploadImage(file: File, folder: ImageFolder): Promise<string> {
  assertValidImage(file);

  const ext = extFromMime(file.type);
  const key = `${folder}/${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  return `${process.env.MINIO_ENDPOINT}/${BUCKET}/${key}`;
}

/**
 * Supprime une image à partir de son URL publique complète.
 * Ne throw pas si l'objet n'existe pas / URL invalide — juste un warn.
 */
export async function deleteImage(url: string | null | undefined): Promise<void> {
  if (!url) return;

  try {
    const marker = `/${BUCKET}/`;
    const idx = url.indexOf(marker);
    if (idx === -1) return;

    const key = url.slice(idx + marker.length);
    if (!key) return;

    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  } catch (err) {
    console.warn(`⚠️ Impossible de supprimer l'image ${url}:`, err);
  }
}