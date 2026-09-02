/**
 * Tests de l'approbation d'une contribution.
 *
 * C'est l'étape qui transforme un dossier en données réelles : sans elle
 * le workflow ne produisait rien. Les invariants vérifiés ici sont donc
 * ceux du produit, pas seulement du code — création du groupe, matérialisation
 * des références officielles, promotion des médias, et surtout la
 * REJOUABILITÉ après un échec de stockage.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Espions sur toutes les dépendances externes
const mocks = vi.hoisted(() => ({
  getBandBySlug: vi.fn(),
  createBand: vi.fn(),
  updateBand: vi.fn(),
  setExternalRefs: vi.fn(),
  updateStatus: vi.fn(),
  promoteContributionFiles: vi.fn(),
  enqueueBandIndex: vi.fn(),
  enqueueEmbeddings: vi.fn(),
}));

vi.mock("@/db/queries/bands", () => ({ getBandBySlug: mocks.getBandBySlug }));
vi.mock("@/db/mutations/bands", () => ({
  createBand: mocks.createBand,
  updateBand: mocks.updateBand,
}));
vi.mock("@/db/mutations/externalRefs", () => ({
  setExternalRefs: mocks.setExternalRefs,
}));
vi.mock("@/db/mutations/contributions", () => ({
  updateStatus: mocks.updateStatus,
}));
vi.mock("@/lib/storage/contributions", () => ({
  promoteContributionFiles: mocks.promoteContributionFiles,
}));
vi.mock("@/lib/queue/jobs/index-band", () => ({
  enqueueBandIndex: mocks.enqueueBandIndex,
}));
vi.mock("@/lib/queue/jobs/generate-embeddings", () => ({
  enqueueEmbeddings: mocks.enqueueEmbeddings,
  buildBandEmbeddingText: (band: { name: string }) => band.name,
}));

import { approveContribution } from "./approve";
import { ApiError } from "@/lib/api/response";

const BAND_ID = "00000000-0000-4000-8000-0000000000b1";
const REVIEWER = "moderator-1";

/** Fabrique un dossier de contribution, surchargeable. */
function contribution(overrides: Record<string, unknown> = {}) {
  return {
    id: "00000000-0000-4000-8000-0000000000c1",
    type: "band_create",
    status: "pending",
    payload: {
      name: "Necrofrost",
      slug: "necrofrost",
      bio: "Groupe norvégien",
      countryCode: "NO",
      formedYear: 1991,
      dissolvedYear: null,
      refs: [{ provider: "musicbrainz", externalId: "mbid-1" }],
      targetBandId: null,
    },
    evidence: [],
    submittedBy: "contributor-1",
    ...overrides,
  } as never;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getBandBySlug.mockResolvedValue(null);
  mocks.createBand.mockResolvedValue({ id: BAND_ID });
  mocks.updateBand.mockResolvedValue({ id: BAND_ID });
  mocks.promoteContributionFiles.mockResolvedValue({ promotedKeys: [] });
  mocks.updateStatus.mockImplementation(async (id: string, status: string) => ({
    id,
    status,
  }));
});

