/**
 * @file Festivals et salles de la scène metal — données de référence.
 *
 * Faits vérifiables uniquement : chaque entrée porte l'adresse officielle
 * de l'organisateur ou de la salle, qui fait foi. Quand un domaine propre
 * a disparu, on pointe la page que la structure tient encore à jour —
 * souvent son compte Facebook — plutôt que de laisser un lien mort.
 *
 * `pnpm check:venue-links` vérifie que chaque adresse répond. Quelques
 * entrées n'en ont PAS : leur domaine a disparu, et deviner un compte de
 * remplacement reviendrait à inventer un lien. Mieux vaut pas d'adresse
 * qu'une fausse — un contributeur qui connaît le lieu la fournira. Rien n'est inventé pour
 * remplir la page, conformément à la règle du projet.
 *
 * Les capacités et fréquentations sont des ORDRES DE GRANDEUR annoncés
 * par les organisateurs. Elles situent un événement, elles ne servent à
 * établir aucun classement.
 *
 * La liste est volontairement ouverte : elle donne un point de départ,
 * et les contributeurs l'étendent pays par pays.
 */

export type SeedVenue = {
  name: string;
  slug: string;
  kind: "festival" | "venue";
  /** ISO 3166-1 alpha-2. */
  countryCode: string;
  city?: string;
  foundedYear?: number;
  /** Renseignée seulement si le lieu a définitivement cessé. */
  endedYear?: number;
  websiteUrl?: string;
  capacity?: number;
  description?: string;
};

