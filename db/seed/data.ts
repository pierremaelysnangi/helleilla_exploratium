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
 * Taxonomie metal complète : familles racines et sous-genres établis.
 *
 * Sert de vocabulaire commun à tout le catalogue — filtres, recherche à
 * facettes et rattachement des groupes. Une taxonomie trop courte force
 * les contributeurs à ranger un groupe dans une famille approximative,
 * et rend le filtre par genre inutile.
 *
 * Les libellés suivent l'usage anglophone consacré (le nom des genres
 * n'est pas traduit : « Black Metal » n'a pas d'équivalent français
 * établi), et la hiérarchie reste à deux niveaux, comme le modèle de
 * données (`genres.parent_id`).
 */
export const GENRES: SeedGenre[] = [
  { name: "Heavy Metal", slug: "heavy-metal" },
  { name: "Thrash Metal", slug: "thrash-metal" },
  { name: "Death Metal", slug: "death-metal" },
  { name: "Black Metal", slug: "black-metal" },
  { name: "Doom Metal", slug: "doom-metal" },
  { name: "Gothic Metal", slug: "gothic-metal" },
  { name: "Progressive Metal", slug: "progressive-metal" },
  { name: "Folk Metal", slug: "folk-metal" },
  { name: "Grindcore", slug: "grindcore" },
  { name: "Metalcore", slug: "metalcore" },
  { name: "Industrial Metal", slug: "industrial-metal" },
  { name: "Post-Metal", slug: "post-metal" },
  { name: "NWOBHM", slug: "nwobhm", parent: "heavy-metal" },
  { name: "Speed Metal", slug: "speed-metal", parent: "heavy-metal" },
  { name: "Power Metal", slug: "power-metal", parent: "heavy-metal" },
  {
    name: "Symphonic Power Metal",
    slug: "symphonic-power-metal",
    parent: "heavy-metal",
  },
  { name: "Epic Metal", slug: "epic-metal", parent: "heavy-metal" },
  { name: "Traditional Doom", slug: "traditional-doom", parent: "heavy-metal" },
  { name: "Bay Area Thrash", slug: "bay-area-thrash", parent: "thrash-metal" },
  { name: "Teutonic Thrash", slug: "teutonic-thrash", parent: "thrash-metal" },
  {
    name: "Crossover Thrash",
    slug: "crossover-thrash",
    parent: "thrash-metal",
  },
  {
    name: "Technical Thrash",
    slug: "technical-thrash",
    parent: "thrash-metal",
  },
  {
    name: "Blackened Thrash",
    slug: "blackened-thrash",
    parent: "thrash-metal",
  },
  { name: "Groove Metal", slug: "groove-metal", parent: "thrash-metal" },
  {
    name: "Melodic Death Metal",
    slug: "melodic-death-metal",
    parent: "death-metal",
  },
  {
    name: "Technical Death Metal",
    slug: "technical-death-metal",
    parent: "death-metal",
  },
  {
    name: "Brutal Death Metal",
    slug: "brutal-death-metal",
    parent: "death-metal",
  },
  {
    name: "Old School Death Metal",
    slug: "old-school-death-metal",
    parent: "death-metal",
  },
  {
    name: "Blackened Death Metal",
    slug: "blackened-death-metal",
    parent: "death-metal",
  },
  {
    name: "Dissonant Death Metal",
    slug: "dissonant-death-metal",
    parent: "death-metal",
  },
  { name: "Death 'n' Roll", slug: "death-n-roll", parent: "death-metal" },
  { name: "Slam Death Metal", slug: "slam-death-metal", parent: "death-metal" },
  { name: "Deathgrind", slug: "deathgrind", parent: "death-metal" },
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
    name: "Depressive Black Metal",
    slug: "depressive-black-metal",
    parent: "black-metal",
  },
  { name: "Raw Black Metal", slug: "raw-black-metal", parent: "black-metal" },
  {
    name: "Melodic Black Metal",
    slug: "melodic-black-metal",
    parent: "black-metal",
  },
  { name: "Post-Black Metal", slug: "post-black-metal", parent: "black-metal" },
  { name: "Blackgaze", slug: "blackgaze", parent: "black-metal" },
  { name: "War Metal", slug: "war-metal", parent: "black-metal" },
  {
    name: "Pagan Black Metal",
    slug: "pagan-black-metal",
    parent: "black-metal",
  },
  { name: "Viking Metal", slug: "viking-metal", parent: "black-metal" },
  { name: "Death-Doom", slug: "death-doom", parent: "doom-metal" },
  { name: "Funeral Doom", slug: "funeral-doom", parent: "doom-metal" },
  { name: "Stoner Doom", slug: "stoner-doom", parent: "doom-metal" },
  { name: "Sludge Metal", slug: "sludge-metal", parent: "doom-metal" },
  { name: "Drone Metal", slug: "drone-metal", parent: "doom-metal" },
  { name: "Gothic Doom", slug: "gothic-doom", parent: "doom-metal" },
  { name: "Epic Doom", slug: "epic-doom", parent: "doom-metal" },
  {
    name: "Symphonic Gothic Metal",
    slug: "symphonic-gothic-metal",
    parent: "gothic-metal",
  },
  { name: "Gothic Rock", slug: "gothic-rock", parent: "gothic-metal" },
  {
    name: "Technical Progressive Metal",
    slug: "technical-progressive-metal",
    parent: "progressive-metal",
  },
  {
    name: "Avant-garde Metal",
    slug: "avant-garde-metal",
    parent: "progressive-metal",
  },
  { name: "Djent", slug: "djent", parent: "progressive-metal" },
  {
    name: "Atmospheric Sludge",
    slug: "atmospheric-sludge",
    parent: "progressive-metal",
  },
  { name: "Celtic Metal", slug: "celtic-metal", parent: "folk-metal" },
  { name: "Medieval Metal", slug: "medieval-metal", parent: "folk-metal" },
  { name: "Oriental Metal", slug: "oriental-metal", parent: "folk-metal" },
  { name: "Goregrind", slug: "goregrind", parent: "grindcore" },
  { name: "Cybergrind", slug: "cybergrind", parent: "grindcore" },
  { name: "Powerviolence", slug: "powerviolence", parent: "grindcore" },
  { name: "Melodic Metalcore", slug: "melodic-metalcore", parent: "metalcore" },
  { name: "Mathcore", slug: "mathcore", parent: "metalcore" },
  { name: "Deathcore", slug: "deathcore", parent: "metalcore" },
  {
    name: "Industrial Black Metal",
    slug: "industrial-black-metal",
    parent: "industrial-metal",
  },
  { name: "Cyber Metal", slug: "cyber-metal", parent: "industrial-metal" },
  {
    name: "Atmospheric Post-Metal",
    slug: "atmospheric-post-metal",
    parent: "post-metal",
  },
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
  type: "album" | "ep" | "single" | "compilation" | "live" | "demo" | "split";
  releaseYear: number;
  /** Slug du label éditeur, s'il figure dans LABELS. */
  label?: string;
  /**
   * Genres PROPRES à cette sortie, quand ils diffèrent de ceux du groupe.
   *
   * Un groupe évolue : « Soulside Journey » est du death metal alors que
   * Darkthrone est un groupe de black metal. Sans cette qualification,
   * filtrer sur « death metal » remontait toute sa discographie.
   *
   * Facultatif : une sortie sans genre propre hérite de son groupe.
   */
  genres?: string[];
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
  /**
   * Traductions de la biographie, par code de langue.
   *
   * Écrites à la main, langue par langue, à partir du texte français :
   * une biographie est du contenu encyclopédique, et la règle du projet
   * interdit d'en confier la production à une machine.
   */
  bioTranslations: Record<string, string>;
  /** Thèmes des textes, documentés publiquement pour chacun de ces groupes. */
  themes: string[];
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
    bioTranslations: {
      en: "Norwegian band formed in Notodden, a leading figure of the second wave of black metal. Its fusion of symphonic arrangements and black metal left a lasting mark on the genre.",
      de: "Norwegische Band aus Notodden, eine der prägenden Gestalten der zweiten Black-Metal-Welle. Ihre Verbindung sinfonischer Arrangements mit Black Metal hat das Genre dauerhaft geprägt.",
      es: "Grupo noruego formado en Notodden, figura mayor de la segunda oleada del black metal. Su fusión de arreglos sinfónicos y black metal marcó el género de forma duradera.",
      pt: "Banda norueguesa formada em Notodden, figura maior da segunda vaga do black metal. A sua fusão de arranjos sinfónicos com black metal marcou o género de forma duradoura.",
      it: "Gruppo norvegese formatosi a Notodden, figura di primo piano della seconda ondata del black metal. La sua fusione di arrangiamenti sinfonici e black metal ha segnato il genere in modo duraturo.",
      nl: "Noorse band uit Notodden, een van de bepalende namen van de tweede blackmetalgolf. De versmelting van symfonische arrangementen met black metal heeft het genre blijvend getekend.",
      sv: "Norskt band bildat i Notodden, en av den andra black metal-vågens tongivande gestalter. Sammansmältningen av symfoniska arrangemang och black metal satte varaktiga spår i genren.",
      nb: "Norsk band stiftet i Notodden, en av de sentrale skikkelsene i black metalens andre bølge. Sammensmeltningen av symfoniske arrangementer og black metal satte varige spor i sjangeren.",
      fi: "Notoddenissa perustettu norjalainen yhtye, black metalin toisen aallon keskeisiä nimiä. Sinfonisten sovitusten ja black metalin yhdistelmä jätti genreen pysyvän jäljen.",
      pl: "Norweski zespół założony w Notodden, jedna z czołowych postaci drugiej fali black metalu. Połączenie symfonicznych aranżacji z black metalem trwale odcisnęło się na gatunku.",
      ru: "Норвежская группа из Нотоддена, одна из ключевых фигур второй волны блэк-метала. Соединение симфонических аранжировок с блэк-металом надолго определило облик жанра.",
      ja: "ノトデン出身のノルウェーのバンド。ブラックメタル第二波を代表する存在。交響的なアレンジとブラックメタルの融合はジャンルに長く残る刻印を残した。",
      zh: "来自诺托登的挪威乐队，黑金属第二波浪潮的代表之一。将交响编曲与黑金属结合的做法，为这一流派留下了长久的印记。",
      ar: "فرقة نرويجية تأسّست في نوتودن، وهي من أبرز وجوه الموجة الثانية للبلاك ميتال. مزجها التوزيعات السيمفونية بالبلاك ميتال ترك أثرًا دائمًا في هذا النوع.",
    },
    themes: ["Occultisme", "Mythologie nordique", "Nature", "Philosophie"],
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
    bioTranslations: {
      en: "Norwegian band from Kolbotn, first oriented towards death metal before turning to a deliberately raw black metal. The Nocturno Culto / Fenriz duo has been its core since 1991.",
      de: "Norwegische Band aus Kolbotn, zunächst dem Death Metal zugewandt, dann einem bewusst rohen Black Metal. Das Duo Nocturno Culto / Fenriz bildet seit 1991 den Kern.",
      es: "Grupo noruego de Kolbotn, orientado primero al death metal antes de virar hacia un black metal deliberadamente crudo. El dúo Nocturno Culto / Fenriz es su núcleo desde 1991.",
      pt: "Banda norueguesa de Kolbotn, primeiro voltada para o death metal antes de virar para um black metal deliberadamente cru. O duo Nocturno Culto / Fenriz é o seu núcleo desde 1991.",
      it: "Gruppo norvegese di Kolbotn, dapprima orientato al death metal prima di virare verso un black metal volutamente grezzo. Il duo Nocturno Culto / Fenriz ne è il nucleo dal 1991.",
      nl: "Noorse band uit Kolbotn, eerst gericht op death metal en daarna op een bewust rauwe black metal. Het duo Nocturno Culto / Fenriz vormt sinds 1991 de kern.",
      sv: "Norskt band från Kolbotn, först inriktat på death metal innan det svängde mot en medvetet rå black metal. Duon Nocturno Culto / Fenriz har varit kärnan sedan 1991.",
      nb: "Norsk band fra Kolbotn, først rettet mot death metal før det svingte mot en bevisst rå black metal. Duoen Nocturno Culto / Fenriz har utgjort kjernen siden 1991.",
      fi: "Kolbotnista kotoisin oleva norjalainen yhtye, aluksi death metalia ja sittemmin tarkoituksellisen raakaa black metalia. Kaksikko Nocturno Culto / Fenriz on ollut ytimenä vuodesta 1991.",
      pl: "Norweski zespół z Kolbotn, początkowo grający death metal, później celowo surowy black metal. Duet Nocturno Culto / Fenriz stanowi jego trzon od 1991 roku.",
      ru: "Норвежская группа из Колботна, начинавшая с дэт-метала и перешедшая к нарочито сырому блэк-металу. Дуэт Nocturno Culto / Fenriz составляет её ядро с 1991 года.",
      ja: "コルボトン出身のノルウェーのバンド。当初はデスメタル寄りだったが、意図的に荒いブラックメタルへ転じた。1991年以降は Nocturno Culto と Fenriz の二人が核。",
      zh: "来自科尔博滕的挪威乐队，早期偏向死亡金属，后转向刻意粗粝的黑金属。自 1991 年起，Nocturno Culto 与 Fenriz 二人组即为核心。",
      ar: "فرقة نرويجية من كولبوتن، اتّجهت أولًا إلى الديث ميتال ثم انتقلت إلى بلاك ميتال خشن عن قصد. ويشكّل الثنائي Nocturno Culto وFenriz نواتها منذ 1991.",
    },
    themes: ["Misanthropie", "Hiver", "Satanisme", "Contre-culture"],
    genres: ["black-metal"],
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
        // Seul album de death metal du groupe, avant son virage black
        genres: ["death-metal", "old-school-death-metal"],
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
    bioTranslations: {
      en: "English band from Halifax, one of the three pillars of British death-doom alongside Paradise Lost and Anathema. Violin and clean vocals sit next to slow tempos and melancholy lyrics.",
      de: "Englische Band aus Halifax, eine der drei Säulen des britischen Death-Doom neben Paradise Lost und Anathema. Violine und klarer Gesang treffen dort auf langsame Tempi und schwermütige Texte.",
      es: "Grupo inglés de Halifax, uno de los tres pilares del death-doom británico junto a Paradise Lost y Anathema. El violín y la voz limpia conviven con tempos lentos y letras melancólicas.",
      pt: "Banda inglesa de Halifax, um dos três pilares do death-doom britânico ao lado dos Paradise Lost e dos Anathema. Violino e voz limpa convivem com andamentos lentos e letras melancólicas.",
      it: "Gruppo inglese di Halifax, uno dei tre pilastri del death-doom britannico insieme a Paradise Lost e Anathema. Violino e voce pulita convivono con tempi lenti e testi malinconici.",
      nl: "Engelse band uit Halifax, een van de drie pijlers van de Britse death-doom naast Paradise Lost en Anathema. Viool en cleane zang gaan er samen met trage tempo's en melancholische teksten.",
      sv: "Engelskt band från Halifax, en av den brittiska death-doomens tre grundpelare vid sidan av Paradise Lost och Anathema. Fiol och ren sång möter långsamma tempon och melankoliska texter.",
      nb: "Engelsk band fra Halifax, en av de tre bærebjelkene i britisk death-doom ved siden av Paradise Lost og Anathema. Fiolin og ren sang møter langsomme tempi og melankolske tekster.",
      fi: "Halifaxista kotoisin oleva englantilainen yhtye, brittiläisen death-doomin kolmas tukipylväs Paradise Lostin ja Anatheman rinnalla. Viulu ja puhdas laulu kohtaavat hitaat tempot ja melankoliset sanoitukset.",
      pl: "Angielski zespół z Halifaksu, jeden z trzech filarów brytyjskiego death-doomu obok Paradise Lost i Anathemy. Skrzypce i czysty wokal sąsiadują tam z powolnymi tempami i melancholijnymi tekstami.",
      ru: "Английская группа из Галифакса, один из трёх столпов британского дэт-дума наряду с Paradise Lost и Anathema. Скрипка и чистый вокал соседствуют здесь с медленными темпами и меланхоличными текстами.",
      ja: "ハリファックス出身のイングランドのバンド。Paradise Lost、Anathema と並ぶ英国デス・ドゥームの三本柱の一つ。ヴァイオリンとクリーンヴォーカルが、遅いテンポと憂いを帯びた詞に寄り添う。",
      zh: "来自哈利法克斯的英格兰乐队，与 Paradise Lost、Anathema 并称英国死亡末日金属的三大支柱。小提琴与清嗓和缓慢的节奏、忧郁的歌词并行。",
      ar: "فرقة إنجليزية من هاليفاكس، وأحد أعمدة الديث-دووم البريطاني الثلاثة إلى جانب Paradise Lost وAnathema. يلتقي فيها الكمان والغناء الصافي بإيقاعات بطيئة ونصوص كئيبة.",
    },
    themes: ["Deuil", "Amour perdu", "Religion", "Mélancolie"],
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
    bioTranslations: {
      en: "Swedish band from Gothenburg, whose album Slaughter of the Soul defined the melodic death metal known as the “Gothenburg sound” and shaped a whole generation of bands.",
      de: "Schwedische Band aus Göteborg, deren Album Slaughter of the Soul den melodischen Death Metal des sogenannten Göteborg-Sounds prägte und eine ganze Generation von Bands beeinflusste.",
      es: "Grupo sueco de Gotemburgo, cuyo álbum Slaughter of the Soul definió el death metal melódico llamado «sonido de Gotemburgo» e influyó en toda una generación de grupos.",
      pt: "Banda sueca de Gotemburgo, cujo álbum Slaughter of the Soul definiu o death metal melódico dito «som de Gotemburgo» e influenciou uma geração inteira de bandas.",
      it: "Gruppo svedese di Göteborg, il cui album Slaughter of the Soul ha definito il death metal melodico detto «suono di Göteborg» e influenzato un'intera generazione di gruppi.",
      nl: "Zweedse band uit Göteborg, wiens album Slaughter of the Soul de melodieuze death metal van de zogeheten Göteborg-sound bepaalde en een hele generatie bands beïnvloedde.",
      sv: "Svenskt band från Göteborg vars album Slaughter of the Soul definierade den melodiska death metal som kallas göteborgssoundet och präglade en hel generation band.",
      nb: "Svensk band fra Göteborg, hvis album Slaughter of the Soul definerte den melodiske death metalen kalt Gøteborg-lyden og preget en hel generasjon band.",
      fi: "Göteborgista kotoisin oleva ruotsalainen yhtye, jonka albumi Slaughter of the Soul määritteli Göteborgin soundiksi kutsutun melodisen death metalin ja vaikutti kokonaiseen yhtyesukupolveen.",
      pl: "Szwedzki zespół z Göteborga, którego album Slaughter of the Soul zdefiniował melodyjny death metal zwany brzmieniem göteborskim i ukształtował całe pokolenie zespołów.",
      ru: "Шведская группа из Гётеборга, чей альбом Slaughter of the Soul определил мелодичный дэт-метал, известный как «гётеборгское звучание», и повлиял на целое поколение групп.",
      ja: "ヨーテボリ出身のスウェーデンのバンド。アルバム Slaughter of the Soul は「ヨーテボリ・サウンド」と呼ばれるメロディック・デスメタルを決定づけ、一世代分のバンドに影響を与えた。",
      zh: "来自哥德堡的瑞典乐队，其专辑 Slaughter of the Soul 确立了被称作「哥德堡之声」的旋律死亡金属，影响了整整一代乐队。",
      ar: "فرقة سويدية من غوتنبرغ، حدّد ألبومها Slaughter of the Soul ملامح الديث ميتال اللحني المعروف بـ«صوت غوتنبرغ» وأثّر في جيل كامل من الفرق.",
    },
    themes: ["Existentialisme", "Aliénation", "Mort", "Chaos"],
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
    bioTranslations: {
      en: "Swiss band born out of the break-up of Hellhammer. Its experimental take on extreme metal, notably on To Mega Therion, opened the way for European black and death metal.",
      de: "Schweizer Band, hervorgegangen aus der Auflösung von Hellhammer. Ihr experimenteller Zugriff auf extremen Metal, besonders auf To Mega Therion, ebnete dem europäischen Black und Death Metal den Weg.",
      es: "Grupo suizo surgido de la disolución de Hellhammer. Su enfoque experimental del metal extremo, sobre todo en To Mega Therion, abrió el camino al black y al death metal europeos.",
      pt: "Banda suíça nascida da dissolução dos Hellhammer. A sua abordagem experimental do metal extremo, sobretudo em To Mega Therion, abriu caminho ao black e ao death metal europeus.",
      it: "Gruppo svizzero nato dallo scioglimento degli Hellhammer. Il suo approccio sperimentale al metal estremo, in particolare su To Mega Therion, ha aperto la via al black e al death metal europei.",
      nl: "Zwitserse band ontstaan uit de ontbinding van Hellhammer. De experimentele benadering van extreme metal, vooral op To Mega Therion, baande de weg voor Europese black en death metal.",
      sv: "Schweiziskt band som uppstod ur Hellhammers upplösning. Dess experimentella grepp om extrem metal, särskilt på To Mega Therion, banade väg för europeisk black och death metal.",
      nb: "Sveitsisk band som oppsto etter oppløsningen av Hellhammer. Den eksperimentelle tilnærmingen til ekstrem metal, særlig på To Mega Therion, banet vei for europeisk black og death metal.",
      fi: "Sveitsiläinen yhtye, joka syntyi Hellhammerin hajottua. Sen kokeellinen ote äärimetalliin, etenkin levyllä To Mega Therion, raivasi tietä eurooppalaiselle black metalille ja death metalille.",
      pl: "Szwajcarski zespół powstały po rozpadzie Hellhammer. Jego eksperymentalne podejście do metalu ekstremalnego, zwłaszcza na To Mega Therion, otworzyło drogę europejskiemu black i death metalowi.",
      ru: "Швейцарская группа, возникшая после распада Hellhammer. Её экспериментальный подход к экстремальному металу, особенно на To Mega Therion, открыл дорогу европейскому блэк- и дэт-металу.",
      ja: "Hellhammer の解散から生まれたスイスのバンド。とりわけ To Mega Therion における実験的なエクストリーム・メタルの手法が、ヨーロッパのブラックメタルとデスメタルへの道を開いた。",
      zh: "由 Hellhammer 解散后组成的瑞士乐队。其对极端金属的实验性处理，尤以 To Mega Therion 为最，为欧洲的黑金属与死亡金属开辟了道路。",
      ar: "فرقة سويسرية وُلدت من حلّ فرقة Hellhammer. مقاربتها التجريبية للميتال المتطرّف، ولا سيما في To Mega Therion، مهّدت الطريق أمام البلاك والديث ميتال الأوروبيين.",
    },
    themes: ["Mythologie", "Occultisme", "Art", "Décadence"],
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
        // Édition européenne à six titres, souvent décrite comme un
        // mini-LP ; MusicBrainz et l'édition américaine étendue en font
        // un album, ce que retient l'encyclopédie.
        type: "album",
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
    bioTranslations: {
      en: "English band from Halifax, pioneers of death-doom and then of gothic metal. Its album Gothic gave a whole subgenre its name.",
      de: "Englische Band aus Halifax, Wegbereiter des Death-Doom und später des Gothic Metal. Ihr Album Gothic gab einem ganzen Subgenre den Namen.",
      es: "Grupo inglés de Halifax, pionero del death-doom y luego del gothic metal. Su álbum Gothic dio nombre a todo un subgénero.",
      pt: "Banda inglesa de Halifax, pioneira do death-doom e depois do gothic metal. O seu álbum Gothic deu nome a todo um subgénero.",
      it: "Gruppo inglese di Halifax, pioniere del death-doom e poi del gothic metal. Il suo album Gothic ha dato il nome a un intero sottogenere.",
      nl: "Engelse band uit Halifax, pionier van de death-doom en daarna van de gothic metal. Het album Gothic gaf een heel subgenre zijn naam.",
      sv: "Engelskt band från Halifax, pionjärer inom death-doom och därefter gothic metal. Albumet Gothic gav en hel undergenre dess namn.",
      nb: "Engelsk band fra Halifax, pioner innen death-doom og siden gothic metal. Albumet Gothic ga en hel undersjanger navnet sitt.",
      fi: "Halifaxista kotoisin oleva englantilainen yhtye, death-doomin ja sittemmin gothic metalin uranuurtaja. Sen albumi Gothic antoi nimen kokonaiselle alalajille.",
      pl: "Angielski zespół z Halifaksu, pionier death-doomu, a następnie gothic metalu. Jego album Gothic dał nazwę całemu podgatunkowi.",
      ru: "Английская группа из Галифакса, пионеры дэт-дума, а затем готик-метала. Её альбом Gothic дал имя целому поджанру.",
      ja: "ハリファックス出身のイングランドのバンド。デス・ドゥーム、のちにゴシックメタルの先駆者。アルバム Gothic はサブジャンルそのものに名を与えた。",
      zh: "来自哈利法克斯的英格兰乐队，死亡末日金属乃至后来哥特金属的先驱。其专辑 Gothic 为整个子流派命名。",
      ar: "فرقة إنجليزية من هاليفاكس، رائدة الديث-دووم ثم الغوثيك ميتال. وقد منح ألبومها Gothic اسمه لنوع فرعي بأكمله.",
    },
    themes: ["Perte", "Désespoir", "Religion", "Introspection"],
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
