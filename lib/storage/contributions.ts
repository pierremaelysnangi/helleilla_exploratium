/**
 * Stockage MinIO pour le workflow de contributions : médias en staging
 * privé, promus vers l'espace public à l'approbation.
 *
 * Cycle :
 * 1. `presignContributionUpload` -> PUT présigné vers
 *    `staging/contributions/{id}/…` (bucket privé, jamais public) ;
 * 2. relecture modérateur via URL GET présignée courte ;
 * 3. approbation -> `promoteContributionFiles` copie vers
 *    `bands/{bandId}/…` puis purge du staging.
 */

// Client S3 partagé + bucket
import { s3, BUCKET } from "@/lib/s3";
// Commandes S3 : presign PUT/GET + copie + suppression
import {
  PutObjectCommand,
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/** Durée de validité des URLs d'upload contributeur. */
const UPLOAD_EXPIRY = 900; // 15 min
/** Durée de validité des URLs de relecture modérateur. */
const REVIEW_EXPIRY = 3600; // 1 h

/** Types MIME acceptés pour les médias de contribution. */
export const CONTRIBUTION_MEDIA_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "audio/mpeg",
  "audio/ogg",
] as const;

export type ContributionMediaType = (typeof CONTRIBUTION_MEDIA_TYPES)[number];

/** Extension de fichier déduite du type MIME. */
function extFromMime(mime: ContributionMediaType): string {
  return mime === "image/jpeg"
    ? "jpg"
    : mime === "image/png"
      ? "png"
      : mime === "image/webp"
        ? "webp"
        : mime === "audio/mpeg"
          ? "mp3"
          : "ogg";
}

/**
 * Génère une URL PUT présignée vers l'espace STAGING d'une contribution.
 * Le préfixe est isolé par contribution et inaccessible publiquement.
 *
 * @param contributionId - UUID du dossier de contribution.
 * @param contentType - Type MIME validé en amont par la route.
 */
export async function presignContributionUpload(
  contributionId: string,
  contentType: ContributionMediaType,
): Promise<{ uploadUrl: string; fileKey: string }> {
  const fileKey = `staging/contributions/${contributionId}/${crypto.randomUUID()}.${extFromMime(contentType)}`;

  const uploadUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: fileKey,
      ContentType: contentType,
    }),
    { expiresIn: UPLOAD_EXPIRY },
  );
  return { uploadUrl, fileKey };
}

/**
 * Génère une URL GET présignée courte pour la RELECTURE d'un fichier
 * de staging par un modérateur (le bucket reste privé).
 */
export async function presignStagingReview(fileKey: string): Promise<string> {
  return getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: BUCKET, Key: fileKey }),
    { expiresIn: REVIEW_EXPIRY },
  );
}

/**
 * Promeut les fichiers de staging d'une contribution approuvée vers
 * l'espace public du groupe (`bands/{bandId}/…`), puis purge le staging.
 * Les clés réellement promues sont retournées pour mise à jour du payload.
 */
export async function promoteContributionFiles(
  contributionId: string,
  bandId: string,
): Promise<{ promotedKeys: string[] }> {
  // Inventaire du préfixe staging de la contribution
  const listed = await s3.send(
    new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: `staging/contributions/${contributionId}/`,
    }),
  );
  const objects = listed.Contents ?? [];
  if (objects.length === 0) return { promotedKeys: [] };

  const promotedKeys: string[] = [];
  for (const object of objects) {
    const sourceKey = object.Key!;
    if (!sourceKey || sourceKey.endsWith("/")) continue;
    const fileName = sourceKey.split("/").at(-1)!;
    const targetKey = `bands/${bandId}/${fileName}`;

    await s3.send(
      new CopyObjectCommand({
        Bucket: BUCKET,
        CopySource: `/${BUCKET}/${sourceKey}`,
        Key: targetKey,
      }),
    );
    promotedKeys.push(targetKey);
  }

  // Purge du staging après promotion réussie
  await s3.send(
    new DeleteObjectsCommand({
      Bucket: BUCKET,
      Delete: {
        Objects: objects.map((o) => ({ Key: o.Key! })),
        Quiet: true,
      },
    }),
  );

  return { promotedKeys };
}
