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

  // La ressource `user` n'est déclarée que pour admin : pour tous les autres
  // rôles la recherche dans la matrice retourne undefined, et le repli doit
  // refuser (jamais autoriser par absence de règle).
  it("refuse une ressource absente de la matrice du rôle", () => {
    expect(can("user", "user", "read")).toBe(false);
    expect(can("contributor", "user", "read")).toBe(false);
    expect(can("moderator", "user", "moderate")).toBe(false);
  });

  it("réserve la gestion des utilisateurs à l'admin", () => {
    expect(can("admin", "user", "read")).toBe(true);
    expect(can("admin", "user", "delete")).toBe(true);
    // Même l'admin ne peut pas créer un utilisateur via la matrice :
    // l'inscription passe exclusivement par Better Auth.
    expect(can("admin", "user", "create")).toBe(false);
  });

  it("réserve le rejet terminal d'une contribution à l'admin", () => {
    expect(can("moderator", "contribution", "moderate")).toBe(true);
    expect(can("moderator", "contribution", "delete")).toBe(false);
    expect(can("admin", "contribution", "delete")).toBe(true);
  });
});
