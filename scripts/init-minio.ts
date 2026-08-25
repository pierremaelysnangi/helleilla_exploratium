/**
 * Script d'initialisation de MinIO.
 * Crée le bucket s'il n'existe pas, puis applique une policy de lecture
 * publique sur les dossiers `covers/` et `logos/` afin que les images
 * soient servies directement au navigateur.
 */

// Commandes S3 : vérification/création de bucket et application de policy
import {
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
} from "@aws-sdk/client-s3";
import { s3, BUCKET } from "../lib/s3"; // Client S3 (MinIO) et nom du bucket

/**
 * Point d'entrée du script : vérifie l'existence du bucket (le crée sinon),
 * puis applique la politique de lecture publique sur covers/ et logos/.
 */
async function main() {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: BUCKET }));
    console.log(`✅ Bucket "${BUCKET}" existe déjà`);
  } catch {
    await s3.send(new CreateBucketCommand({ Bucket: BUCKET }));
    console.log(`✅ Bucket "${BUCKET}" créé`);
  }

  // Lecture publique sur /covers et /logos (les images doivent être servies au navigateur)
  const policy = {
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Principal: { AWS: ["*"] },
        Action: ["s3:GetObject"],
        Resource: [
          `arn:aws:s3:::${BUCKET}/covers/*`,
          `arn:aws:s3:::${BUCKET}/logos/*`,
        ],
      },
    ],
  };

  await s3.send(
    new PutBucketPolicyCommand({
      Bucket: BUCKET,
      Policy: JSON.stringify(policy),
    }),
  );
  console.log("✅ Policy de lecture publique appliquée");
}

// Lancement du script avec sortie en erreur (code 1) en cas d'échec
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
