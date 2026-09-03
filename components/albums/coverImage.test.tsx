/**
 * Tests du repli de la pochette.
 *
 * Cover Art Archive redirige vers l'Internet Archive : un 504 en amont
 * fait échouer l'optimiseur d'image de Next, et le navigateur affiche
 * alors l'icône de fichier brisé. Ces tests vérifient que l'incident
 * devient invisible — c'est le seul intérêt de ce composant client.
 */
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { CoverImage } from "./coverImage";

// next/image exige la configuration du serveur ; on le réduit à un <img>
// qui conserve `onError`, seul comportement testé ici.
vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    onError,
  }: {
    src: string;
    alt: string;
    onError?: () => void;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} onError={onError} />
  ),
}));

/** Visuel de groupe servant de repli dans les tests ci-dessous. */
const BAND = {
  bandImageUrl: "https://exemple.test/groupe.jpg",
  bandName: "Paradise Lost",
};

const SIZES = "200px";

/**
 * Épuise les réessais de <ResilientImage> sur l'image visible.
 *
 * Le repli n'est plus immédiat : une indisponibilité passagère de
 * l'archive amont ne doit pas faire basculer durablement la pochette
 * sur le visuel du groupe. Il faut donc échouer plusieurs fois, et
 * laisser filer les délais croissants, pour atteindre le repli.
 */
async function exhaustRetries(alt: string) {
  for (let i = 0; i < 8; i++) {
    const img = screen.queryByAltText(alt);
    if (!img) return;
    fireEvent.error(img);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });
  }
}

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("CoverImage", () => {
  it("affiche la pochette quand une URL est fournie", () => {
    render(
      <CoverImage
        src="https://exemple.test/a.jpg"
        title="Gothic"
        sizes={SIZES}
      />,
    );
    expect(screen.getByAltText("Pochette de Gothic")).toBeDefined();
  });

  it("affiche le repli neutre en l'absence d'URL", () => {
    render(<CoverImage src={null} title="Gothic" sizes={SIZES} />);

    expect(screen.queryByAltText("Pochette de Gothic")).toBeNull();
    expect(
      screen.getByLabelText("Aucun visuel disponible pour Gothic"),
    ).toBeDefined();
  });

  it("bascule sur le repli neutre une fois les réessais épuisés", async () => {
    render(
      <CoverImage
        src="https://exemple.test/a.jpg"
        title="Gothic"
        sizes={SIZES}
      />,
    );

    await exhaustRetries("Pochette de Gothic");

    // L'image brisée disparaît au profit du repli : l'incident amont ne
    // doit pas être visible côté lecteur.
    expect(screen.queryByAltText("Pochette de Gothic")).toBeNull();
    expect(
      screen.getByLabelText("Aucun visuel disponible pour Gothic"),
    ).toBeDefined();
  });

  it("ne bascule PAS au premier échec", async () => {
    // Régression : un 503 passager de l'archive suffisait à remplacer la
    // pochette, alors que le réessai la récupère le plus souvent.
    render(
      <CoverImage
        src="https://exemple.test/a.jpg"
        title="Gothic"
        sizes={SIZES}
      />,
    );

    fireEvent.error(screen.getByAltText("Pochette de Gothic"));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });

    expect(screen.queryByAltText("Pochette de Gothic")).not.toBeNull();
    expect(
      screen.queryByLabelText("Aucun visuel disponible pour Gothic"),
    ).toBeNull();
  });

  it("n'affiche jamais l'initiale du titre en guise de visuel", () => {
    // Régression : le repli était un monogramme, répété à l'identique sur
    // toutes les fiches sans pochette. Le catalogue paraissait vide.
    render(
      <CoverImage src={undefined} title="to Mega Therion" sizes={SIZES} />,
    );
    expect(screen.queryByText("t")).toBeNull();
    expect(screen.queryByText("T")).toBeNull();
  });

  it("retombe sur le visuel du groupe quand aucune pochette n'existe", () => {
    // Une part des démos et des captations live n'a pas de pochette
    // archivée : le pictogramme neutre se répétait alors à l'écran sans
    // rien dire du groupe.
    render(<CoverImage src={null} title="Demo 1992" sizes={SIZES} {...BAND} />);

    expect(
      screen.getByAltText(
        "Aucune pochette pour Demo 1992 — visuel de Paradise Lost",
      ),
    ).toBeDefined();
  });

  it("annonce que le visuel du groupe n'est PAS la pochette", () => {
    // Une encyclopédie ne doit pas laisser croire qu'un visuel de groupe
    // est la pochette de l'œuvre : le texte alternatif le dit.
    render(<CoverImage src={null} title="Demo 1992" sizes={SIZES} {...BAND} />);

    expect(screen.queryByAltText("Pochette de Demo 1992")).toBeNull();
  });

  it("enchaîne les deux replis si le visuel du groupe échoue aussi", async () => {
    render(
      <CoverImage
        src="https://exemple.test/a.jpg"
        title="Gothic"
        sizes={SIZES}
        {...BAND}
      />,
    );

    await exhaustRetries("Pochette de Gothic");
    await exhaustRetries(
      "Aucune pochette pour Gothic — visuel de Paradise Lost",
    );

    expect(
      screen.getByLabelText("Aucun visuel disponible pour Gothic"),
    ).toBeDefined();
  });
});
