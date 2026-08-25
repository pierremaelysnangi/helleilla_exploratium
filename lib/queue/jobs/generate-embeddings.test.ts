/**
 * Tests unitaires du job d'embeddings (lib/queue/jobs/generate-embeddings.ts).
 * fetch est stubé : vérifie la construction de l'appel Ollama, la
 * persistance du vecteur, le rejet d'une dimension inattendue (sans
 * retry) et l'échec propagé si le service est en panne.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";

// Env validée factice : le vrai module exige des variables absentes en tests.
vi.mock("@/lib/env", () => ({
  env: {
    EMBEDDINGS_BASE_URL: "http://localhost:11434",
    EMBEDDINGS_MODEL: "test-model",
  },
}));

// Le setup global mocke ce module (no-op pour les routes) : on restaure
// ici l'implémentation réelle pour tester le job lui-même.
const { enqueueEmbeddings, processEmbeddings, buildBandEmbeddingText } =
  await vi.importActual<typeof import("./generate-embeddings")>(
    "./generate-embeddings",
  );

// Espions : file BullMQ + persistance Drizzle.
const mocks = vi.hoisted(() => {
  const whereMock = vi.fn(async () => undefined);
  const setMock = vi.fn(() => ({ where: whereMock }));
  const updateMock = vi.fn(() => ({ set: setMock }));
  return { queueAdd: vi.fn(async () => undefined), updateMock, setMock };
});
vi.mock("@/lib/queue/client", () => ({
  embeddingsQueue: { add: mocks.queueAdd },
}));
vi.mock("@/db", () => ({ db: { update: mocks.updateMock } }));

// Réinitialisation de l'état des espions entre les tests.
beforeEach(() => {
  vi.clearAllMocks();
});
vi.mock("drizzle-orm", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  eq: vi.fn(() => "eq-condition"),
}));

/** Stub global de fetch renvoyant une réponse JSON. */
function stubFetch(status: number, payload: unknown) {
  const fetchMock = vi.fn(
    async (_input: RequestInfo | URL, _init?: RequestInit) =>
      new Response(JSON.stringify(payload), { status }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("enqueueEmbeddings", () => {
  it("ajoute un job avec 2 tentatives et échecs conservés", async () => {
    await enqueueEmbeddings("band-1", "texte");
    expect(mocks.queueAdd).toHaveBeenCalledWith(
      "generate-embeddings",
      { bandId: "band-1", text: "texte" },
      expect.objectContaining({ attempts: 2, removeOnFail: false }),
    );
  });
});

describe("buildBandEmbeddingText", () => {
  it("concatène name/countryCode/bio en ignorant les champs vides", () => {
    const text = buildBandEmbeddingText({
      name: "Emperor",
      bio: "Black metal norvégien",
      countryCode: null,
    });
    expect(text).toBe("Emperor\nBlack metal norvégien");
  });
});

describe("processEmbeddings", () => {
  const VECTOR = Array.from({ length: 1536 }, (_, i) => i / 1536);

  it("appelle /api/embed puis persiste un vecteur de bonne dimension", async () => {
    const fetchMock = stubFetch(200, { embeddings: [VECTOR] });
    // Chaînage Drizzle : update(...).set(...).where(...)
    await processEmbeddings({ bandId: "band-1", text: "Emperor" });

    // Requête envoyée au service d'embeddings
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/api/embed");
    const sentBody = JSON.parse(String(init?.body));
    expect(sentBody.model).toBe("test-model");
    expect(sentBody.input).toBe("Emperor");

    // Le vecteur a été transmis à l'UPDATE
    expect(mocks.setMock).toHaveBeenCalledWith(
      expect.objectContaining({ embedding: VECTOR }),
    );
  });

  it("n'écrit rien si la dimension du vecteur est inattendue", async () => {
    stubFetch(200, { embeddings: [[0.1, 0.2]] }); // 2 dims au lieu de 1536

    await processEmbeddings({ bandId: "band-1", text: "x" });

    // Pas d'UPDATE : le vecteur invalide n'écrase jamais l'existant
    expect(mocks.setMock).not.toHaveBeenCalled();
  });

  it("propage l'erreur si le service répond en erreur (-> retry BullMQ)", async () => {
    stubFetch(503, {});
    await expect(
      processEmbeddings({ bandId: "band-1", text: "x" }),
    ).rejects.toThrow(/HTTP 503/);
    expect(mocks.setMock).not.toHaveBeenCalled();
  });
});
