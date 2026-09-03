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
    festivals: "Festivals",
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
    contribute: "Contribuer",
    review: "Relecture",
    admin: "Administration",
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
  contributions: {
    howItWorks: "Comment fonctionnent les contributions",
    proposeBand: "Proposer un groupe",
    proposeAnother: "Proposer un autre groupe",
    theBand: "Le groupe",
    slugHint: "Dérivé du nom ; en minuscules et tirets.",
    formedYear: "Année de formation",
    dissolvedYear: "Année de séparation",
    completeEvidence: "Complétez les preuves pour pouvoir soumettre.",
    verifiableLink: "Lien vérifiable",
    removeEvidence: "Retirer cette preuve",
    addEvidence: "Ajouter une preuve",
    evidenceNote: "Ce que cette source atteste",
    loadFailed: "Impossible de charger vos dossiers.",
    moderatorRequest: "Demande du modérateur",
    seePublished: "Voir la fiche publiée",
    evidenceComplement: "Ces preuves complètent celles déjà fournies.",
    replyWithEvidence: "Répondre avec des preuves",
    queueLoadFailed: "Impossible de charger la file de relecture.",
    whatIsMissing: "Ce qui manque (visible par le contributeur)",
    requestEvidence: "Demander des preuves",
    rejectDefinitively: "Rejeter définitivement",
    nothingToReview: "Rien à relire",
    contributorRequired: "Rôle contributeur requis",
    moderatorRequired: "Rôle modérateur requis",
    whyRequired: "Pourquoi cette exigence",
  },
  app: {
    community: "Communauté",
    manageAccounts: "Gérer les comptes",
    adminRequired: "Rôle administrateur requis",
    keyFigures: "Chiffres clés",
    allRoles: "Tous les rôles",
    accountsLoadFailed: "Impossible de charger les comptes.",
    previous: "Précédent",
    next: "Suivant",
    confirmDeletion: "Confirmer la suppression",
    profileLoadFailed: "Impossible de charger votre profil.",
    displayName: "Nom affiché",
    displayNameHint: "Ce nom apparaît comme auteur de vos contributions.",
    profileSaved: "Profil enregistré.",
    mutedByDefault: "Couper le son par défaut",
    yourRating: "Votre note",
    appearsOn: "Présent sur",
    noBandInGenre: "Aucun groupe dans ce genre",
    noMemberListed: "Aucun membre référencé",
    noBandListed: "Aucun groupe référencé",
    noReleaseListed: "Aucune sortie référencée",
    pageNotFound: "Cette page n'existe pas ou plus.",
    backHome: "Retour à l'accueil",
    loadingAlbum: "Chargement de la fiche de l'album…",
    playVideo: "Lire la vidéo",
    videoThumbnail: "Miniature de la vidéo",
    searchEverything: "Rechercher un groupe, un album, une piste…",
    escape: "Échap",
    goToSignIn: "Aller à la connexion",
  },
  account: {
    signInSubtitle: "Pour contribuer, noter les albums et tenir votre liste.",
    signUpTitle: "Créer un compte",
    signUpSubtitle:
      "Une contribution vaut par ses sources : chaque fiche proposée demande des preuves vérifiables.",
    forgotTitle: "Mot de passe oublié",
    forgotSubtitle:
      "Indiquez votre adresse : si un compte existe, vous recevrez un lien valable une heure.",
    forgotLink: "Mot de passe oublié ?",
    backToSignIn: "Retour à la connexion",
    askAgain: "Refaites une demande",
    resetTitle: "Nouveau mot de passe",
    resetSubtitle:
      "Choisissez un mot de passe long : le générateur en produit un valide.",
    noAccount: "Pas encore de compte ?",
    alreadyRegistered: "Déjà inscrit ?",
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
