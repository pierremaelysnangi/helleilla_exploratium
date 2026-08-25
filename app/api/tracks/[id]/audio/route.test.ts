/**
 * Tests unitaires de POST /api/tracks/[id]/audio (presign d'upload audio).
 * Vérifie 401/403/404, le rejet des types MIME non audio (422),
 * l'enregistrement d'audioUrl et le retour { uploadUrl, audioUrl }.
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

// Espions : presigning MinIO + persistance piste.
const mocks = vi.hoisted(() => ({
  presign: vi.fn(),
  getTrackById: vi.fn(),
  updateTrack: vi.fn(),
}));
vi.mock("@/lib/storage/minio", () => ({
  presignTrackAudioUpload: mocks.presign,
  isAllowedAudioType: (t: string) =>
    ["audio/mpeg", "audio/ogg", "audio/flac"].includes(t),
}));
vi.mock("@/db/queries/tracks", () => ({ getTrackById: mocks.getTrackById }));
vi.mock("@/db/mutations/tracks", () => ({ updateTrack: mocks.updateTrack }));

// Import dynamique après les mocks.
const { POST } = await import("./route");

const ID = "00000000-0000-4000-8000-000000000001";

beforeEach(() => {
  vi.clearAllMocks();
  setUser(null);
});

describe("POST /api/tracks/[id]/audio", () => {
  it("401 sans session", async () => {
    const res = await POST(
      mkReq("http://localhost/x", "POST", { contentType: "audio/mpeg" }),
      ctx({ id: ID }),
    );
    expect(res.status).toBe(401);
    expect(mocks.presign).not.toHaveBeenCalled();
  });

  it("403 pour un simple user", async () => {
    setUser("user");
    const res = await POST(
      mkReq("http://localhost/x", "POST", { contentType: "audio/mpeg" }),
      ctx({ id: ID }),
    );
    expect(res.status).toBe(403);
  });

  it("404 si la piste n'existe pas", async () => {
    setUser("contributor");
    mocks.getTrackById.mockResolvedValue(null);
    const res = await POST(
      mkReq("http://localhost/x", "POST", { contentType: "audio/mpeg" }),
      ctx({ id: ID }),
    );
    expect(res.status).toBe(404);
  });

  it("422 pour un type MIME non audio", async () => {
    setUser("contributor");
    mocks.getTrackById.mockResolvedValue({ id: ID });
    const res = await POST(
      mkReq("http://localhost/x", "POST", { contentType: "application/pdf" }),
      ctx({ id: ID }),
    );
    expect(res.status).toBe(422);
    expect(mocks.presign).not.toHaveBeenCalled();
  });

  it("200 pour un contributor : presign + audioUrl enregistrée", async () => {
    setUser("contributor");
    mocks.getTrackById.mockResolvedValue({ id: ID });
    mocks.updateTrack.mockResolvedValue({ id: ID });
    mocks.presign.mockResolvedValue({
      uploadUrl: "http://minio/presigned-put",
      audioUrl: "http://minio/bucket/audio/tracks/x.mp3",
    });

    const res = await POST(
      mkReq("http://localhost/x", "POST", { contentType: "audio/mpeg" }),
      ctx({ id: ID }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.uploadUrl).toContain("presigned-put");
    // L'URL publique a été persistée sur la piste
    expect(mocks.updateTrack).toHaveBeenCalledWith(ID, {
      audioUrl: "http://minio/bucket/audio/tracks/x.mp3",
    });
  });
});
