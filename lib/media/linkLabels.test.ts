/**
 * Tests du nommage des liens officiels (lib/media/linkLabels.ts).
 *
 * Le défaut corrigé ici était visible à l'œil nu : MusicBrainz range
 * plusieurs plateformes sous le même type de relation, et la fiche
 * affichait trois boutons « Écoute gratuite » indiscernables.
 */

import { describe, it, expect } from "vitest";
import { officialLinkLabel } from "./linkLabels";

describe("officialLinkLabel", () => {
  it("nomme la plateforme de destination plutôt que le type de relation", () => {
    expect(
      officialLinkLabel("https://open.spotify.com/artist/x", "Écoute en ligne"),
    ).toBe("Spotify");
    expect(
      officialLinkLabel("https://emperor.bandcamp.com/", "Écoute gratuite"),
    ).toBe("Bandcamp");
  });

  it("distingue deux liens du même type de relation", () => {
    const type = "Écoute gratuite";
    expect(officialLinkLabel("https://www.youtube.com/c/x", type)).not.toBe(
      officialLinkLabel("https://soundcloud.com/x", type),
    );
  });

  it("affiche le domaine pour un site officiel non répertorié", () => {
    expect(
      officialLinkLabel("https://www.emperorhorde.com/", "Site officiel"),
    ).toBe("emperorhorde.com");
  });

  it("nomme un domaine inconnu par son domaine, sans préfixe", () => {
    // Régression : le type de relation MusicBrainz servait de préfixe et
    // produisait « Achat / téléchargement · uk.7digital.com », qui
    // débordait du bouton sans rien apprendre.
    expect(officialLinkLabel("https://label-obscur.test/x", "Label")).toBe(
      "label-obscur.test",
    );
  });

  it("reconnaît les boutiques et réseaux que le repli nommait mal", () => {
    expect(
      officialLinkLabel("https://itunes.apple.com/gb/artist/id1", "Achat"),
    ).toBe("iTunes");
    expect(
      officialLinkLabel("https://www.reverbnation.com/x", "Réseau social"),
    ).toBe("ReverbNation");
    expect(
      officialLinkLabel("https://music.amazon.co.uk/artists/B1", "Écoute"),
    ).toBe("Amazon Music");
    expect(officialLinkLabel("https://uk.7digital.com/artist/x", "Achat")).toBe(
      "7digital",
    );
  });

  it("retombe sur le libellé fourni si l'URL est inexploitable", () => {
    expect(officialLinkLabel("pas-une-url", "Site officiel")).toBe(
      "Site officiel",
    );
  });
});
