/**
 * POST /api/tracks/:id/audio — prépare l'upload du fichier audio d'une piste.
 * Retourne une URL PUT présignée (upload direct vers MinIO depuis le
 * client, sans transit par le serveur) et enregistre immédiatement
 * `audioUrl` sur la piste : l'URL devient valide dès la fin de l'upload.
 */

// Wrapper standard : validation + permission RBAC + rate limit strict
import { route } from "@/lib/api/handler";
import { ok, fail } from "@/lib/api/response";
import { idParamSchema } from "@/lib/api/schemas";
import { z } from "zod";
// Presigning + validation des types audio acceptés
import {
  presignTrackAudioUpload,
  isAllowedAudioType,
} from "@/lib/storage/minio";
// Lecture/écriture de la piste en base
import { getTrackById } from "@/db/queries/tracks";
import { updateTrack } from "@/db/mutations/tracks";

/** Corps attendu : type MIME du fichier à uploader. */
const audioUploadBodySchema = z.object({
  contentType: z.string().min(3).max(100),
});

/**
 * POST /api/tracks/:id/audio — presign un upload audio pour la piste.
 *
 * Réservé aux utilisateurs ayant la permission `track:update`
 * (contributor et au-delà). Rate limit strict (10/min, failMode closed).
 *
 * @returns 200 `{ uploadUrl, audioUrl }`, 404 si piste inexistante,
 *   422 si le type MIME n'est pas un format audio accepté.
 */
export const POST = route(
  {
    params: idParamSchema,
    body: audioUploadBodySchema,
    permission: { resource: "track", action: "update" },
    rateLimit: { limit: 10, window: 60, failMode: "closed" },
  },
  async ({ params, body }) => {
    const track = await getTrackById(params.id);
    if (!track) return fail("NOT_FOUND", "Piste introuvable");

    if (!isAllowedAudioType(body.contentType)) {
      return fail(
        "VALIDATION",
        "Format audio non supporté (MP3, OGG, WAV, FLAC, WEBM uniquement)",
      );
    }

    const { audioUrl, uploadUrl } = await presignTrackAudioUpload(
      params.id,
      body.contentType,
    );

    // L'URL publique est enregistrée tout de suite : elle pointera vers
    // le fichier dès que le client aura terminé son upload présigné
    await updateTrack(params.id, { audioUrl });

    return ok({ uploadUrl, audioUrl });
  },
);
