/**
 * Tests unitaires des routes /api/contributions et /api/contributions/[id].
 * Vérifie : RBAC de soumission et de relecture, exigence des preuves,
 * verrou par l'auteur sur l'ajout d'evidence, rejet terminal admin-only.
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

// Espions mutations/lectures + staging MinIO.
const mocks = vi.hoisted(() => ({
  createContribution: vi.fn(),
  listForReview: vi.fn(),
  listByUser: vi.fn(),
  getContributionById: vi.fn(),
  requestEvidence: vi.fn(),
  addEvidence: vi.fn(),
  updateStatus: vi.fn(),
  promoteFiles: vi.fn(),
  presignUpload: vi.fn(),
}));

vi.mock("@/db/mutations/contributions", () => ({
  createContribution: mocks.createContribution,
  requestEvidence: mocks.requestEvidence,
  addEvidence: mocks.addEvidence,
  updateStatus: mocks.updateStatus,
  expireStaleContributions: vi.fn(),
}));
vi.mock("@/db/queries/contributions", () => ({
  getContributionById: mocks.getContributionById,
  listContributionsForReview: mocks.listForReview,
  listContributionsByUser: mocks.listByUser,
}));
vi.mock("@/lib/storage/contributions", () => ({
  presignContributionUpload: mocks.presignUpload,
  promoteContributionFiles: mocks.promoteFiles,
}));

// Imports dynamiques après les mocks.
const { POST, GET } = await import("./route");
const { PATCH } = await import("./[id]/route");
const { POST: postEvidence } = await import("./[id]/evidence/route");

const ID = "00000000-0000-4000-8000-000000000001";

/** Corps de soumission valide : 2 preuves dont une officielle. */
function validBody() {
  return {
    type: "band_create",
    payload: { name: "Nouveau Groupe", slug: "nouveau-groupe" },
    evidence: [
      { kind: "musicbrainz", url: "https://musicbrainz.org/artist/x" },
      { kind: "official-site", url: "https://groupe.example" },
    ],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  setUser(null);
});

describe("POST /api/contributions", () => {
  it("401 sans session", async () => {
    const res = await POST(
      mkReq("http://localhost/x", "POST", validBody()),
      ctx(),
    );
    expect(res.status).toBe(401);
    expect(mocks.createContribution).not.toHaveBeenCalled();
  });

  it("422 sans preuves suffisantes (barrière anti-IA)", async () => {
    setUser("contributor");
    const body = validBody();
    body.evidence = [body.evidence[0]]; // une seule preuve
    const res = await POST(mkReq("http://localhost/x", "POST", body), ctx());
    expect(res.status).toBe(422);
  });

  it("201 pour un contributor avec URLs de staging générées", async () => {
    setUser("contributor");
    mocks.createContribution.mockResolvedValue({ id: ID, status: "pending" });
    mocks.presignUpload.mockResolvedValue({
      uploadUrl: "http://minio/presigned",
      fileKey: `staging/contributions/${ID}/x.jpg`,
    });

    const res = await POST(
      mkReq("http://localhost/x", "POST", validBody()),
      ctx(),
    );
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.contribution.id).toBe(ID);
    expect(json.data.uploads.length).toBeGreaterThan(0);
    // Le dossier est rattaché à l'auteur de la session
    expect(mocks.createContribution.mock.calls[0][0].submittedBy).toBeDefined();
  });
});

describe("GET /api/contributions", () => {
  it("scope=review interdit aux non-modérateurs", async () => {
    setUser("contributor");
    const res = await GET(mkReq("http://localhost/x?scope=review"), ctx());
    expect(res.status).toBe(403);
  });

  it("scope=review autorisé pour un moderator", async () => {
    setUser("moderator");
    mocks.listForReview.mockResolvedValue([]);
    const res = await GET(
      mkReq("http://localhost/x?scope=review&status=pending"),
      ctx(),
    );
    expect(res.status).toBe(200);
    expect(mocks.listForReview).toHaveBeenCalledWith("pending");
  });

  it("scope=mine liste les contributions de l'appelant", async () => {
    setUser("user");
    mocks.listByUser.mockResolvedValue([]);
    await GET(mkReq("http://localhost/x"), ctx());
    expect(mocks.listByUser).toHaveBeenCalled();
  });
});

