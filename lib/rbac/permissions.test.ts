import { describe, it, expect } from "vitest";
import { can } from "./permissions";

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
