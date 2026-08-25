/**
 * Tests de la matrice de permissions RBAC (lib/rbac/permissions.ts).
 * Vérifie la progression des droits entre rôles : user en lecture seule,
 * contributor sans suppression, moderator avec suppression, admin complet.
 */

// API Vitest : suites, tests et assertions
import { describe, it, expect } from "vitest";
// Fonction de contrôle sous test
import { can } from "./permissions";

// Suite principale : invariants de la matrice par rôle
describe("RBAC permissions matrix", () => {
  it("user ne peut pas supprimer une band", () => {
    expect(can("user", "band", "delete")).toBe(false);
  });

  it("contributor peut créer une band mais pas la supprimer", () => {
    expect(can("contributor", "band", "create")).toBe(true);
    expect(can("contributor", "band", "delete")).toBe(false);
  });

  it("moderator peut supprimer une band", () => {
    expect(can("moderator", "band", "delete")).toBe(true);
  });

  it("admin peut tout faire", () => {
    expect(can("admin", "band", "delete")).toBe(true);
    expect(can("admin", "genre", "create")).toBe(true);
  });
});
