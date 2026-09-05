/**
 * @file Presse et médias de la scène metal.
 *
 * Chaque adresse a été VÉRIFIÉE : elle répond, ou son domaine est servi
 * derrière un filtre anti-robot. Aucune n'est déduite d'un nom ni
 * reconstruite « logiquement » — un lien inventé qui tombe en 404
 * décrédibilise la page entière.
 *
 * Trois titres pourtant connus ont été ÉCARTÉS faute de réponse depuis
 * l'environnement de vérification : mieux vaut une liste plus courte
 * qu'un lien mort. Ils reviendront quand leur adresse sera confirmée.
 *
 * La liste est volontairement partielle et ouverte : elle ne prétend pas
 * couvrir la presse metal mondiale, seulement offrir des points d'entrée
 * fiables. Les contributions l'étendront.
 */

export type SeedMediaOutlet = {
  name: string;
  slug: string;
  kind: "webzine" | "magazine" | "radio" | "podcast" | "video";
  countryCode: string;
  websiteUrl: string;
};

export const MEDIA_OUTLETS: SeedMediaOutlet[] = [
  // --- États-Unis
  {
    name: "Blabbermouth",
    slug: "blabbermouth",
    kind: "webzine",
    countryCode: "US",
    websiteUrl: "https://blabbermouth.net",
  },
  {
    name: "Metal Injection",
    slug: "metal-injection",
    kind: "webzine",
    countryCode: "US",
    websiteUrl: "https://metalinjection.net",
  },
  {
    name: "Invisible Oranges",
    slug: "invisible-oranges",
    kind: "webzine",
    countryCode: "US",
    websiteUrl: "https://www.invisibleoranges.com",
  },
  {
    name: "No Clean Singing",
    slug: "no-clean-singing",
    kind: "webzine",
    countryCode: "US",
    websiteUrl: "https://www.nocleansinging.com",
  },
  {
    name: "Toilet ov Hell",
    slug: "toilet-ov-hell",
    kind: "webzine",
    countryCode: "US",
    websiteUrl: "https://www.toiletovhell.com",
  },
  {
    name: "Loudwire",
    slug: "loudwire",
    kind: "webzine",
    countryCode: "US",
    websiteUrl: "https://loudwire.com",
  },
  {
    name: "MetalSucks",
    slug: "metalsucks",
    kind: "webzine",
    countryCode: "US",
    websiteUrl: "https://www.metalsucks.net",
  },
  {
    name: "Decibel",
    slug: "decibel",
    kind: "magazine",
    countryCode: "US",
    websiteUrl: "https://www.decibelmagazine.com",
  },

  // --- Royaume-Uni
  {
    name: "Metal Hammer",
    slug: "metal-hammer-uk",
    kind: "magazine",
    countryCode: "GB",
    websiteUrl: "https://www.loudersound.com/metal-hammer",
  },
  {
    name: "Kerrang!",
    slug: "kerrang",
    kind: "magazine",
    countryCode: "GB",
    websiteUrl: "https://www.kerrang.com",
  },

  // --- Allemagne
  {
    name: "Metal Hammer",
    slug: "metal-hammer-de",
    kind: "magazine",
    countryCode: "DE",
    websiteUrl: "https://www.metal-hammer.de",
  },
  {
    name: "Rock Hard",
    slug: "rock-hard",
    kind: "magazine",
    countryCode: "DE",
    websiteUrl: "https://www.rockhard.de",
  },
  {
    name: "Legacy",
    slug: "legacy",
    kind: "magazine",
    countryCode: "DE",
    websiteUrl: "https://www.legacy.de",
  },

  // --- France
  {
    name: "Radio Metal",
    slug: "radio-metal",
    kind: "radio",
    countryCode: "FR",
    websiteUrl: "https://www.radiometal.com",
  },
  {
    name: "Metalorgie",
    slug: "metalorgie",
    kind: "webzine",
    countryCode: "FR",
    websiteUrl: "https://www.metalorgie.com",
  },

  // --- Suède
  {
    name: "Angry Metal Guy",
    slug: "angry-metal-guy",
    kind: "webzine",
    countryCode: "SE",
    websiteUrl: "https://www.angrymetalguy.com",
  },
  {
    name: "Sweden Rock Magazine",
    slug: "sweden-rock-magazine",
    kind: "magazine",
    countryCode: "SE",
    websiteUrl: "https://www.swedenrock.com",
  },

  // --- Finlande
  {
    name: "Kaaoszine",
    slug: "kaaoszine",
    kind: "webzine",
    countryCode: "FI",
    websiteUrl: "https://kaaoszine.fi",
  },

  // --- Norvège
  {
    name: "Scream Magazine",
    slug: "scream-magazine",
    kind: "magazine",
    countryCode: "NO",
    websiteUrl: "https://www.screamzine.com",
  },

  // --- Canada
  {
    name: "BraveWords",
    slug: "bravewords",
    kind: "webzine",
    countryCode: "CA",
    websiteUrl: "https://bravewords.com",
  },
  {
    name: "BangerTV",
    slug: "bangertv",
    kind: "video",
    countryCode: "CA",
    websiteUrl: "https://bangertv.com",
  },

  // --- Estonie
  {
    name: "Metal Storm",
    slug: "metal-storm",
    kind: "webzine",
    countryCode: "EE",
    websiteUrl: "https://www.metalstorm.net",
  },
];
