/**
 * @file Jeu de données de démonstration — GROUPES RÉELS uniquement.
 *
 * Ce projet interdit la fabrication de contenu : inventer des groupes pour
 * remplir l'écran contredirait sa raison d'être, et laisserait des entrées
 * fictives dans l'encyclopédie si le seed était rejoué ailleurs qu'en
 * développement.
 *
 * Toutes les entrées ci-dessous sont des faits vérifiables : formations,
 * pays, années de sortie et titres d'albums documentés publiquement. Les
 * identifiants MusicBrainz ne sont PAS écrits en dur — ils sont résolus à
 * l'exécution via `lib/providers/musicbrainz.ts`, ce qui évite d'inscrire
 * un identifiant approximatif et fait passer le seed par la même couche
 * que l'application.
 *
 * Aucune pochette ni aucun extrait n'est stocké : ils proviennent des
 * plateformes officielles au moment de l'affichage, via le resolver média.
 */

/** Genre de la taxonomie, éventuellement rattaché à un parent. */
export type SeedGenre = {
  name: string;
  slug: string;
  /** Slug du genre parent, pour la hiérarchie. */
  parent?: string;
};

/**
 * Taxonomie de départ : quatre familles racines et leurs ramifications
 * les plus établies.
 */
export const GENRES: SeedGenre[] = [
  { name: "Black Metal", slug: "black-metal" },
  { name: "Death Metal", slug: "death-metal" },
  { name: "Doom Metal", slug: "doom-metal" },
  { name: "Thrash Metal", slug: "thrash-metal" },
  {
    name: "Symphonic Black Metal",
    slug: "symphonic-black-metal",
    parent: "black-metal",
  },
  {
    name: "Atmospheric Black Metal",
    slug: "atmospheric-black-metal",
    parent: "black-metal",
  },
  {
    name: "Melodic Death Metal",
    slug: "melodic-death-metal",
    parent: "death-metal",
  },
  { name: "Death-Doom", slug: "death-doom", parent: "doom-metal" },
  { name: "Funeral Doom", slug: "funeral-doom", parent: "doom-metal" },
];

/** Label réel, avec son pays et son année de fondation. */
export type SeedLabel = {
  name: string;
  slug: string;
  countryCode: string;
  foundedYear: number;
  websiteUrl?: string;
};

export const LABELS: SeedLabel[] = [
  {
    name: "Peaceville Records",
    slug: "peaceville-records",
    countryCode: "GB",
    foundedYear: 1987,
    websiteUrl: "https://www.peaceville.com",
  },
  {
    name: "Century Media Records",
    slug: "century-media-records",
    countryCode: "DE",
    foundedYear: 1988,
    websiteUrl: "https://www.centurymedia.com",
  },
  {
    name: "Candlelight Records",
    slug: "candlelight-records",
    countryCode: "GB",
    foundedYear: 1992,
  },
  {
    name: "Nuclear Blast",
    slug: "nuclear-blast",
    countryCode: "DE",
    foundedYear: 1987,
    websiteUrl: "https://www.nuclearblast.com",
  },
];

/** Sortie d'un groupe : titre, année et nature réels. */
export type SeedAlbum = {
  title: string;
  slug: string;
  type: "album" | "ep" | "single" | "compilation" | "live" | "demo";
  releaseYear: number;
  /** Slug du label éditeur, s'il figure dans LABELS. */
  label?: string;
  /** Quelques titres de l'album, dans l'ordre de la tracklist. */
  tracks?: string[];
};

/** Membre réel d'un groupe, avec son rôle et sa période. */
export type SeedMember = {
  name: string;
  slug: string;
  role: string;
  joinedYear?: number;
  leftYear?: number;
};

/** Groupe réel et sa discographie documentée. */
export type SeedBand = {
  name: string;
  slug: string;
  countryCode: string;
  formedYear: number;
  dissolvedYear?: number;
  bio: string;
  genres: string[];
  albums: SeedAlbum[];
  members: SeedMember[];
};

