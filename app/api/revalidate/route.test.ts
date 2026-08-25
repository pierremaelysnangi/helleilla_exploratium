/**
 * Tests unitaires de POST /api/revalidate.
 * Secret partagé (header x-revalidate-secret) : vérifie la désactivation
 * sans config, le refus de mauvais secret, et les purges path/tag
 * (next/cache mocké).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { ctx } from "@/lib/api/__tests__/route-helpers";

// Secret piloté par ce conteneur hoisté.
const envMock = vi.hoisted(() => ({
  REVALIDATE_SECRET: undefined as string | undefined,
}));
vi.mock("@/lib/env", () => ({ env: envMock }));

// Espion sur revalidateTag (revalidatePath vient du mock global next/cache).
const revalidateTagSpy = vi.hoisted(() => vi.fn());
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: revalidateTagSpy,
}));

// Import dynamique après les mocks.
const { POST } = await import("./route");

/** Fabrique une requête avec (ou sans) le header secret. */
function req(body: unknown, withSecret = true) {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (withSecret && envMock.REVALIDATE_SECRET) {
    headers["x-revalidate-secret"] = envMock.REVALIDATE_SECRET;
  }
  return new NextRequest("http://localhost/api/revalidate", {
    method: "POST",
    body: JSON.stringify(body),
    headers,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/revalidate", () => {
  it("503 si REVALIDATE_SECRET non configuré", async () => {
    envMock.REVALIDATE_SECRET = undefined;
    const res = await POST(req({ path: "/bands/x" }), ctx());
    expect(res.status).toBe(503);
  });

  it("401 avec un mauvais secret", async () => {
    envMock.REVALIDATE_SECRET = "secret-valide-16-chars";
    const res = await POST(req({ path: "/bands/x" }, false), ctx());
    expect(res.status).toBe(401);
  });

  it("purge un chemin fourni", async () => {
    envMock.REVALIDATE_SECRET = "secret-valide-16-chars";
    const res = await POST(req({ path: "/bands/necrofrost" }), ctx());
    expect(res.status).toBe(200);
    expect((await res.json()).data.invalidated).toEqual([
      "path:/bands/necrofrost",
    ]);
  });

  it("purge un tag via revalidateTag avec profil requis (Next 16)", async () => {
    envMock.REVALIDATE_SECRET = "secret-valide-16-chars";
    const res = await POST(req({ tag: "bands" }), ctx());
    expect(res.status).toBe(200);
    expect(revalidateTagSpy).toHaveBeenCalledWith("bands", "max");
  });

  it("422 si ni path ni tag", async () => {
    envMock.REVALIDATE_SECRET = "secret-valide-16-chars";
    const res = await POST(req({}), ctx());
    expect(res.status).toBe(422);
  });
});
