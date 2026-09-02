/**
 * Tests du formulaire de soumission.
 *
 * Enjeu : le verrou d'envoi. La soumission est plafonnée à cinq par heure,
 * et le serveur refuse tout dossier sans deux preuves dont une officielle.
 * Laisser partir un dossier irrecevable consommerait un envoi pour rien —
 * ces tests vérifient que l'interface bloque AVANT l'appel réseau, et
 * qu'elle débloque dès que la règle est satisfaite.
 */
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ContributionForm } from "./contributionForm";

// Le formulaire ne doit émettre aucune requête tant qu'il est verrouillé
const fetchMock = vi.hoisted(() => vi.fn());
vi.stubGlobal("fetch", fetchMock);

/** Provider TanStack neuf par test, sans retry. */
function wrap(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
}

/** Saisit une preuve dans la n-ième ligne de l'éditeur. */
function fillEvidence(index: number, kind: string, url: string) {
  const kinds = screen.getAllByLabelText("Type de source", { exact: false });
  const urls = screen.getAllByPlaceholderText(/musicbrainz\.org/);
  fireEvent.change(kinds[index], { target: { value: kind } });
  fireEvent.change(urls[index], { target: { value: url } });
}

const submitButton = () =>
  screen.getByRole("button", { name: /Soumettre le dossier/ });

beforeEach(() => {
  fetchMock.mockReset();
});

describe("ContributionForm — verrou de soumission", () => {
  it("démarre verrouillé : ni nom ni preuves", () => {
    wrap(<ContributionForm />);
    expect(submitButton().hasAttribute("disabled")).toBe(true);
  });

  it("reste verrouillé avec un nom mais sans preuve officielle", () => {
    wrap(<ContributionForm />);
    fireEvent.change(screen.getAllByRole("textbox")[0], {
      target: { value: "Necrofrost" },
    });
    fillEvidence(0, "press", "https://presse.test/a");
    fillEvidence(1, "other", "https://autre.test/b");

    expect(submitButton().hasAttribute("disabled")).toBe(true);
    expect(
      screen.getByText(/Complétez les preuves pour pouvoir soumettre/),
    ).toBeDefined();
  });

  it("se déverrouille avec deux preuves dont une officielle", () => {
    wrap(<ContributionForm />);
    const nameField = screen.getAllByRole("textbox")[0];
    fireEvent.change(nameField, { target: { value: "Necrofrost" } });
    fillEvidence(0, "musicbrainz", "https://musicbrainz.org/artist/x");
    fillEvidence(1, "press", "https://presse.test/a");

    expect(submitButton().hasAttribute("disabled")).toBe(false);
  });

  it("n'émet aucune requête tant que le verrou tient", () => {
    wrap(<ContributionForm />);
    fireEvent.click(submitButton());

    // Le plafond de cinq envois horaires ne doit pas être entamé par un
    // dossier que le serveur refuserait de toute façon.
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("ContributionForm — dérivation du slug", () => {
  it("dérive le slug du nom, en kebab-case sans accents", () => {
    wrap(<ContributionForm />);
    const nameField = screen.getAllByRole("textbox")[0];
    fireEvent.change(nameField, { target: { value: "Éternité Grise" } });

    expect(screen.getByDisplayValue("eternite-grise")).toBeDefined();
  });

  it("cesse de suivre le nom dès que le slug est édité à la main", () => {
    wrap(<ContributionForm />);
    const nameField = screen.getAllByRole("textbox")[0];
    fireEvent.change(nameField, { target: { value: "Necrofrost" } });

    const slugField = screen.getByDisplayValue("necrofrost");
    fireEvent.change(slugField, { target: { value: "necrofrost-no" } });
    fireEvent.change(nameField, { target: { value: "Necrofrost II" } });

    // Le choix manuel prime : le récrire à chaque frappe du nom
    // effacerait le travail de l'utilisateur.
    expect(screen.getByDisplayValue("necrofrost-no")).toBeDefined();
  });
});
