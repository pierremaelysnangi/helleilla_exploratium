/**
 * Tests unitaires des mutations de contributions.
 * La DB est simulée avec un builder Drizzle factice : on vérifie les
 * vraies fonctions — demande de preuves, fusion d'evidence, statuts,
 * et la politique d'expiration appliquée par expireStaleContributions.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// État en mémoire piloté par le builder factice.
const state = vi.hoisted(() => ({
  selected: [] as Record<string, unknown>[],
  updates: [] as Record<string, unknown>[],
}));

vi.mock("@/db", () => ({
  db: {
    // select().from().where()[.orderBy().limit()] -> `state.selected`
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() =>
          Object.assign(Promise.resolve(state.selected), {
            limit: vi.fn(async () => state.selected),
          }),
        ),
        orderBy: vi.fn(() => ({ limit: vi.fn(async () => state.selected) })),
      })),
    })),
    // update(table).set(patch).where(...)[.returning()] -> applique le patch
    update: vi.fn(() => ({
      set: (patch: Record<string, unknown>) => ({
        where: vi.fn(() => {
          state.updates.push(patch);
          const updated = [{ ...patch }];
          return Object.assign(Promise.resolve(updated), {
            returning: vi.fn(async () => updated),
          });
        }),
      }),
    })),
  },
}));

import {
  requestEvidence,
  addEvidence,
  updateStatus,
  expireStaleContributions,
  CONTRIBUTION_POLICY,
} from "./contributions";

// Réinitialisation entre tests.
beforeEach(() => {
  state.selected = [];
  state.updates = [];
});

describe("CONTRIBUTION_POLICY", () => {
  it("expire après exactement 2 relances et un délai de 30 jours", () => {
    expect(CONTRIBUTION_POLICY.maxReminders).toBe(2);
    expect(CONTRIBUTION_POLICY.evidenceDeadlineDays).toBe(30);
  });
});

describe("requestEvidence", () => {
  it("passe en evidence_requested avec relance + échéance future", async () => {
    await requestEvidence("c1", "mod-1", "Preuves insuffisantes");

    const patch = state.updates.at(-1)!;
    expect(patch.status).toBe("evidence_requested");
    expect(patch.reviewed_by ?? patch.reviewedBy).toBe("mod-1");
    expect((patch.deadlineAt as Date).getTime()).toBeGreaterThan(Date.now());
  });
});

describe("addEvidence", () => {
  it("fusionne les preuves et repasse au statut pending", async () => {
    state.selected = [
      {
        id: "c1",
        status: "evidence_requested",
        evidence: [{ kind: "official-site", url: "https://band.example" }],
      },
    ];

    await addEvidence("c1", [
      { kind: "musicbrainz", url: "https://musicbrainz.org/artist/x" },
    ]);

    const patch = state.updates.at(-1)!;
    expect(patch.status).toBe("pending");
    const merged = patch.evidence as { kind: string }[];
    expect(merged).toHaveLength(2); // ancienne + nouvelle preuve conservées
  });

  it("retourne null si la contribution n'existe pas", async () => {
    state.selected = [];
    const result = await addEvidence("c-inconnu", [
      { kind: "press", url: "https://presse.example/article" },
    ]);
    expect(result).toBeNull();
  });
});

describe("expireStaleContributions", () => {
  const now = Date.now();

  it("n'expire que relances max atteintes ET échéance dépassée", async () => {
    state.selected = [
      {
        id: "c-expire",
        status: "evidence_requested",
        reminderCount: 2,
        deadlineAt: new Date(now - 1000),
      },
      {
        id: "c-relance-insuffisante",
        status: "evidence_requested",
        reminderCount: 1, // moins que maxReminders
        deadlineAt: new Date(now - 1000),
      },
      {
        id: "c-pas-encore-due",
        status: "evidence_requested",
        reminderCount: 2,
        deadlineAt: new Date(now + 86_400_000), // échéance future
      },
    ];

    const expired = await expireStaleContributions();
    expect(expired).toEqual(["c-expire"]);
    // Un seul UPDATE appliqué
    expect(state.updates).toHaveLength(1);
    expect(state.updates[0].status).toBe("expired");
  });

  it("ne fait rien quand aucune contribution n'est expirable", async () => {
    state.selected = [];
    const expired = await expireStaleContributions();
    expect(expired).toEqual([]);
    expect(state.updates).toHaveLength(0);
  });
});

describe("updateStatus", () => {
  it("applique le statut demandé avec le relecteur", async () => {
    await updateStatus("c1", "approved", "mod-9");
    const patch = state.updates.at(-1)!;
    expect(patch.status).toBe("approved");
    expect(patch.reviewedBy).toBe("mod-9");
  });
});
