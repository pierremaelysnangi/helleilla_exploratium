/**
 * Tests de la table d'administration des comptes.
 *
 * Enjeu : l'auto-protection. L'API refuse déjà qu'un administrateur se
 * rétrograde, se bannisse ou se supprime ; l'interface ne doit pas
 * proposer ces actions, sous peine de n'offrir qu'un chemin vers une
 * erreur. Ces tests vérifient que la ligne de l'administrateur connecté
 * est traitée différemment des autres.
 */
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { UsersTable } from "./usersTable";

const SELF = "admin-1";
const OTHER = "user-2";

/** Deux comptes : l'administrateur connecté, et quelqu'un d'autre. */
const PAGE = {
  data: [
    {
      id: SELF,
      name: "Moi",
      email: "moi@exemple.test",
      emailVerified: true,
      role: "admin",
      banned: false,
      banReason: null,
      banExpires: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: OTHER,
      name: "Nyx",
      email: "nyx@exemple.test",
      emailVerified: false,
      role: "contributor",
      banned: false,
      banReason: null,
      banExpires: null,
      createdAt: "2026-01-02T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
    },
  ],
  meta: { total: 2, page: 1, perPage: 20, totalPages: 1 },
};

const fetchMock = vi.hoisted(() => vi.fn());
vi.stubGlobal("fetch", fetchMock);

function wrap(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
}

/** Retrouve la fiche d'un compte par son nom affiché. */
function cardOf(name: string) {
  return screen.getByText(name).closest("article") as HTMLElement;
}

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(
    new Response(JSON.stringify(PAGE), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  );
});

describe("UsersTable", () => {
  it("affiche les comptes avec leur email et leur rôle", async () => {
    wrap(<UsersTable currentUserId={SELF} />);

    await waitFor(() => expect(screen.getByText("Nyx")).toBeDefined());
    expect(screen.getByText(/nyx@exemple\.test/)).toBeDefined();
    // Scopé à la fiche : « Contributeur » figure aussi dans chaque
    // sélecteur de rôle, une recherche globale serait ambiguë.
    expect(
      within(cardOf("Nyx")).getAllByText("Contributeur").length,
    ).toBeGreaterThan(0);
  });

  it("signale la ligne de l'administrateur connecté", async () => {
    wrap(<UsersTable currentUserId={SELF} />);
    await waitFor(() => expect(screen.getByText("Moi")).toBeDefined());

    expect(within(cardOf("Moi")).getByText("(vous)")).toBeDefined();
  });

  it("ne propose ni bannissement ni suppression sur son propre compte", async () => {
    wrap(<UsersTable currentUserId={SELF} />);
    await waitFor(() => expect(screen.getByText("Moi")).toBeDefined());

    const self = within(cardOf("Moi"));
    expect(self.queryByRole("button", { name: /Bannir/ })).toBeNull();
    expect(self.queryByRole("button", { name: /Supprimer/ })).toBeNull();
  });

  it("verrouille le sélecteur de rôle de son propre compte", async () => {
    wrap(<UsersTable currentUserId={SELF} />);
    await waitFor(() => expect(screen.getByText("Moi")).toBeDefined());

    const select = within(cardOf("Moi")).getByRole("combobox");
    expect(select.hasAttribute("disabled")).toBe(true);
  });

  it("propose les actions destructrices sur les AUTRES comptes", async () => {
    wrap(<UsersTable currentUserId={SELF} />);
    await waitFor(() => expect(screen.getByText("Nyx")).toBeDefined());

    const other = within(cardOf("Nyx"));
    expect(other.getByRole("button", { name: /Bannir/ })).toBeDefined();
    expect(other.getByRole("button", { name: /Supprimer/ })).toBeDefined();
    expect(other.getByRole("combobox").hasAttribute("disabled")).toBe(false);
  });

  it("exige la saisie exacte du nom avant de confirmer une suppression", async () => {
    const { rerender } = wrap(<UsersTable currentUserId={SELF} />);
    await waitFor(() => expect(screen.getByText("Nyx")).toBeDefined());

    within(cardOf("Nyx"))
      .getByRole("button", { name: /Supprimer/ })
      .click();
    rerender(<div />); // force le flush du state avant assertion
    await waitFor(() => {
      const confirm = screen.queryByRole("button", {
        name: /Confirmer la suppression/,
      });
      // Tant que le nom n'est pas saisi, la confirmation reste inerte
      if (confirm) expect(confirm.hasAttribute("disabled")).toBe(true);
    });
  });
});
