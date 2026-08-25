/**
 * Tests unitaires de PUT /api/bands/[id]/genres (sync des genres d'un groupe).
 * Vérifie 401/403/404, l'appel transactionnel avec la liste fournie
 * (y compris liste vide = détachement total) et le 422 de validation.
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

// Espions sur lecture groupe + mutation transactionnelle.
const bandsMock = vi.hoisted(() => ({
  getBandById: vi.fn(),
  setBandGenres: vi.fn(),
}));
vi.mock("@/db/queries/bands", () => ({ getBandById: bandsMock.getBandById }));
vi.mock("@/db/mutations/bands", () => ({
  setBandGenres: bandsMock.setBandGenres,
}));

// Import dynamique après les mocks.
const { PUT } = await import("./route");

const ID = "00000000-0000-4000-8000-000000000001";
const G1 = "11111111-1111-4111-8111-000000000001";
const G2 = "22222222-2222-4222-8222-000000000002";

beforeEach(() => {
  vi.clearAllMocks();
  setUser(null);
});

describe("PUT /api/bands/[id]/genres", () => {
  it("401 sans session", async () => {
    const res = await PUT(
      mkReq(`http://localhost/x`, "PUT", { genreIds: [G1] }),
      ctx({ id: ID }),
    );
    expect(res.status).toBe(401);
    expect(bandsMock.setBandGenres).not.toHaveBeenCalled();
  });

  it("403 pour un simple user", async () => {
    setUser("user");
    const res = await PUT(
      mkReq(`http://localhost/x`, "PUT", { genreIds: [G1] }),
      ctx({ id: ID }),
    );
    expect(res.status).toBe(403);
  });

  it("404 si le groupe n'existe pas", async () => {
    setUser("contributor");
    bandsMock.getBandById.mockResolvedValue(null);
    const res = await PUT(
      mkReq(`http://localhost/x`, "PUT", { genreIds: [G1] }),
      ctx({ id: ID }),
    );
    expect(res.status).toBe(404);
  });

  it("200 pour un contributor : setBandGenres appelé avec la liste", async () => {
    setUser("contributor");
    bandsMock.getBandById.mockResolvedValue({ id: ID });
    const res = await PUT(
      mkReq(`http://localhost/x`, "PUT", { genreIds: [G1, G2] }),
      ctx({ id: ID }),
    );
    expect(res.status).toBe(200);
    expect(bandsMock.setBandGenres).toHaveBeenCalledWith(ID, [G1, G2]);
    expect((await res.json()).data.genreIds).toEqual([G1, G2]);
  });

  it("accepte une liste vide (détachement total)", async () => {
    setUser("moderator");
    bandsMock.getBandById.mockResolvedValue({ id: ID });
    const res = await PUT(
      mkReq(`http://localhost/x`, "PUT", { genreIds: [] }),
      ctx({ id: ID }),
    );
    expect(res.status).toBe(200);
    expect(bandsMock.setBandGenres).toHaveBeenCalledWith(ID, []);
  });

  it("422 si un genreId n'est pas un UUID", async () => {
    setUser("contributor");
    const res = await PUT(
      mkReq(`http://localhost/x`, "PUT", { genreIds: ["pas-un-uuid"] }),
      ctx({ id: ID }),
    );
    expect(res.status).toBe(422);
    expect(bandsMock.setBandGenres).not.toHaveBeenCalled();
  });
});