export const BANDS: SeedBand[] = [
  {
    name: "Emperor",
    slug: "emperor",
    countryCode: "NO",
    formedYear: 1991,
    dissolvedYear: 2001,
    bio: "Groupe norvégien formé à Notodden, figure majeure de la seconde vague de black metal. Sa fusion d'arrangements symphoniques et de black metal a durablement marqué le genre.",
    genres: ["black-metal", "symphonic-black-metal"],
    members: [
      {
        name: "Ihsahn",
        slug: "ihsahn",
        role: "Chant, guitare",
        joinedYear: 1991,
        leftYear: 2001,
      },
      {
        name: "Samoth",
        slug: "samoth",
        role: "Guitare",
        joinedYear: 1991,
        leftYear: 2001,
      },
      {
        name: "Trym Torson",
        slug: "trym-torson",
        role: "Batterie",
        joinedYear: 1996,
        leftYear: 2001,
      },
    ],
    albums: [
      {
        title: "In the Nightside Eclipse",
        slug: "in-the-nightside-eclipse",
        type: "album",
        releaseYear: 1994,
        label: "candlelight-records",
        tracks: [
          "Into the Infinity of Thoughts",
          "The Burning Shadows of Silence",
          "Cosmic Keys to My Creations & Times",
          "Beyond the Great Vast Forest",
          "Towards the Pantheon",
          "The Majesty of the Nightsky",
          "I Am the Black Wizards",
          "Inno a Satana",
        ],
      },
      {
        title: "Anthems to the Welkin at Dusk",
        slug: "anthems-to-the-welkin-at-dusk",
        type: "album",
        releaseYear: 1997,
        label: "candlelight-records",
        tracks: [
          "Al Svartr (The Oath)",
          "Ye Entrancemperium",
          "Thus Spake the Nightspirit",
          "Ensorcelled by Khaos",
          "The Loss and Curse of Reverence",
          "The Acclamation of Bonds",
          "With Strength I Burn",
          "The Wanderer",
        ],
      },
      {
        title: "IX Equilibrium",
        slug: "ix-equilibrium",
        type: "album",
        releaseYear: 1999,
        label: "candlelight-records",
      },
      {
        title: "Prometheus: The Discipline of Fire & Demise",
        slug: "prometheus-the-discipline-of-fire-and-demise",
        type: "album",
        releaseYear: 2001,
        label: "candlelight-records",
      },
      {
        title: "Wrath of the Tyrant",
        slug: "wrath-of-the-tyrant",
        type: "demo",
        releaseYear: 1992,
      },
    ],
  },
  {
    name: "Darkthrone",
    slug: "darkthrone",
    countryCode: "NO",
    formedYear: 1986,
    bio: "Groupe norvégien originaire de Kolbotn, d'abord orienté death metal avant de basculer vers un black metal volontairement brut. Le duo Nocturno Culto / Fenriz en constitue le noyau depuis 1991.",
    genres: ["black-metal", "death-metal"],
    members: [
      {
        name: "Fenriz",
        slug: "fenriz",
        role: "Batterie, chant",
        joinedYear: 1986,
      },
      {
        name: "Nocturno Culto",
        slug: "nocturno-culto",
        role: "Chant, guitare",
        joinedYear: 1988,
      },
    ],
    albums: [
      {
        title: "Soulside Journey",
        slug: "soulside-journey",
        type: "album",
        releaseYear: 1991,
        label: "peaceville-records",
      },
      {
        title: "A Blaze in the Northern Sky",
        slug: "a-blaze-in-the-northern-sky",
        type: "album",
        releaseYear: 1992,
        label: "peaceville-records",
        tracks: [
          "Kathaarian Life Code",
          "In the Shadow of the Horns",
          "Paragon Belial",
          "Where Cold Winds Blow",
          "A Blaze in the Northern Sky",
          "The Pagan Winter",
        ],
      },
      {
        title: "Under a Funeral Moon",
        slug: "under-a-funeral-moon",
        type: "album",
        releaseYear: 1993,
        label: "peaceville-records",
      },
      {
        title: "Transilvanian Hunger",
        slug: "transilvanian-hunger",
        type: "album",
        releaseYear: 1994,
        label: "peaceville-records",
      },
    ],
  },
  {
    name: "My Dying Bride",
    slug: "my-dying-bride",
    countryCode: "GB",
    formedYear: 1990,
    bio: "Groupe anglais de Halifax, l'un des trois piliers du death-doom britannique aux côtés de Paradise Lost et Anathema. Violon et chant clair y côtoient des tempos lents et des textes mélancoliques.",
    genres: ["doom-metal", "death-doom"],
    members: [
      {
        name: "Aaron Stainthorpe",
        slug: "aaron-stainthorpe",
        role: "Chant",
        joinedYear: 1990,
      },
      {
        name: "Andrew Craighan",
        slug: "andrew-craighan",
        role: "Guitare",
        joinedYear: 1990,
      },
    ],
    albums: [
      {
        title: "As the Flower Withers",
        slug: "as-the-flower-withers",
        type: "album",
        releaseYear: 1992,
        label: "peaceville-records",
      },
      {
        title: "Turn Loose the Swans",
        slug: "turn-loose-the-swans",
        type: "album",
        releaseYear: 1993,
        label: "peaceville-records",
        tracks: [
          "Sear Me MCMXCIII",
          "Your River",
          "The Songless Bird",
          "The Snow in My Hand",
          "The Crown of Sympathy",
          "Turn Loose the Swans",
          "Black God",
        ],
      },
      {
        title: "The Angel and the Dark River",
        slug: "the-angel-and-the-dark-river",
        type: "album",
        releaseYear: 1995,
        label: "peaceville-records",
      },
    ],
  },
  {
    name: "At the Gates",
    slug: "at-the-gates",
    countryCode: "SE",
    formedYear: 1990,
    bio: "Groupe suédois de Göteborg, dont l'album Slaughter of the Soul a défini le death metal mélodique dit « son de Göteborg » et influencé une génération entière de groupes.",
    genres: ["death-metal", "melodic-death-metal"],
    members: [
      {
        name: "Tomas Lindberg",
        slug: "tomas-lindberg",
        role: "Chant",
        joinedYear: 1990,
      },
      {
        name: "Anders Björler",
        slug: "anders-bjorler",
        role: "Guitare",
        joinedYear: 1990,
        leftYear: 2017,
      },
    ],
    albums: [
      {
        title: "The Red in the Sky Is Ours",
        slug: "the-red-in-the-sky-is-ours",
        type: "album",
        releaseYear: 1992,
      },
      {
        title: "Terminal Spirit Disease",
        slug: "terminal-spirit-disease",
        type: "album",
        releaseYear: 1994,
      },
      {
        title: "Slaughter of the Soul",
        slug: "slaughter-of-the-soul",
        type: "album",
        releaseYear: 1995,
        label: "century-media-records",
        tracks: [
          "Blinded by Fear",
          "Slaughter of the Soul",
          "Cold",
          "Under a Serpent Sun",
          "Into the Dead Sky",
          "Suicide Nation",
          "World of Lies",
          "Unto Others",
          "Nausea",
          "Need",
          "The Flames of the End",
        ],
      },
    ],
  },
  {
    name: "Celtic Frost",
    slug: "celtic-frost",
    countryCode: "CH",
    formedYear: 1984,
    dissolvedYear: 2008,
    bio: "Groupe suisse issu de la dissolution de Hellhammer. Son approche expérimentale du metal extrême, notamment sur To Mega Therion, a ouvert la voie au black et au death metal européens.",
    genres: ["thrash-metal", "black-metal"],
    members: [
      {
        name: "Tom Gabriel Warrior",
        slug: "tom-gabriel-warrior",
        role: "Chant, guitare",
        joinedYear: 1984,
        leftYear: 2008,
      },
      {
        name: "Martin Eric Ain",
        slug: "martin-eric-ain",
        role: "Basse",
        joinedYear: 1984,
        leftYear: 2008,
      },
    ],
    albums: [
      {
        title: "Morbid Tales",
        slug: "morbid-tales",
        type: "ep",
        releaseYear: 1984,
        label: "nuclear-blast",
      },
      {
        title: "To Mega Therion",
        slug: "to-mega-therion",
        type: "album",
        releaseYear: 1985,
      },
      {
        title: "Into the Pandemonium",
        slug: "into-the-pandemonium",
        type: "album",
        releaseYear: 1987,
      },
      {
        title: "Monotheist",
        slug: "monotheist",
        type: "album",
        releaseYear: 2006,
        label: "century-media-records",
      },
    ],
  },
  {
    name: "Paradise Lost",
    slug: "paradise-lost",
    countryCode: "GB",
    formedYear: 1988,
    bio: "Groupe anglais de Halifax, pionnier du death-doom puis du gothic metal. Son album Gothic a donné son nom à tout un sous-genre.",
    genres: ["doom-metal", "death-doom"],
    members: [
      {
        name: "Nick Holmes",
        slug: "nick-holmes",
        role: "Chant",
        joinedYear: 1988,
      },
      {
        name: "Gregor Mackintosh",
        slug: "gregor-mackintosh",
        role: "Guitare",
        joinedYear: 1988,
      },
    ],
    albums: [
      {
        title: "Lost Paradise",
        slug: "lost-paradise",
        type: "album",
        releaseYear: 1990,
        label: "peaceville-records",
      },
      {
        title: "Gothic",
        slug: "gothic",
        type: "album",
        releaseYear: 1991,
        label: "peaceville-records",
      },
      {
        title: "Draconian Times",
        slug: "draconian-times",
        type: "album",
        releaseYear: 1995,
        label: "century-media-records",
      },
    ],
  },
];
