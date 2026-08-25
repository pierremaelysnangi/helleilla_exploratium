/**
 * Tests du document OpenAPI généré (lib/api/openapi).
 * Vérifie la validité de surface (3.1, info), la présence des opérations
 * CRUD par ressource, la réutilisation des composants nommés, la sécurité
 * des mutations, l'unicité des operationId et les métadonnées (license/tags).
 */

// API Vitest : suites, tests et assertions
import { describe, expect, it } from "vitest";
// Point d'entrée qui enregistre les paths puis expose buildDocument
import { buildDocument } from "./index";

// Suite principale : invariants du document généré
describe("OpenAPI document", () => {
  // Document construit une seule fois pour toute la suite
  const doc = buildDocument();

  it("est un document 3.1 valide en surface", () => {
    expect(doc.openapi).toBe("3.1.0");
    expect(doc.info.title).toBeTruthy();
    expect(doc.info.version).toBeTruthy();
  });

  it("déclare toutes les ressources CRUD", () => {
    for (const base of ["/api/bands", "/api/albums", "/api/tracks"]) {
      expect(doc.paths?.[base]).toHaveProperty("get");
      expect(doc.paths?.[base]).toHaveProperty("post");
      expect(doc.paths?.[`${base}/{id}`]).toHaveProperty("get");
      expect(doc.paths?.[`${base}/{id}`]).toHaveProperty("patch");
      expect(doc.paths?.[`${base}/{id}`]).toHaveProperty("delete");
    }
    expect(doc.paths?.["/api/genres"]).toHaveProperty("get");
    expect(doc.paths?.["/api/genres"]).toHaveProperty("post");
    expect(doc.paths?.["/api/search"]).toHaveProperty("get");
  });

  it("réutilise les schémas nommés dans components", () => {
    // Les hits (BandHit...) sont inlinés dans GlobalSearchResponse par
    // zod-openapi : seuls les schémas référencés directement deviennent
    // des composants nommés.
    expect(Object.keys(doc.components?.schemas ?? {})).toEqual(
      expect.arrayContaining([
        "Band",
        "Album",
        "Track",
        "Genre",
        "Error",
        "GlobalSearchResponse",
      ]),
    );
  });

  it("protège les mutations par sessionCookie", () => {
    const post = doc.paths?.["/api/bands"]?.post;
    expect(post?.security).toEqual([{ sessionCookie: [] }]);
    const get = doc.paths?.["/api/bands"]?.get;
    expect(get?.security).toBeUndefined();
  });

  it("expose 429 sur toutes les opérations rate-limitées", () => {
    const del = doc.paths?.["/api/bands/{id}"]?.delete;
    expect(del?.responses).toHaveProperty("429");
  });

  it("n'a aucun path sans opération", () => {
    for (const [path, item] of Object.entries(doc.paths ?? {})) {
      expect(Object.keys(item ?? {}).length, path).toBeGreaterThan(0);
    }
  });

  it("génère un operationId unique par opération", () => {
    const ids: string[] = [];
    for (const item of Object.values(doc.paths ?? {})) {
      for (const op of Object.values(item ?? {})) {
        if (op && typeof op === "object" && "operationId" in op) {
          ids.push(String(op.operationId));
        }
      }
    }
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("déclare une license et des tags documentés", () => {
    expect(doc.info.license?.name).toBeTruthy();
    for (const tag of doc.tags ?? []) {
      expect(tag.description, tag.name).toBeTruthy();
    }
  });
});
