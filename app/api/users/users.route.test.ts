/**
 * Tests des routes d'administration des comptes.
 *
 * L'enjeu n'est pas le CRUD mais les deux garde-fous : ces routes portent
 * sur le mécanisme de contrôle d'accès lui-même, et une erreur y est
 * irrattrapable depuis l'interface — il faudrait repasser par
 * `pnpm seed:admin` pour reprendre la main.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  mockSession,
  setUser,
  mkReq,
  ctx,
} from "@/lib/api/__tests__/route-helpers";

vi.mock("@/lib/redis", () => ({
  redis: { incr: vi.fn(async () => 1), expire: vi.fn(async () => 1) },
}));
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: vi.fn(async () => mockSession.current) } },
}));

const mocks = vi.hoisted(() => ({
  listUsers: vi.fn(),
  getUserById: vi.fn(),
  countAdmins: vi.fn(),
  updateUserAsAdmin: vi.fn(),
  deleteUserAsAdmin: vi.fn(),
}));

vi.mock("@/db/queries/users", () => ({
  listUsers: mocks.listUsers,
  getUserById: mocks.getUserById,
  countAdmins: mocks.countAdmins,
}));
vi.mock("@/db/mutations/users", () => ({
  updateUserAsAdmin: mocks.updateUserAsAdmin,
  deleteUserAsAdmin: mocks.deleteUserAsAdmin,
}));

const { GET: LIST } = await import("./route");
const { GET, PATCH, DELETE } = await import("./[id]/route");

/** Identifiant de l'admin connecté dans les tests (cf. setUser). */
const SELF = "u1";
const OTHER = "u2";

/** Fabrique un compte cible. */
function target(overrides: Record<string, unknown> = {}) {
  return {
    id: OTHER,
    name: "Nyx",
    email: "nyx@exemple.test",
    role: "user",
    banned: false,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  setUser(null);
  mocks.countAdmins.mockResolvedValue(3);
  mocks.updateUserAsAdmin.mockImplementation(async (id: string) => ({ id }));
  mocks.deleteUserAsAdmin.mockResolvedValue(true);
});

describe("GET /api/users — RBAC", () => {
  it("401 sans session", async () => {
    const res = await LIST(mkReq("http://localhost/api/users"), ctx());
    expect(res.status).toBe(401);
    expect(mocks.listUsers).not.toHaveBeenCalled();
  });

  it.each(["user", "contributor", "moderator"])(
    "403 pour un %s : les emails ne sortent que pour un admin",
    async (role) => {
      setUser(role);
      const res = await LIST(mkReq("http://localhost/api/users"), ctx());
      expect(res.status).toBe(403);
      expect(mocks.listUsers).not.toHaveBeenCalled();
    },
  );

  it("200 pour un admin, avec pagination et filtres", async () => {
    setUser("admin");
    mocks.listUsers.mockResolvedValue({ items: [target()], total: 1 });

    const res = await LIST(
      mkReq("http://localhost/api/users?page=2&perPage=10&q=nyx&role=user"),
      ctx(),
    );

    expect(res.status).toBe(200);
    expect(mocks.listUsers).toHaveBeenCalledWith({
      page: 2,
      perPage: 10,
      q: "nyx",
      role: "user",
    });
    const json = await res.json();
    expect(json.meta.total).toBe(1);
  });

  it("422 pour un rôle de filtre inconnu", async () => {
    setUser("admin");
    const res = await LIST(
      mkReq("http://localhost/api/users?role=superadmin"),
      ctx(),
    );
    expect(res.status).toBe(422);
  });
});

describe("PATCH /api/users/[id] — auto-protection", () => {
  it("refuse à un admin de se rétrograder lui-même", async () => {
    setUser("admin", SELF);
    mocks.getUserById.mockResolvedValue(target({ id: SELF, role: "admin" }));

    const res = await PATCH(
      mkReq("http://localhost/x", "PATCH", { role: "user" }),
      ctx({ id: SELF }),
    );

    expect(res.status).toBe(403);
    expect(mocks.updateUserAsAdmin).not.toHaveBeenCalled();
  });

  it("refuse à un admin de se bannir lui-même", async () => {
    setUser("admin", SELF);
    mocks.getUserById.mockResolvedValue(target({ id: SELF, role: "admin" }));

    const res = await PATCH(
      mkReq("http://localhost/x", "PATCH", { banned: true }),
      ctx({ id: SELF }),
    );

    expect(res.status).toBe(403);
  });

  it("laisse un admin modifier son propre profil sans perte de droits", async () => {
    setUser("admin", SELF);
    mocks.getUserById.mockResolvedValue(target({ id: SELF, role: "admin" }));

    const res = await PATCH(
      mkReq("http://localhost/x", "PATCH", { role: "admin" }),
      ctx({ id: SELF }),
    );

    expect(res.status).toBe(200);
  });
});

