import { z } from "zod";

const trackShape = {
  albumId: z.string().uuid("ID d'album invalide"),

  title: z
    .string()
    .trim()
    .min(1, "Le titre est requis")
    .max(300, "Le titre ne peut pas dépasser 300 caractères"),

  trackNumber: z.coerce
    .number()
    .int()
    .positive("Le numéro de piste doit être positif"),

  discNumber: z.coerce
    .number()
    .int()
    .min(1, "Le numéro de disque doit être >= 1")
    .default(1),

  durationMs: z.coerce
    .number()
    .int()
    .positive("La durée doit être positive (ms)")
    .optional()
    .nullable(),

  // URL externe (YouTube, Spotify, Bandcamp, Qobuz, etc.)
  audioUrl: z
    .string()
    .url("URL invalide")
    .optional()
    .nullable(),
};

const trackObject = z.object(trackShape);

export const createTrackSchema = trackObject;

export const updateTrackSchema = trackObject.partial().extend({
  id: z.string().uuid("ID de piste invalide"),
});

export type CreateTrackInput = z.infer<typeof createTrackSchema>;
export type UpdateTrackInput = z.infer<typeof updateTrackSchema>;