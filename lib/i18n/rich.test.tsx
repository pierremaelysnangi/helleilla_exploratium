/**
 * Tests des phrases traversées par un élément React.
 *
 * L'enjeu est l'ORDRE : une phrase découpée autour d'un lien fige la
 * syntaxe du français. Le test le vérifie en plaçant le marqueur en
 * tête, ce qu'aucun découpage figé n'aurait permis.
 */

// @vitest-environment jsdom

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { rich } from "./rich";

describe("rich", () => {
  it("insère l'élément à la place du marqueur", () => {
    const { container } = render(
      <p>
        {rich("Voir {link} pour la suite.", { link: <a href="/x">ici</a> })}
      </p>,
    );
    expect(screen.getByRole("link", { name: "ici" })).not.toBeNull();
    expect(container.textContent).toBe("Voir ici pour la suite.");
  });

  it("place l'élément où la langue l'exige, y compris en tête", () => {
    const { container } = render(
      <p>
        {rich("{link} pour noter cet album.", {
          link: <a href="/y">Connectez-vous</a>,
        })}
      </p>,
    );
    expect(container.textContent).toBe("Connectez-vous pour noter cet album.");
  });

  it("laisse un marqueur sans valeur visible plutôt que de l'escamoter", () => {
    // Un oubli doit se voir : un blanc silencieux passerait inaperçu.
    const { container } = render(<p>{rich("Avant {absent} après", {})}</p>);
    expect(container.textContent).toBe("Avant {absent} après");
  });

  it("rend un texte sans marqueur tel quel", () => {
    const { container } = render(
      <p>{rich("Rien à insérer", { link: <b>x</b> })}</p>,
    );
    expect(container.textContent).toBe("Rien à insérer");
  });
});
