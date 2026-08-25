import { z } from "zod";
import { registerPath } from "./registry";
import { jsonOk, pick } from "./responses";
import {
  AlbumSchema,
  BandSchema,
  GenreSchema,
  PaginatedMetaSchema,
  PaginationQuerySchema,
  TrackSchema,
  UuidParamSchema,
} from "./schemas";
import { createBandSchema, updateBandSchema } from "@/lib/validations/band";
import { createAlbumSchema, updateAlbumSchema } from "@/lib/validations/album";
import { createTrackSchema, updateTrackSchema } from "@/lib/validations/track";
import { createGenreSchema } from "@/lib/validations/genre";

function listSchema<T extends z.ZodType>(item: T) {
  return z.object({ items: z.array(item), meta: PaginatedMetaSchema });
}

function json<T extends z.ZodType>(schema: T) {
  return { content: { "application/json": { schema } } };
}

type Resource = {
  name: string;
  tag: string;
  path: string;
  entity: z.ZodType;
  create: z.ZodType;
  update: z.ZodType;
};

const resources: Resource[] = [
  {
    name: "band",
    tag: "bands",
    path: "/api/bands",
    entity: BandSchema,
    create: createBandSchema,
    update: updateBandSchema,
  },
  {
    name: "album",
    tag: "albums",
    path: "/api/albums",
    entity: AlbumSchema,
    create: createAlbumSchema,
    update: updateAlbumSchema,
  },
  {
    name: "track",
    tag: "tracks",
    path: "/api/tracks",
    entity: TrackSchema,
    create: createTrackSchema,
    update: updateTrackSchema,
  },
];

for (const r of resources) {
  registerPath(r.path, "get", {
    tags: [r.tag],
    summary: `Liste les ${r.tag}`,
    requestParams: { query: PaginationQuerySchema },
    responses: {
      200: jsonOk(listSchema(r.entity)),
      ...pick(422, 429, 500),
    },
  });

  registerPath(r.path, "post", {
    tags: [r.tag],
    summary: `Crée un ${r.name}`,
    security: [{ sessionCookie: [] }],
    requestBody: json(r.create),
    responses: {
      201: jsonOk(r.entity, "Créé"),
      ...pick(401, 403, 422, 429, 500),
    },
  });

  registerPath(`${r.path}/{id}`, "get", {
    tags: [r.tag],
    summary: `Récupère un ${r.name}`,
    requestParams: { path: UuidParamSchema },
    responses: {
      200: jsonOk(r.entity),
      ...pick(404, 422, 429, 500),
    },
  });

  registerPath(`${r.path}/{id}`, "patch", {
    tags: [r.tag],
    summary: `Modifie un ${r.name}`,
    security: [{ sessionCookie: [] }],
    requestParams: { path: UuidParamSchema },
    requestBody: json(r.update),
    responses: {
      200: jsonOk(r.entity),
      ...pick(401, 403, 404, 422, 429, 500),
    },
  });

  registerPath(`${r.path}/{id}`, "delete", {
    tags: [r.tag],
    summary: `Supprime un ${r.name}`,
    security: [{ sessionCookie: [] }],
    requestParams: { path: UuidParamSchema },
    responses: {
      200: jsonOk(z.object({ id: z.string().uuid() })),
      ...pick(401, 403, 404, 422, 429, 500),
    },
  });
}

registerPath("/api/genres", "get", {
  tags: ["genres"],
  summary: "Liste les genres",
  responses: {
    200: jsonOk(z.object({ items: z.array(GenreSchema) })),
    ...pick(429, 500),
  },
});

registerPath("/api/genres", "post", {
  tags: ["genres"],
  summary: "Crée un genre (moderator+)",
  security: [{ sessionCookie: [] }],
  requestBody: json(createGenreSchema),
  responses: {
    201: jsonOk(GenreSchema, "Créé"),
    ...pick(401, 403, 422, 429, 500),
  },
});
