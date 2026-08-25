/**
 * Tests unitaires de GET /api/bands/by-slug/[slug].
 * Lecture publique : 200 avec genres projetés, 404 si slug inconnu,
 * 422 si slug vide.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mkReq, ctx } from "@/lib/api/__tests__/route-helpers";

vi.mock("@/lib/redis", () => ({
  redis: { incr: vi.fn(async () => 1), expire: vi.fn(async () => 1) },
}));

// Espion sur la lecture relationnelle par slug.
const findFirst = vi.hoisted(() => vi.fn());
vi.mock("@/db", () => ({
  db: { query: { bands: { findFirst } } },
}));

// Import dynamique après les mocks.
const { GET } = await import("./route");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/bands/by-slug/[slug]", () => {
  it("200 avec genres projetés si le slug existe", async () => {
    findFirst.mockResolvedValue({
      id: "00000000-0000-4000-8000-000000000001",
      name: "Darkthrone",
      slug: "darkthrone",
      bandGenres: [
        { genre: { id: "g1", name: "Black Metal", slug: "black-metal" } },
      ],
    });

    const res = await GET(mkReq(), ctx({ slug: "darkthrone" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.slug).toBe("darkthrone");
    expect(json.data.genres).toEqual([
      { id: "g1", name: "Black Metal", slug: "black-metal" },
    ]);
    // La lecture relationnelle a bien été déclenchée une fois
    expect(findFirst).toHaveBeenCalledTimes(1);
  });

  it("404 si aucun groupe ne porte ce slug", async () => {
    findFirst.mockResolvedValue(undefined);
    const res = await GET(mkReq(), ctx({ slug: "inconnu" }));
    expect(res.status).toBe(404);
  });

  it("422 si le slug est vide", async () => {
    const res = await GET(mkReq(), ctx({ slug: "" }));
    expect(res.status).toBe(422);
    expect(findFirst).not.toHaveBeenCalled();
  });
});
