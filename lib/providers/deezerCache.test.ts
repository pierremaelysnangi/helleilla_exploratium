/**
 * Garde-fou sur la durée de cache des recherches Deezer.
 *
 * Régression constatée en production locale : les URLs d'extrait
 * renvoyées par Deezer portent un jeton Akamai (`hdnea=exp=…`) valable
 * environ une heure. Le cache par défaut du client HTTP est de 24 h : il
 * servait donc des liens expirés pendant vingt-trois heures sur
 * vingt-quatre. La lecture échouait alors en 403, silencieusement — ce
 * qui se lisait comme « le lecteur ne marche pas pour certains sons ».
 *
 * Ce test verrouille la seule chose qui compte : la durée de cache doit
 * rester nettement inférieure à la validité du jeton.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const httpMock = vi.hoisted(() => ({ fetchJson: vi.fn() }));
vi.mock("./http", () => httpMock);
vi.mock("@/lib/env", () => ({ env: {} }));

const { searchTracks } = await import("./deezer");

/** Validité observée du jeton signé, en secondes. */
const TOKEN_LIFETIME = 3600;

beforeEach(() => {
  vi.clearAllMocks();
  httpMock.fetchJson.mockResolvedValue({ data: [], total: 0 });
});

describe("cache des extraits Deezer", () => {
  it("expire bien avant le jeton signé porté par l'URL", async () => {
    await searchTracks("Emperor");

    const options = httpMock.fetchJson.mock.calls[0]?.[2] as {
      cacheTtlSeconds?: number;
    };

    expect(options?.cacheTtlSeconds).toBeDefined();
    expect(options!.cacheTtlSeconds!).toBeLessThan(TOKEN_LIFETIME);
    // Une marge d'au moins la moitié de la validité : un extrait servi
    // juste avant expiration échouerait pendant la lecture.
    expect(options!.cacheTtlSeconds!).toBeLessThanOrEqual(TOKEN_LIFETIME / 2);
  });
});
