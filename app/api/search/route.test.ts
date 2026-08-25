/**
 * Tests unitaires de la route GET /api/search (recherche globale multi-index).
 * Meilisearch est mocké : on vérifie la validation des query params, le
 * groupement des hits par index, les valeurs par défaut et la conversion
 * d'une panne Meilisearch en 503.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
// Helpers partagés : fabrication de requêtes et contexte de route
import { mkReq, ctx } from "@/lib/api/__tests__/route-helpers";

// Mock espion du client Meilisearch (multiSearch piloté par ce conteneur).
const meiliMock = vi.hoisted(() => ({
  multiSearch: vi.fn(),
}));
vi.mock("@/lib/search/meilisearch", () => ({ meilisearch: meiliMock }));

// Import dynamique après les mocks afin que la route les utilise.
const { GET } = await import("./route");

// Réinitialisation du mock avant chaque test.
beforeEach(() => {
  vi.clearAllMocks();
});

/** Fabrique une réponse multiSearch standard : un jeu de hits par index. */
function mockMultiResults() {
  meiliMock.multiSearch.mockResolvedValue({
    results: [
      {
        hits: [
          {
            id: "7b5e4850-93fd-48f0-bb37-cd67219015a1",
            name: "Emperor",
            slug: "emperor",
            bio: null,
            countryCode: "NO",
            formedYear: 1991,
          },
        ],
      },
      { hits: [] },
      { hits: [] },
    ],
  });
}

describe("GET /api/search", () => {
  it("renvoie 200 avec les hits groupés par index", async () => {
    mockMultiResults();

    const res = await GET(
      mkReq("http://localhost/api/search?q=emperor"),
      ctx(),
    );
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data.bands).toHaveLength(1);
    expect(json.data.bands[0].name).toBe("Emperor");
    expect(json.data.albums).toEqual([]);
    expect(json.data.tracks).toEqual([]);
  });

  it("interroge les 3 index avec le même terme et la limite par défaut (5)", async () => {
    mockMultiResults();

    await GET(mkReq("http://localhost/api/search?q=frost"), ctx());

    expect(meiliMock.multiSearch).toHaveBeenCalledWith({
      queries: [
        { indexUid: "bands", q: "frost", limit: 5 },
        { indexUid: "albums", q: "frost", limit: 5 },
        { indexUid: "tracks", q: "frost", limit: 5 },
      ],
    });
  });

  it("respecte le paramètre limit fourni", async () => {
    mockMultiResults();

    await GET(mkReq("http://localhost/api/search?q=frost&limit=10"), ctx());

    const { queries } = meiliMock.multiSearch.mock.calls[0][0] as {
      queries: { indexUid: string; q: string; limit: number }[];
    };
    expect(queries.every((q) => q.limit === 10)).toBe(true);
  });

  it("422 si le terme q est absent", async () => {
    const res = await GET(mkReq("http://localhost/api/search"), ctx());
    expect(res.status).toBe(422);
    expect(meiliMock.multiSearch).not.toHaveBeenCalled();
  });

  it("422 si le terme q dépasse 200 caractères", async () => {
    const res = await GET(
      mkReq(`http://localhost/api/search?q=${"x".repeat(201)}`),
      ctx(),
    );
    expect(res.status).toBe(422);
    expect(meiliMock.multiSearch).not.toHaveBeenCalled();
  });

  it("422 si limit hors bornes (> 20)", async () => {
    const res = await GET(
      mkReq("http://localhost/api/search?q=frost&limit=50"),
      ctx(),
    );
    expect(res.status).toBe(422);
    expect(meiliMock.multiSearch).not.toHaveBeenCalled();
  });

  it("503 si Meilisearch est indisponible", async () => {
    meiliMock.multiSearch.mockRejectedValue(new Error("connection refused"));

    const res = await GET(mkReq("http://localhost/api/search?q=frost"), ctx());
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.error.code).toBe("UNAVAILABLE");
  });

  it("500 si un document indexé viole le schéma de sortie", async () => {
    // Hit malformé : `name` manquant sur un band
    meiliMock.multiSearch.mockResolvedValue({
      results: [{ hits: [{ id: "pas-un-uuid" }] }, { hits: [] }, { hits: [] }],
    });

    const res = await GET(mkReq("http://localhost/api/search?q=frost"), ctx());
    expect(res.status).toBe(500);
  });
});
