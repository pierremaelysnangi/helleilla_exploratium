/**
 * Dictionnaire de référence — français.
 *
 * C'est ce fichier qui définit les clés : toute autre langue en est une
 * traduction, et son type est dérivé d'ici. Ajouter une clé ailleurs
 * sans l'ajouter d'abord ici est refusé à la compilation.
 *
 * Ne contient QUE des textes d'interface. Le contenu encyclopédique —
 * biographies, noms de genres, titres — n'est pas traduit : il est
 * contribué, et « Black Metal » ne se traduit pas.
 */

export const fr = {
  nav: {
    home: "Accueil",
    bands: "Groupes",
    albums: "Albums",
    genres: "Genres",
    search: "Recherche",
    openMenu: "Ouvrir le menu",
    closeMenu: "Fermer le menu",
    mainNavigation: "Navigation principale",
    language: "Langue",
    chooseLanguage: "Choisir la langue",
  },
  auth: {
    signIn: "Connexion",
    signUp: "Inscription",
    signOut: "Déconnexion",
    myContributions: "Mes contributions",
  },
  home: {
    tagline:
      "Bienvenue sur l'encyclopédie collaborative, gratuite, modernisée et intuitive sur la musique metal ! Bonne exploration à tous",
    explore: "Explorer le catalogue",
    shortcutHint: "Astuce : {keys} pour la recherche rapide",
    recentBands: "Derniers groupes ajoutés",
    recentAlbums: "Dernières sorties référencées",
    topRated: "Les mieux notés",
  },
  band: {
    country: "Pays",
    activity: "Activité",
    active: "actif",
    disbanded: "séparé",
    members: "Membres",
    formerMembers: "Anciens membres",
    themes: "Thèmes",
    genres: "Genres",
    gallery: "Galerie",
    officialLinks: "Liens officiels",
    discography: "Discographie",
    noReleases: "Aucune sortie référencée.",
    photoCredit: "Photo de {band}",
    logoCredit: "Logo de {band}",
    by: "par",
    viewSource: "Voir la source",
    close: "Fermer",
    enlarge: "Agrandir",
    galleryNotice:
      "Ces photos illustrent une fiche encyclopédique. Elles restent chez leurs auteurs, et rien n'est vendu ni monétisé ici.",
  },
  album: {
    tracklist: "Tracklist",
    totalDuration: "Durée totale",
    tracks: "pistes",
    track: "piste",
    noTracks: "Aucune piste référencée pour cette sortie.",
    reviews: "Critiques",
    press: "Presse",
    listeners: "Auditeurs",
    noPressReview: "Personne n'a encore ajouté de critique pour cet album.",
    noRating: "Aucune note pour l'instant",
    listenAt: "Écouter chez le diffuseur",
    lyrics: "Paroles",
    linksFor: "Liens pour {track}",
  },
  releaseType: {
    album: "Album",
    ep: "EP",
    single: "Single",
    compilation: "Compilation",
    live: "Live",
    demo: "Démo",
    split: "Split",
  },
  releaseSection: {
    album: "Albums studio",
    ep: "EP",
    single: "Singles",
    compilation: "Compilations",
    live: "Live",
    demo: "Démos",
    split: "Splits",
  },
  catalogue: {
    allGenres: "Tous les genres",
    filterByGenre: "Filtrer par genre",
    searchBand: "Rechercher un groupe…",
    searchAlbum: "Rechercher un album…",
    searchPlaceholder: "Groupes, albums, pistes…",
    sortBy: "Trier par",
    newest: "Plus récents",
    name: "Nom",
    year: "Année",
    ascending: "Croissant",
    descending: "Décroissant",
    loading: "Chargement…",
    noResult: "Aucun résultat.",
    releases: "sorties",
    release: "sortie",
  },
  search: {
    title: "Recherche",
    prompt:
      "Saisissez un terme pour lancer la recherche dans les groupes, albums et pistes.",
    noResultFor: "Aucun résultat pour « {term} ».",
    searching: "Recherche…",
    refreshing: "Actualisation…",
  },
  common: {
    error: "Une erreur est survenue.",
    retry: "Réessayer",
    unavailable: "Momentanément indisponible.",
    noVisual: "Aucun visuel disponible pour {name}",
    noCoverFor: "Aucune pochette pour {title} — visuel de {band}",
    coverOf: "Pochette de {title}",
  },
  footer: {
    about: "À propos",
    credits: "Crédits et droits",
    explore: "Explorer",
    participate: "Participer",
    project: "Le projet",
    proposeEntry: "Proposer une fiche",
    createAccount: "Créer un compte",
    intro:
      "Une encyclopédie du metal écrite par ceux qui l'écoutent. Groupes, discographies, genres — et de quoi remonter à la source de chaque information.",
    rights:
      "Pochettes et photos appartiennent à leurs auteurs et à leurs ayants droit. Rien n'est hébergé ici : tout est affiché depuis sa source d'origine, à titre d'illustration.",
    noMonetisation: "Projet sans publicité, sans abonnement et sans revenus.",
    sourcesAndRights: "Sources et droits",
  },
} as const;

/**
 * Forme d'un dictionnaire : celle du français, qui fait référence.
 *
 * Les valeurs sont ÉLARGIES en `string`. Sans cela, le `as const`
 * ci-dessus donnerait à chaque entrée le type de son texte français
 * exact, et une traduction anglaise serait refusée pour ne pas valoir
 * « Accueil ». Seules les CLÉS doivent être contraintes : oublier une
 * traduction, ou en inventer une, reste une erreur de compilation.
 */
export type Dictionary = {
  [Section in keyof typeof fr]: {
    [Key in keyof (typeof fr)[Section]]: string;
  };
};