describe("PATCH /api/users/[id] — dernier administrateur", () => {
  it("refuse de rétrograder le dernier admin", async () => {
    setUser("admin", SELF);
    mocks.getUserById.mockResolvedValue(target({ role: "admin" }));
    mocks.countAdmins.mockResolvedValue(1);

    const res = await PATCH(
      mkReq("http://localhost/x", "PATCH", { role: "moderator" }),
      ctx({ id: OTHER }),
    );

    // 409 et non 403 : ce n'est pas un défaut de droit mais un conflit
    // avec l'état du système.
    expect(res.status).toBe(409);
    expect(mocks.updateUserAsAdmin).not.toHaveBeenCalled();
  });

  it("refuse de bannir le dernier admin", async () => {
    setUser("admin", SELF);
    mocks.getUserById.mockResolvedValue(target({ role: "admin" }));
    mocks.countAdmins.mockResolvedValue(1);

    const res = await PATCH(
      mkReq("http://localhost/x", "PATCH", { banned: true }),
      ctx({ id: OTHER }),
    );
    expect(res.status).toBe(409);
  });

  it("autorise la rétrogradation quand un autre admin subsiste", async () => {
    setUser("admin", SELF);
    mocks.getUserById.mockResolvedValue(target({ role: "admin" }));
    mocks.countAdmins.mockResolvedValue(2);

    const res = await PATCH(
      mkReq("http://localhost/x", "PATCH", { role: "moderator" }),
      ctx({ id: OTHER }),
    );

    expect(res.status).toBe(200);
    expect(mocks.updateUserAsAdmin).toHaveBeenCalledWith(OTHER, {
      role: "moderator",
    });
  });

  it("ne consulte pas le compteur pour une promotion", async () => {
    setUser("admin", SELF);
    mocks.getUserById.mockResolvedValue(target({ role: "user" }));

    await PATCH(
      mkReq("http://localhost/x", "PATCH", { role: "contributor" }),
      ctx({ id: OTHER }),
    );

    expect(mocks.countAdmins).not.toHaveBeenCalled();
  });
});

describe("PATCH /api/users/[id] — contrat", () => {
  it("403 pour un moderator", async () => {
    setUser("moderator");
    const res = await PATCH(
      mkReq("http://localhost/x", "PATCH", { role: "admin" }),
      ctx({ id: OTHER }),
    );
    expect(res.status).toBe(403);
  });

  it("404 si le compte n'existe pas", async () => {
    setUser("admin", SELF);
    mocks.getUserById.mockResolvedValue(null);

    const res = await PATCH(
      mkReq("http://localhost/x", "PATCH", { role: "user" }),
      ctx({ id: "inconnu" }),
    );
    expect(res.status).toBe(404);
  });

  it("422 pour un corps vide : un PATCH sans effet ne doit pas passer", async () => {
    setUser("admin", SELF);
    const res = await PATCH(
      mkReq("http://localhost/x", "PATCH", {}),
      ctx({ id: OTHER }),
    );
    expect(res.status).toBe(422);
  });

  it("422 pour un rôle hors nomenclature", async () => {
    setUser("admin", SELF);
    const res = await PATCH(
      mkReq("http://localhost/x", "PATCH", { role: "superadmin" }),
      ctx({ id: OTHER }),
    );
    expect(res.status).toBe(422);
  });
});

describe("DELETE /api/users/[id]", () => {
  it("refuse à un admin de supprimer son propre compte", async () => {
    setUser("admin", SELF);
    mocks.getUserById.mockResolvedValue(target({ id: SELF, role: "admin" }));

    const res = await DELETE(
      mkReq("http://localhost/x", "DELETE"),
      ctx({ id: SELF }),
    );

    expect(res.status).toBe(403);
    expect(mocks.deleteUserAsAdmin).not.toHaveBeenCalled();
  });

  it("refuse de supprimer le dernier admin", async () => {
    setUser("admin", SELF);
    mocks.getUserById.mockResolvedValue(target({ role: "admin" }));
    mocks.countAdmins.mockResolvedValue(1);

    const res = await DELETE(
      mkReq("http://localhost/x", "DELETE"),
      ctx({ id: OTHER }),
    );
    expect(res.status).toBe(409);
  });

  it("supprime un compte ordinaire", async () => {
    setUser("admin", SELF);
    mocks.getUserById.mockResolvedValue(target());

    const res = await DELETE(
      mkReq("http://localhost/x", "DELETE"),
      ctx({ id: OTHER }),
    );

    expect(res.status).toBe(200);
    expect(mocks.deleteUserAsAdmin).toHaveBeenCalledWith(OTHER);
  });

  it("403 pour un moderator", async () => {
    setUser("moderator");
    const res = await DELETE(
      mkReq("http://localhost/x", "DELETE"),
      ctx({ id: OTHER }),
    );
    expect(res.status).toBe(403);
  });
});

describe("GET /api/users/[id]", () => {
  it("200 avec le compte demandé", async () => {
    setUser("admin", SELF);
    mocks.getUserById.mockResolvedValue(target());

    const res = await GET(mkReq("http://localhost/x"), ctx({ id: OTHER }));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.email).toBe("nyx@exemple.test");
  });

  it("404 si le compte n'existe pas", async () => {
    setUser("admin", SELF);
    mocks.getUserById.mockResolvedValue(null);
    const res = await GET(mkReq("http://localhost/x"), ctx({ id: "inconnu" }));
    expect(res.status).toBe(404);
  });
});