export const VENUES: SeedVenue[] = [
  // --- Allemagne ---
  {
    name: "Wacken Open Air",
    slug: "wacken-open-air",
    kind: "festival",
    countryCode: "DE",
    city: "Wacken",
    foundedYear: 1990,
    websiteUrl: "https://www.wacken.com",
    capacity: 85000,
    description:
      "Né dans un village du Schleswig-Holstein, devenu le rendez-vous metal le plus fréquenté d'Europe. Les billets partent souvent avant l'annonce de la programmation.",
  },
  {
    name: "Summer Breeze Open Air",
    slug: "summer-breeze-open-air",
    kind: "festival",
    countryCode: "DE",
    city: "Dinkelsbühl",
    foundedYear: 1997,
    websiteUrl: "https://www.summer-breeze.de",
    capacity: 45000,
  },
  {
    name: "Rock Hard Festival",
    slug: "rock-hard-festival",
    kind: "festival",
    countryCode: "DE",
    city: "Gelsenkirchen",
    foundedYear: 2003,
    websiteUrl: "https://www.rockhard.de",
    capacity: 8000,
    description:
      "Organisé par le magazine du même nom dans le parc Amphitheater, réputé pour une programmation resserrée et sans seconde scène.",
  },
  {
    name: "Party.San Metal Open Air",
    slug: "party-san-metal-open-air",
    kind: "festival",
    countryCode: "DE",
    city: "Schlotheim",
    foundedYear: 1996,
    websiteUrl: "https://www.party-san.de",
    capacity: 12000,
    description:
      "Orienté death et black metal, sur un ancien aérodrome de Thuringe.",
  },

  // --- France ---
  {
    name: "Hellfest",
    slug: "hellfest",
    kind: "festival",
    countryCode: "FR",
    city: "Clisson",
    foundedYear: 2006,
    websiteUrl: "https://www.hellfest.fr",
    capacity: 60000,
    description:
      "Installé dans le vignoble nantais, il a fait de Clisson une destination annuelle pour toutes les branches du metal, de la plus mélodique à la plus extrême.",
  },
  {
    name: "Motocultor Festival",
    slug: "motocultor-festival",
    kind: "festival",
    countryCode: "FR",
    city: "Carhaix-Plouguer",
    foundedYear: 2010,
    websiteUrl: "https://www.motocultor-festival.com",
    capacity: 30000,
  },
  {
    name: "Le Klub",
    slug: "le-klub",
    kind: "venue",
    countryCode: "FR",
    city: "Paris",
    capacity: 300,
    description:
      "Petite salle du centre de Paris, l'une des rares à programmer du metal extrême toute l'année.",
  },
  {
    name: "La Machine du Moulin Rouge",
    slug: "la-machine-du-moulin-rouge",
    kind: "venue",
    countryCode: "FR",
    city: "Paris",
    websiteUrl: "https://www.lamachinedumoulinrouge.com",
    capacity: 1200,
  },

  // --- Pays-Bas et Belgique ---
  {
    name: "Roadburn Festival",
    slug: "roadburn-festival",
    kind: "festival",
    countryCode: "NL",
    city: "Tilburg",
    foundedYear: 1999,
    websiteUrl: "https://www.roadburn.com",
    capacity: 3500,
    description:
      "Doom, sludge et musiques lourdes expérimentales. Réputé pour ses commandes de créations jouées une seule fois.",
  },
  {
    name: "Dynamo Metalfest",
    slug: "dynamo-metalfest",
    kind: "festival",
    countryCode: "NL",
    city: "Eindhoven",
    foundedYear: 2015,
    websiteUrl: "https://www.dynamometalfest.nl",
  },
  {
    name: "Graspop Metal Meeting",
    slug: "graspop-metal-meeting",
    kind: "festival",
    countryCode: "BE",
    city: "Dessel",
    foundedYear: 1986,
    websiteUrl: "https://www.graspop.be",
    capacity: 50000,
  },
  {
    name: "Durbuy Rock",
    slug: "durbuy-rock",
    kind: "festival",
    countryCode: "BE",
    city: "Durbuy",
    foundedYear: 1988,
    websiteUrl: "https://www.durbuyrock.be",
  },

  // --- Pays nordiques ---
  {
    name: "Inferno Metal Festival",
    slug: "inferno-metal-festival",
    kind: "festival",
    countryCode: "NO",
    city: "Oslo",
    foundedYear: 2001,
    websiteUrl: "https://www.infernofestival.net",
    capacity: 3000,
    description:
      "Rendez-vous du black metal norvégien pendant le week-end de Pâques, dans plusieurs salles d'Oslo.",
  },
  {
    name: "Beyond the Gates",
    slug: "beyond-the-gates",
    kind: "festival",
    countryCode: "NO",
    city: "Bergen",
    foundedYear: 2013,
    websiteUrl: "https://www.beyondthegates.no",
  },
  {
    name: "Rockefeller Music Hall",
    slug: "rockefeller-music-hall",
    kind: "venue",
    countryCode: "NO",
    city: "Oslo",
    foundedYear: 1986,
    websiteUrl: "https://rockefeller.no",
    capacity: 1350,
  },
  {
    name: "Sweden Rock Festival",
    slug: "sweden-rock-festival",
    kind: "festival",
    countryCode: "SE",
    city: "Sölvesborg",
    foundedYear: 1992,
    websiteUrl: "https://www.swedenrock.com",
    capacity: 35000,
  },
  {
    name: "Gefle Metal Festival",
    slug: "gefle-metal-festival",
    kind: "festival",
    countryCode: "SE",
    city: "Gävle",
    foundedYear: 2016,
  },
  {
    name: "Tuska Open Air",
    slug: "tuska-open-air",
    kind: "festival",
    countryCode: "FI",
    city: "Helsinki",
    foundedYear: 1998,
    websiteUrl: "https://www.tuska.fi",
    capacity: 40000,
    description:
      "En plein centre d'Helsinki, sur l'ancien site industriel de Suvilahti.",
  },
  {
    name: "Nummirock",
    slug: "nummirock",
    kind: "festival",
    countryCode: "FI",
    city: "Kauhajoki",
    foundedYear: 1987,
    websiteUrl: "https://www.nummirock.fi",
  },
  {
    name: "Copenhell",
    slug: "copenhell",
    kind: "festival",
    countryCode: "DK",
    city: "Copenhague",
    foundedYear: 2010,
    websiteUrl: "https://www.copenhell.dk",
    capacity: 40000,
  },
  {
    name: "Eistnaflug",
    slug: "eistnaflug",
    kind: "festival",
    countryCode: "IS",
    city: "Neskaupstaður",
    foundedYear: 2005,
    description:
      "Dans un fjord de l'est islandais, à onze heures de route de Reykjavík.",
  },

  // --- Royaume-Uni et Irlande ---
  {
    name: "Bloodstock Open Air",
    slug: "bloodstock-open-air",
    kind: "festival",
    countryCode: "GB",
    city: "Walton-on-Trent",
    foundedYear: 2001,
    websiteUrl: "https://www.bloodstock.uk.com",
    capacity: 20000,
  },
  {
    name: "Damnation Festival",
    slug: "damnation-festival",
    kind: "festival",
    countryCode: "GB",
    city: "Manchester",
    foundedYear: 2005,
    websiteUrl: "https://www.damnationfestival.co.uk",
  },
  {
    name: "The Underworld Camden",
    slug: "the-underworld-camden",
    kind: "venue",
    countryCode: "GB",
    city: "Londres",
    foundedYear: 1994,
    websiteUrl: "https://www.theunderworldcamden.co.uk",
    capacity: 500,
    description:
      "Sous le Worlds End de Camden : passage obligé des tournées metal à Londres depuis trente ans.",
  },

  // --- Europe centrale et du Sud ---
  {
    name: "Brutal Assault",
    slug: "brutal-assault",
    kind: "festival",
    countryCode: "CZ",
    city: "Jaroměř",
    foundedYear: 1996,
    websiteUrl: "https://www.brutalassault.cz",
    capacity: 20000,
    description:
      "Dans la forteresse militaire de Josefov, dont les casemates servent de scènes.",
  },
  {
    name: "Mystic Festival",
    slug: "mystic-festival",
    kind: "festival",
    countryCode: "PL",
    city: "Gdańsk",
    foundedYear: 2019,
    websiteUrl: "https://mysticfestival.pl",
  },
  {
    name: "Metaldays",
    slug: "metaldays",
    kind: "festival",
    countryCode: "SI",
    city: "Velenje",
    foundedYear: 2013,
    websiteUrl: "https://www.metaldays.net",
  },
  {
    name: "Resurrection Fest",
    slug: "resurrection-fest",
    kind: "festival",
    countryCode: "ES",
    city: "Viveiro",
    foundedYear: 2006,
    websiteUrl: "https://www.resurrectionfest.es",
    capacity: 40000,
  },
  {
    name: "VOA Heavy Rock Festival",
    slug: "voa-heavy-rock-festival",
    kind: "festival",
    countryCode: "ES",
    city: "Madrid",
    foundedYear: 2019,
  },
  {
    name: "Vagos Metal Fest",
    slug: "vagos-metal-fest",
    kind: "festival",
    countryCode: "PT",
    city: "Vagos",
    foundedYear: 2012,
    websiteUrl: "https://www.vagosmetalfest.com",
  },

  // --- Amériques ---
  {
    name: "Maryland Deathfest",
    slug: "maryland-deathfest",
    kind: "festival",
    countryCode: "US",
    city: "Baltimore",
    foundedYear: 2003,
    websiteUrl: "https://www.marylanddeathfest.com",
    description:
      "Le rendez-vous nord-américain du death metal et du grindcore, réparti entre plusieurs salles de Baltimore.",
  },
  {
    name: "Psycho Las Vegas",
    slug: "psycho-las-vegas",
    kind: "festival",
    countryCode: "US",
    city: "Las Vegas",
    foundedYear: 2012,
    websiteUrl: "https://www.vivapsycho.com",
  },
  {
    name: "Saint Vitus Bar",
    slug: "saint-vitus-bar",
    kind: "venue",
    countryCode: "US",
    city: "New York",
    foundedYear: 2011,
    websiteUrl: "https://www.saintvitusbar.com",
    capacity: 250,
  },
  {
    name: "Heavy Montréal",
    slug: "heavy-montreal",
    kind: "festival",
    countryCode: "CA",
    city: "Montréal",
    foundedYear: 2008,
    websiteUrl: "https://www.heavymontreal.com",
  },
  {
    name: "Rock in Rio",
    slug: "rock-in-rio",
    kind: "festival",
    countryCode: "BR",
    city: "Rio de Janeiro",
    foundedYear: 1985,
    websiteUrl: "https://rockinrio.com",
    description:
      "Généraliste, mais dont les éditions ont accueilli les plus grandes affiches metal d'Amérique du Sud.",
  },

  // --- Asie et Océanie ---
  {
    name: "Loud Park",
    slug: "loud-park",
    kind: "festival",
    countryCode: "JP",
    city: "Saitama",
    foundedYear: 2006,
    websiteUrl: "https://www.loudpark.com",
    description:
      "Principal festival metal japonais, en salle, dans la Saitama Super Arena.",
  },
  {
    name: "Wacken Metal Battle Australia",
    slug: "wacken-metal-battle-australia",
    kind: "festival",
    countryCode: "AU",
    city: "Sydney",
    foundedYear: 2011,
  },
];
