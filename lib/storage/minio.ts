/**
 * Helpers MinIO / stockage d'objets : génération d'URLs présignées.
 * Complément de `lib/s3.ts` (client partagé) et `lib/storage/images.ts`
 * (upload direct serveur pour les images).
 */

// Client S3 partagé + bucket cible
import { s3, BUCKET } from "@/lib/s3";
// Commande de presigning PUT (upload direct depuis le client)
import { PutObjectCommand } from "@aws-sdk/client-s3";
// Générateur d'URLs signées à durée limitée
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/** Durée de validité d'une URL d'upload présignée. */
const UPLOAD_EXPIRY_SECONDS = 600; // 10 minutes

/** Taille maximale acceptée pour un fichier audio : 50 Mo. */
export const MAX_AUDIO_SIZE_BYTES = 50 * 1024 * 1024;

/** Types MIME audio autorisés, avec l'extension associée. */
const ALLOWED_AUDIO_TYPES = {
  "audio/mpeg": "mp3",
  "audio/ogg": "ogg",
  "audio/wav": "wav",
  "audio/flac": "flac",
  "audio/webm": "weba",
} as const;

/** Vérifie si un type MIME est un type audio accepté. */
export function isAllowedAudioType(
  contentType: string,
): contentType is keyof typeof ALLOWED_AUDIO_TYPES {
  return contentType in ALLOWED_AUDIO_TYPES;
}

/**
 * Génère une URL PUT présignée pour qu'un client upload directement
 * un fichier audio dans le bucket, sans transiter par le serveur Next.js
 * (et sans exposer les credentials MinIO).
 *
 * @param trackId - UUID de la piste cible ; sert de préfixe de clé
 *   (audio/tracks/<trackId>/<uuid>.<ext>) pour garder un arbre lisible.
 * @param contentType - Type MIME audio validé en amont (voir isAllowedAudioType).
 * @returns L'URL publique finale du fichier et l'URL PUT présignée.
 */
export async function presignTrackAudioUpload(
  trackId: string,
  contentType: keyof typeof ALLOWED_AUDIO_TYPES,
): Promise<{ audioUrl: string; uploadUrl: string }> {
  const ext = ALLOWED_AUDIO_TYPES[contentType];
  const key = `audio/tracks/${trackId}/${crypto.randomUUID()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
    ContentLength: MAX_AUDIO_SIZE_BYTES, // borne haute déclarée au presign
  });
  const uploadUrl = await getSignedUrl(s3, command, {
    expiresIn: UPLOAD_EXPIRY_SECONDS,
  });

  // Même convention d'URL publique que lib/storage/images.ts
  const audioUrl = `${process.env.MINIO_ENDPOINT}/${BUCKET}/${key}`;
  return { audioUrl, uploadUrl };
}