describe("approveContribution — band_create", () => {
  it("crée le groupe à partir du payload", async () => {
    const { bandId } = await approveContribution(contribution(), REVIEWER);

    expect(bandId).toBe(BAND_ID);
    expect(mocks.createBand).toHaveBeenCalledWith({
      name: "Necrofrost",
      slug: "necrofrost",
      bio: "Groupe norvégien",
      countryCode: "NO",
      formedYear: 1991,
      dissolvedYear: null,
    });
  });

  it("matérialise les références officielles du payload", async () => {
    await approveContribution(contribution(), REVIEWER);

    // Ces références SONT la preuve exigée à la soumission : les valider
    // sans jamais les écrire viderait la barrière anti-contenu-IA de son sens.
    expect(mocks.setExternalRefs).toHaveBeenCalledWith("band", BAND_ID, [
      { provider: "musicbrainz", externalId: "mbid-1" },
    ]);
  });

  it("n'écrit aucune référence quand le payload n'en porte pas", async () => {
    const sansRefs = contribution({
      payload: { name: "X", slug: "x", targetBandId: null },
    });

    await approveContribution(sansRefs, REVIEWER);

    expect(mocks.setExternalRefs).not.toHaveBeenCalled();
  });

  it("promeut les médias vers l'espace public du groupe créé", async () => {
    await approveContribution(contribution(), REVIEWER);

    expect(mocks.promoteContributionFiles).toHaveBeenCalledWith(
      "00000000-0000-4000-8000-0000000000c1",
      BAND_ID,
    );
  });

  it("rattache la première image promue au groupe", async () => {
    mocks.promoteContributionFiles.mockResolvedValueOnce({
      promotedKeys: [
        `bands/${BAND_ID}/extrait.mp3`,
        `bands/${BAND_ID}/logo.webp`,
      ],
    });

    await approveContribution(contribution(), REVIEWER);

    // Sans cette étape les fichiers étaient déplacés puis jamais référencés
    expect(mocks.updateBand).toHaveBeenCalledWith(BAND_ID, {
      imageUrl: `bands/${BAND_ID}/logo.webp`,
    });
  });

  it("ne touche pas au visuel quand aucune image n'a été promue", async () => {
    mocks.promoteContributionFiles.mockResolvedValueOnce({
      promotedKeys: [`bands/${BAND_ID}/extrait.mp3`],
    });

    await approveContribution(contribution(), REVIEWER);

    expect(mocks.updateBand).not.toHaveBeenCalled();
  });

  it("réindexe le groupe puis clôt le dossier", async () => {
    await approveContribution(contribution(), REVIEWER);

    expect(mocks.enqueueBandIndex).toHaveBeenCalledWith(BAND_ID, "index");
    expect(mocks.enqueueEmbeddings).toHaveBeenCalledWith(BAND_ID, "Necrofrost");
    expect(mocks.updateStatus).toHaveBeenCalledWith(
      "00000000-0000-4000-8000-0000000000c1",
      "approved",
      REVIEWER,
    );
  });
});

describe("approveContribution — rejouabilité", () => {
  it("laisse le dossier non approuvé si la promotion échoue", async () => {
    mocks.promoteContributionFiles.mockRejectedValueOnce(
      new Error("MinIO indisponible"),
    );
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      approveContribution(contribution(), REVIEWER),
    ).rejects.toBeInstanceOf(ApiError);

    // Le statut ne bascule pas : le modérateur peut réessayer
    expect(mocks.updateStatus).not.toHaveBeenCalled();
  });

  it("réutilise le groupe déjà créé lors d'une tentative précédente", async () => {
    // Deuxième passage après un échec MinIO : le groupe existe déjà.
    // Sans ce repli, l'approbation buterait sur l'unicité du slug et le
    // dossier resterait bloqué à jamais.
    mocks.getBandBySlug.mockResolvedValueOnce({ id: BAND_ID });

    const { bandId } = await approveContribution(contribution(), REVIEWER);

    expect(bandId).toBe(BAND_ID);
    expect(mocks.createBand).not.toHaveBeenCalled();
    expect(mocks.updateStatus).toHaveBeenCalledWith(
      expect.any(String),
      "approved",
      REVIEWER,
    );
  });
});

describe("approveContribution — band_update", () => {
  const updateDossier = () =>
    contribution({
      type: "band_update",
      payload: {
        name: "Necrofrost",
        slug: "necrofrost",
        bio: "Bio enrichie",
        targetBandId: BAND_ID,
      },
    });

  it("enrichit le groupe cible sans en créer un nouveau", async () => {
    const { bandId } = await approveContribution(updateDossier(), REVIEWER);

    expect(bandId).toBe(BAND_ID);
    expect(mocks.createBand).not.toHaveBeenCalled();
    expect(mocks.updateBand).toHaveBeenCalledWith(
      BAND_ID,
      expect.objectContaining({ bio: "Bio enrichie" }),
    );
  });

  it("promeut aussi les médias d'une contribution d'enrichissement", async () => {
    // L'ancienne garde excluait ce cas : la promotion n'était atteignable
    // que si `targetBandId` ET type band_create, combinaison impossible.
    await approveContribution(updateDossier(), REVIEWER);

    expect(mocks.promoteContributionFiles).toHaveBeenCalledWith(
      expect.any(String),
      BAND_ID,
    );
  });

  it("refuse un dossier band_update sans groupe cible", async () => {
    const incoherent = contribution({
      type: "band_update",
      payload: { name: "X", slug: "x", targetBandId: null },
    });

    await expect(
      approveContribution(incoherent, REVIEWER),
    ).rejects.toBeInstanceOf(ApiError);
    expect(mocks.updateStatus).not.toHaveBeenCalled();
  });

  it("signale un groupe cible disparu entre-temps", async () => {
    mocks.updateBand.mockResolvedValueOnce(undefined);

    await expect(
      approveContribution(updateDossier(), REVIEWER),
    ).rejects.toBeInstanceOf(ApiError);
  });
});
