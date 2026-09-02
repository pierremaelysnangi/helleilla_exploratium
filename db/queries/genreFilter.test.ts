/**
 * Tests du filtre par genre (db/queries/genreFilter.ts).
 *
 * Le point sensible est `restrictTo` : Drizzle IGNORE `inArray(col, [])`,
 * si bien qu'un filtre sans correspondance laisserait passer tout le
 * catalogue au lieu de ne rien renvoyer.
 */

import { describe, it, expect } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
import { restrictTo } from "./genreFilter";
import { bands } from "@/db/schema";

/** Compile une clause en SQL réel : c'est ce que verra PostgreSQL. */
const dialect = new PgDialect();
const compile = (clause: Parameters<typeof dialect.sqlToQuery>[0]) =>
  dialect.sqlToQuery(clause);

describe("restrictTo", () => {
  it("produit une clause toujours fausse pour une liste vide", () => {
    const { sql, params } = compile(restrictTo(bands.id, []));

    expect(sql.trim()).toBe("false");
    expect(params).toEqual([]);
  });

  it("restreint aux identifiants fournis", () => {
    const id = "00000000-0000-4000-8000-000000000001";
    const { sql, params } = compile(restrictTo(bands.id, [id]));

    expect(sql).toContain("in");
    expect(params).toEqual([id]);
  });
});