describe("PATCH /api/contributions/[id]", () => {
  it("403 pour un contributor (action moderate requise)", async () => {
    setUser("contributor");
    const res = await PATCH(
      mkReq("http://localhost/x", "PATCH", { status: "approved" }),
      ctx({ id: ID }),
    );
    expect(res.status).toBe(403);
  });

  it("demande de preuves pour un moderator", async () => {
    setUser("moderator");
    mocks.getContributionById.mockResolvedValue({ id: ID });
    mocks.requestEvidence.mockResolvedValue({
      id: ID,
      status: "evidence_requested",
    });
    const res = await PATCH(
      mkReq("http://localhost/x", "PATCH", {
        status: "evidence_requested",
        reviewNotes: "Merci d'ajouter un lien label",
      }),
      ctx({ id: ID }),
    );
    expect(res.status).toBe(200);
    expect(mocks.requestEvidence).toHaveBeenCalledWith(
      ID,
      expect.anything(),
      expect.stringContaining("label"),
    );
  });

  it("rejet terminal refusé à un moderator", async () => {
    setUser("moderator");
    mocks.getContributionById.mockResolvedValue({ id: ID });
    const res = await PATCH(
      mkReq("http://localhost/x", "PATCH", { status: "rejected" }),
      ctx({ id: ID }),
    );
    expect(res.status).toBe(403);
  });

  it("rejet terminal accepté pour un admin + promotion média à l'approbation", async () => {
    setUser("admin");
    mocks.getContributionById.mockResolvedValue({
      id: ID,
      type: "band_create",
      payload: { targetBandId: "b1" },
    });
    mocks.updateStatus.mockResolvedValue({ id: ID, status: "rejected" });
    mocks.promoteFiles.mockResolvedValue({ promotedKeys: [] });

    const res = await PATCH(
      mkReq("http://localhost/x", "PATCH", { status: "rejected" }),
      ctx({ id: ID }),
    );
    expect(res.status).toBe(200);

    // Approbation déclenche la promotion MinIO
    const approve = await PATCH(
      mkReq("http://localhost/x", "PATCH", { status: "approved" }),
      ctx({ id: ID }),
    );
    expect(approve.status).toBe(200);
    expect(mocks.promoteFiles).toHaveBeenCalledWith(ID, "b1");
  });
});

describe("POST /api/contributions/[id]/evidence", () => {
  it("403 si l'appelant n'est pas l'auteur du dossier", async () => {
    setUser("contributor");
    mocks.getContributionById.mockResolvedValue({
      id: ID,
      submittedBy: "quelquun-dautre",
    });
    const res = await postEvidence(
      mkReq("http://localhost/x", "POST", {
        evidence: [{ kind: "press", url: "https://presse.example/a" }],
      }),
      ctx({ id: ID }),
    );
    expect(res.status).toBe(403);
    expect(mocks.addEvidence).not.toHaveBeenCalled();
  });

  it("l'auteur ajoute une preuve -> retour au statut pending", async () => {
    setUser("contributor");
    mocks.getContributionById.mockResolvedValue({ id: ID, submittedBy: "u1" });
    mockSession.current = {
      user: { id: "u1", role: "contributor", email: "c@t" },
      session: {},
    };
    mocks.addEvidence.mockResolvedValue({ id: ID, status: "pending" });

    const res = await postEvidence(
      mkReq("http://localhost/x", "POST", {
        evidence: [{ kind: "press", url: "https://presse.example/a" }],
      }),
      ctx({ id: ID }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).data.status).toBe("pending");
  });
});
