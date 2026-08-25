/**
 * Tests du registre d'embeds (lib/media/embeds.ts).
 * Logique pure : formats d'URL YouTube/Spotify, widgets Bandcamp/Qobuz
 * depuis les références en base, rejets propres.
 */
import { describe, it, expect } from "vitest";
import { parseEmbedUrl, buildEmbedFromRef } from "./embeds";

describe("parseEmbedUrl", () => {
  it("résout youtube.com/watch", () => {
    const r = parseEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(r?.platform).toBe("youtube");
    expect(r?.embedUrl).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
    );
    expect(r?.nativeId).toBe("dQw4w9WgXcQ");
  });

  it("résout youtu.be et shorts", () => {
    expect(parseEmbedUrl("https://youtu.be/abc123")?.nativeId).toBe("abc123");
    expect(
      parseEmbedUrl("https://www.youtube.com/shorts/xyz789")?.nativeId,
    ).toBe("xyz789");
  });

  it("résout open.spotify.com avec préfixe locale éventuel", () => {
    const r = parseEmbedUrl("https://open.spotify.com/intl-fr/album/1A2b3C");
    expect(r?.platform).toBe("spotify");
    expect(r?.embedUrl).toBe("https://open.spotify.com/embed/album/1A2b3C");
  });

  it("passe tel quel un embed Bandcamp/Qobuz déjà formatté", () => {
    const bc = parseEmbedUrl(
      "https://bandcamp.com/EmbeddedPlayer/album=123/size=large/",
    );
    expect(bc?.platform).toBe("bandcamp");
    const qz = parseEmbedUrl("https://widget.qobuz.com/?type=album&id=456");
    expect(qz?.platform).toBe("qobuz");
  });

  it("retourne null pour une URL non supportée ou malformée", () => {
    expect(parseEmbedUrl("https://vimeo.com/12345")).toBeNull();
    expect(parseEmbedUrl("pas-une-url")).toBeNull();
    // YouTube sans identifiant exploitable
    expect(parseEmbedUrl("https://www.youtube.com/channel/x")).toBeNull();
  });
});

describe("buildEmbedFromRef", () => {
  it("construit YouTube nocookie depuis l'ID natif", () => {
    const r = buildEmbedFromRef("youtube", "dQw4w9WgXcQ");
    expect(r?.embedUrl).toContain("youtube-nocookie.com/embed/");
  });

  it("exige un ID numérique pour Bandcamp et Qobuz", () => {
    expect(buildEmbedFromRef("bandcamp", "1234567890")?.platform).toBe(
      "bandcamp",
    );
    expect(buildEmbedFromRef("qobuz", "00abcd")).toBeNull(); // non numérique
  });

  it("retourne null pour un provider sans embed de données", () => {
    // musicbrainz/deezer sont des providers de DONNÉES, pas d'embed
    expect(buildEmbedFromRef("musicbrainz", "x")).toBeNull();
  });
});
