/**
 * Tests de la conversion erreurs PostgreSQL -> ApiError (lib/api/db-errors.ts).
 * Vérifie le déballage des SQLSTATE (direct ou via `cause` Drizzle),
 * la sémantique HTTP choisie et le rejet des erreurs non-SQL.
 */
import { describe, it, expect } from "vitest";
import { pgErrorToApiError } from "./db-errors";
import { ApiError } from "./response";

describe("pgErrorToApiError", () => {
  it("convertit une violation d'unicité en CONFLICT (409)", () => {
    const err = { code: "23505", detail: "Key (slug)=(x) already exists." };
    const apiErr = pgErrorToApiError(err);
    expect(apiErr).toBeInstanceOf(ApiError);
    expect(apiErr?.code).toBe("CONFLICT");
  });

  it("lit le SQLSTATE dans cause (erreurs enveloppées par Drizzle)", () => {
    const err = new Error("Failed query", {
      cause: { code: "23503", constraint: "tracks_album_id_albums_id_fk" },
    });
    const apiErr = pgErrorToApiError(err);
    expect(apiErr?.code).toBe("VALIDATION");
    expect(apiErr?.message).toMatch(/inexistante/i);
    expect(apiErr?.details).toEqual({ sqlState: "23503" });
  });

  it("mappe les autres contraintes vers VALIDATION (422)", () => {
    for (const sqlState of ["23514", "23502", "22P02"]) {
      expect(pgErrorToApiError({ code: sqlState })?.code).toBe("VALIDATION");
    }
  });

  it("retourne null pour un SQLSTATE inconnu ou une erreur non-SQL", () => {
    expect(pgErrorToApiError(new Error("boom"))).toBeNull();
    expect(pgErrorToApiError({ code: "XX999" })).toBeNull();
    expect(pgErrorToApiError(null)).toBeNull();
    expect(pgErrorToApiError(undefined)).toBeNull();
  });
});
