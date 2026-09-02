/**
 * Tests du repli de la pochette.
 *
 * Cover Art Archive redirige vers l'Internet Archive : un 504 en amont
 * fait échouer l'optimiseur d'image de Next, et le navigateur affiche
 * alors l'icône de fichier brisé. Ces tests vérifient que l'incident
 * devient invisible — c'est le seul intérêt de ce composant client.
 */
// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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

const SIZES = "200px";

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

  it("bascule sur le repli neutre quand l'image échoue à charger", () => {
    render(
      <CoverImage
        src="https://exemple.test/a.jpg"
        title="Gothic"
        sizes={SIZES}
      />,
    );

    fireEvent.error(screen.getByAltText("Pochette de Gothic"));

    // L'image brisée disparaît au profit du repli : l'incident amont ne
    // doit pas être visible côté lecteur.
    expect(screen.queryByAltText("Pochette de Gothic")).toBeNull();
    expect(
      screen.getByLabelText("Aucun visuel disponible pour Gothic"),
    ).toBeDefined();
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
});
