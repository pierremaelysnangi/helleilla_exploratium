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

import type { PluralForms } from "../plural";

export const fr = {
  /**
   * Textes comptés, déclinés selon les catégories de pluriel du CLDR.
   *
   * Le français n'en emploie que deux ; le russe en a quatre, l'arabe
   * six, le japonais aucune. Chaque langue ne déclare que celles qu'elle
   * utilise réellement, `other` servant de repli.
   */
  count: {
    bands: { one: "{n} groupe", other: "{n} groupes" },
    subgenres: { one: "{n} sous-genre", other: "{n} sous-genres" },
    votes: { one: "{n} vote", other: "{n} votes" },
    pressReviews: { one: "{n} critique", other: "{n} critiques" },
    accounts: { one: "{n} compte", other: "{n} comptes" },
    evidence: { one: "{n} preuve", other: "{n} preuves" },
    formerMembers: { one: "{n} ancien membre", other: "{n} anciens membres" },
    venues: { one: "{n} lieu", other: "{n} lieux" },
    countries: { one: "{n} pays", other: "{n} pays" },
    people: { one: "~{n} personne", other: "~{n} personnes" },
    releases: { one: "{n} sortie", other: "{n} sorties" },
    tracks: { one: "{n} piste", other: "{n} pistes" },
    members: { one: "{n} membre", other: "{n} membres" },
    posts: { one: "{n} avis", other: "{n} avis" },
  },
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
    forums: "Forums",
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
    recentAlbums: "Dernières sorties référencées",
    topRated: "Les mieux notés",
    sections: "Sections",
    bandsSection:
      "Catalogue des groupes : pays, périodes d'activité, membres et discographies.",
    albumsSection: "Albums, EP, singles, lives et démos triés par année.",
    genresSection: "La taxonomie complète, du black metal au doom.",
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
    enlarge: "Agrandir",
    galleryNotice:
      "Ces photos illustrent une fiche encyclopédique. Elles restent chez leurs auteurs, et rien n'est vendu ni monétisé ici.",
    period: "{from} – {to}",
    unknownYear: "?",
    ongoing: "…",
    discographyOf: "Discographie de {band}",
    noDiscographyYet:
      "La discographie de {band} n'a pas encore été documentée.",
  },
  album: {
    tracklist: "Tracklist",
    totalDuration: "Durée totale",
    noTracks: "Aucune piste référencée pour cette sortie.",
    reviews: "Critiques",
    press: "Presse",
    listeners: "Auditeurs",
    noPressReview: "Personne n'a encore ajouté de critique pour cet album.",
    noRating: "Aucune note pour l'instant",
    listenAt: "Écouter chez le diffuseur",
    linksFor: "Liens pour {track}",
    pressNotice:
      "Les critiques de presse sont documentées par les contributeurs, avec un lien vers l'article d'origine. Aucun texte n'est reproduit ici.",
    listenersAndCollection: "Critiques et collection",
    yourRatingValue: "votre note : {score}/5",
    sourceNotice:
      "Pochette et informations proviennent des sources référencées pour ce groupe. {link}.",
    seeBandPage: "Voir la fiche de {band}",
    ambiguousTitle: "Plusieurs albums « {slug} »",
    ambiguousLead:
      "Plusieurs groupes ont publié une sortie sous ce nom. Choisissez celle que vous cherchez.",
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
  genre: {
    subgenres: "Sous-genres",
    emptyDescription:
      "Ce genre existe dans la taxonomie mais aucun groupe n'y est encore rattaché.",
    browseCatalogue: "Parcourir le catalogue",
  },
  member: {
    title: "Membres de {band}",
    documentedLead:
      "Formation documentée dans l'encyclopédie. Chaque membre dispose de sa propre fiche.",
    externalLead:
      "Aucune formation n'est encore documentée ici : les noms ci-dessous sont lus à la demande depuis MusicBrainz et ne sont pas conservés.",
    partialSources:
      "Certaines sources externes n'ont pas répondu : la liste peut être incomplète.",
    currentLineup: "Formation actuelle",
    noneDescription:
      "La formation de {band} n'est pas encore documentée, et MusicBrainz n'en fournit aucune.",
    backToBand: "Retour à la fiche du groupe",
    unknownPeriod: "période inconnue",
    musicbrainzEntry: "Fiche MusicBrainz",
    noBandDocumented:
      "Aucune appartenance n'a encore été documentée pour cette personne.",
  },
  festival: {
    title: "Festivals et salles",
    lead: "Où la scène se retrouve : {venues}, {countries}. Dates et billetterie chez les organisateurs — cette page ne fait que les recenser.",
    since: "depuis {year}",
    until: "jusqu'en {year}",
    festival: "Festival",
    venue: "Salle",
    officialSite: "Site officiel",
  },
  collection: {
    myList: "Ma liste :",
    owned: "Je l'ai",
    wanted: "Je le veux",
    remove: "Retirer",
    signInToRate: "{link} pour noter cet album et l'ajouter à votre liste.",
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
    bandsLoadFailed: "Impossible de charger les groupes : {reason}",
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
    close: "Fermer",
    loadingInProgress: "Chargement en cours",
    errorTitle: "Une erreur est survenue",
    errorBody:
      "Le contenu n'a pas pu être chargé. Réessayez ; si le problème persiste, il vient de nos serveurs et non de votre navigateur.",
    errorReference: "Référence : {digest}",
    cannotDisplay: "Impossible d'afficher {scope}",
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
    submitLead:
      "Chaque fiche doit pouvoir être vérifiée : deux preuves minimum, dont une source officielle. {link}.",
    contributorRequiredNotice:
      "Votre compte n'a pas encore le rôle contributeur, nécessaire pour soumettre un dossier. Il est attribué par un administrateur ; en attendant, vous pouvez parcourir l'encyclopédie et suivre vos éventuels dossiers existants.",
    mySubmissions: "Mes dossiers",
    mySubmissionsLead:
      "Suivez l'avancement de vos contributions et répondez aux demandes de preuves. {link}.",
    reviewTitle: "Relecture des contributions",
    reviewLead:
      "Vérifiez les sources avant d'approuver : l'approbation crée réellement la fiche du groupe. En cas de doute, demandez des preuves plutôt que de rejeter — {link}.",
    reviewLeadLink: "le workflow privilégie le dialogue",
    moderatorRequiredNotice:
      "La file de relecture est réservée aux modérateurs et aux administrateurs. Si vous avez soumis un dossier, vous pouvez en suivre l'avancement depuis vos dossiers.",
    submitted: "Dossier transmis",
    submittedNotice:
      "Votre contribution part en relecture. Un modérateur la validera ou vous demandera des preuves complémentaires — vous suivrez son avancement depuis vos dossiers.",
    name: "Nom",
    urlIdentifier: "Identifiant d'URL",
    countryIso: "Pays (ISO)",
    biography: "Biographie",
    submit: "Soumettre le dossier",
    evidence: "Preuves",
    evidenceRule:
      "Deux preuves minimum, dont au moins une source officielle. C'est ce qui garantit qu'une fiche renvoie à un groupe réel et vérifiable.",
    sourceKind: "Type de source",
    optionalNote: "Note (facultatif)",
    evidenceProgress: "{provided} sur {min} minimum",
    officialSourceProvided: "source officielle fournie",
    officialSourceMissing:
      "source officielle manquante (MusicBrainz, Discogs, label ou site officiel)",
    noSubmission: "Aucun dossier",
    noSubmissionDescription: "Vous n'avez encore proposé aucun groupe.",
    untitledSubmission: "Dossier sans nom",
    typeBandCreate: "nouveau groupe",
    typeBandEnrich: "enrichissement",
    submittedOn: "Soumis le {date}",
    deadlineNotice: "À compléter avant le {date} — relance {reminder} sur 2.",
    expiredNotice:
      "Ce dossier a expiré faute de preuves complémentaires. Vous pouvez en soumettre un nouveau.",
    sendEvidence: "Envoyer ces preuves",
    filterOpen: "Dossiers ouverts",
    filterPending: "En attente",
    filterApproved: "Approuvés",
    filterExpired: "Expirés",
    noMatchingSubmission: "Aucun dossier ne correspond à ce filtre.",
    evidenceProvided: "Preuves fournies",
    approvedNotice: "Dossier approuvé — {link}",
    sendRequest: "Envoyer la demande",
    requestMinLength:
      "Dix caractères minimum : une demande floue fait perdre un aller-retour.",
    processing: "Traitement…",
    approve: "Approuver",
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
    notFoundTitle: "404 — Page introuvable",
    breadcrumb: "Fil d'Ariane",
    pagination: "Pagination",
    actions: "Actions",
    filter: "Filtrer",
    quickSearch: "Recherche rapide",
    pageOf: "Page {page} sur {total}",
    cancel: "Annuler",
    delete: "Supprimer",
    save: "Enregistrer",
    saving: "Enregistrement…",
    sending: "Envoi…",
    tracks: "Pistes",
    ctrlKey: "Ctrl",
    searchKey: "K",
    paletteHint: "{open} pour ouvrir · {close} pour fermer",
  },
  password: {
    label: "Mot de passe",
    show: "Afficher",
    hide: "Masquer",
    generate: "Générer",
    copy: "Copier",
    requirementLength:
      "Au moins {min} caractères — la longueur compte plus que la complexité",
    requirementGuess:
      "Difficile à deviner : ni mot du dictionnaire, ni suite de touches, ni date",
    requirementPersonal: "Sans rapport avec votre nom ni votre adresse e-mail",
    met: "(satisfait)",
    notMet: "(non satisfait)",
    generatedLength: "Longueur générée : {length}",
    strength: "Force : {label} ({score}/4)",
    strength0: "Très faible",
    strength1: "Faible",
    strength2: "Moyen",
    strength3: "Fort",
    strength4: "Très fort",
    minLengthNotice: "Au moins {min} caractères requis.",
  },
  profile: {
    title: "Mon profil",
    publicProfile: "Profil public",
    currentRole: "Rôle actuel : {role}.",
    contributorHint:
      "Le rôle contributeur, nécessaire pour proposer un groupe, s'obtient auprès d'un administrateur.",
  },
  role: {
    user: "Utilisateur",
    contributor: "Contributeur",
    moderator: "Modérateur",
    admin: "Administrateur",
  },
  admin: {
    title: "Administration",
    accessNotice:
      "Cet espace est réservé aux administrateurs. Les modérateurs disposent de la file de relecture des contributions.",
    catalogue: "Catalogue",
    accounts: "Comptes",
    administrators: "Administrateurs",
    pendingSubmissions: "Dossiers à relire",
    reviewQueue: "File de relecture",
    apiDocs: "Documentation API",
    accountsAccessNotice:
      "La gestion des comptes est réservée aux administrateurs.",
    accountsLead:
      "Le rôle contributeur s'attribue ici : c'est la seule voie, l'inscription ne le donne pas. Le dernier administrateur ne peut être ni rétrogradé ni supprimé.",
    searchAccount: "Rechercher (nom ou email)",
    role: "Rôle",
    noAccount: "Aucun compte",
    noAccountDescription: "Aucun compte ne correspond à ces critères.",
    you: "(vous)",
    emailUnverified: "email non vérifié",
    registeredOn: "inscrit le {date}",
    banned: "Banni",
    banReason: "Motif : {reason}",
    ban: "Bannir",
    unban: "Réhabiliter",
    banDefaultReason: "Décision d'administration",
    typeNameToConfirm: "Saisir « {name} »",
    deletionWarning:
      "La suppression efface l'identité et son profil public. Les contributions déjà soumises sont conservées mais deviennent anonymes. Action irréversible.",
  },
  contributionStatus: {
    pending: "En attente de relecture",
    evidence_requested: "Preuves demandées",
    approved: "Approuvé",
    expired: "Expiré",
    rejected: "Rejeté",
  },
  evidenceKind: {
    label: "Label / maison de disques",
    officialSite: "Site officiel du groupe",
    press: "Article de presse",
    other: "Autre source",
  },
  theme: {
    alienation: "Aliénation",
    art: "Art",
    chaos: "Chaos",
    counterculture: "Contre-culture",
    death: "Mort",
    decadence: "Décadence",
    despair: "Désespoir",
    existentialism: "Existentialisme",
    introspection: "Introspection",
    loss: "Perte",
    lostLove: "Amour perdu",
    melancholy: "Mélancolie",
    misanthropy: "Misanthropie",
    mourning: "Deuil",
    mythology: "Mythologie",
    norseMythology: "Mythologie nordique",
    nature: "Nature",
    occultism: "Occultisme",
    philosophy: "Philosophie",
    religion: "Religion",
    satanism: "Satanisme",
    winter: "Hiver",
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
    emailLabel: "Adresse e-mail",
    accountEmailLabel: "Adresse e-mail du compte",
    newPassword: "Nouveau mot de passe",
    signingIn: "Connexion…",
    creating: "Création…",
    updating: "Mise à jour…",
    setPassword: "Définir le mot de passe",
    receiveLink: "Recevoir le lien",
    incompleteLink: "Lien incomplet. {link} pour recevoir un nouveau lien.",
    createMyAccount: "Créer mon compte",
    signInAction: "Se connecter",
  },
  pages: {
    aboutTitle: "À propos d'Helleilla Exploratium",
    aboutLead:
      "Une encyclopédie du metal, écrite par ceux qui l'écoutent. Groupes, discographies, genres — de la première démo autoproduite aux albums que tout le monde connaît.",
    whyTitle: "Pourquoi ce site",
    whyBody:
      "Les informations sur le metal sont éparpillées : un split de 1991 n'existe que sur un forum, une démo n'a jamais eu de pochette, un groupe a changé six fois de line-up sans que personne ne l'écrive nulle part. On rassemble tout ça au même endroit, gratuitement, sans publicité et sans compte obligatoire pour lire.",
    ruleTitle: "Rien d'inventé, rien de généré",
    ruleBody1:
      "Aucune image, aucun son et aucune vidéo produits par une intelligence artificielle n'entrent ici. Les pochettes et les photos que vous voyez viennent des plateformes et des archives qui les publient, et s'affichent depuis chez elles.",
    ruleBody2:
      "Les textes, eux, sont écrits par les contributeurs. Un groupe inventé de toutes pièces ne franchit pas la porte : il lui faudrait produire une référence vérifiable, et il n'en a aucune.",
    howTitle: "Comment contribuer",
    howBody:
      "Proposez une fiche, accompagnée d'au moins deux sources dont une officielle. Un modérateur la relit, puis la publie ou vous demande de compléter. C'est tout — pas de comité, pas d'attente interminable.",
    startTitle: "Commencer",
    creditsTitle: "Crédits et droits",
    creditsLead:
      "D'où viennent les pochettes, les photos et les informations affichées sur ce site, et à qui elles appartiennent.",
    imagesTitle: "Les images ne sont pas à nous",
    imagesBody1:
      "Pochettes, photos de concert, logos : tout appartient aux artistes, aux photographes, aux labels et aux éditeurs. Rien n'est copié sur nos serveurs. On enregistre une adresse, et c'est votre navigateur qui va chercher l'image chez elle — si elle la retire, elle disparaît d'ici aussi.",
    imagesBody2:
      "Elles servent à illustrer une fiche encyclopédique, pas à faire la promotion de quoi que ce soit et encore moins à rapporter de l'argent. Quand une photo vient de Wikimedia Commons, son auteur est nommé sous l'image et la page d'origine est à un clic.",
    musicTitle: "Pas de musique ici",
    musicBody:
      "Il n'y a pas de lecteur : pour écouter, les liens vous emmènent chez le diffuseur. C'est sa place, et c'est là que les artistes sont payés.",
    moneyTitle: "Aucune monétisation",
    moneyBody:
      "Pas de publicité, pas d'abonnement, pas de commission d'affiliation, pas de revente de données. Les liens sortants sont même nettoyés des paramètres de suivi que les plateformes y ajoutent.",
    dataTitle: "D'où viennent les données",
    takedownTitle: "Demander un retrait",
    takedownBody:
      "Vous êtes ayant droit et vous voulez qu'une image ou une référence disparaisse ? Dites-le, avec l'adresse de la page : c'est retiré, sans discussion et sans procédure. Comme rien n'est hébergé ici, le retrait est immédiat.",
    takedownNote:
      "Une fiche qui vous paraît fausse ou invérifiable peut aussi être signalée par n'importe quel lecteur : elle repasse alors en relecture.",
    furtherTitle: "Aller plus loin",
  },
  meta: {
    siteDescription:
      "L'encyclopédie collaborative du metal : groupes, discographies et genres.",
    homeDescription:
      "L'encyclopédie collaborative du metal : groupes, discographies et genres, sources à l'appui.",
    bandsDescription:
      "Catalogue des groupes metal : recherche, tri par nom ou année, période d'activité et pays.",
    albumsDescription:
      "Catalogue des albums, EP, singles et démos du monde metal.",
    genresDescription: "Taxonomie des genres et sous-genres metal.",
    searchDescription:
      "Recherchez parmi les groupes, albums et pistes du catalogue metal.",
    festivalsDescription:
      "Les festivals et les salles de la scène metal, pays par pays, avec le lien vers chaque organisateur.",
    contributeDescription:
      "Soumettre un groupe à l'encyclopédie, preuves officielles à l'appui.",
    mySubmissionsDescription: "Suivi de vos contributions à l'encyclopédie.",
    reviewDescription: "File de modération des dossiers soumis.",
    bandNotFound: "Groupe introuvable",
    bandFallbackDescription:
      "{band} : période d'activité {from} – {to}, genres et médias officiels.",
    albumNotFound: "Album introuvable",
    albumDescription: "{type} de {band}, tracklist et sources officielles.",
    albumDescriptionDated:
      "{type} de {band} sorti en {year}, tracklist et sources officielles.",
    discographyDescription:
      "Toutes les sorties référencées de {band} : albums, EP, singles, live et démos.",
    genreNotFound: "Genre introuvable",
    genreDescription: "{bands} référencés en {genre}{parent}.",
    genreSubgenreOf: ", sous-genre de {parent}",
    genreEmptyDescription: "Le genre {genre} dans l'encyclopédie {site}.",
    memberNotFound: "Membre introuvable",
    memberDescription: "{member} dans l'encyclopédie {site}.",
    membersDescription: "Formation de {band} : {count}.",
    membersFromMusicbrainz: "Formation de {band} d'après MusicBrainz.",
    forumsDescription:
      "Les avis des lecteurs sur les groupes et les albums référencés.",
  },
  console: {
    title: "Un instant.",
    body: "Si quelqu'un vous a demandé de coller du code ici, il cherche à prendre le contrôle de votre compte.\nNe collez jamais dans cette console un code que vous ne comprenez pas.\n\nCette console reste ouverte à tous : le projet est libre, et son code est consultable.",
  },
  errors: {
    unauthenticated: "Non authentifié.",
    forbidden: "Permission refusée.",
    unexpected: "Erreur serveur inattendue.",
    bandNotFound: "Groupe introuvable.",
    albumNotFound: "Album introuvable.",
    trackNotFound: "Piste introuvable.",
    genreNotFound: "Genre introuvable.",
    formInvalid:
      "Formulaire invalide ({min} caractères minimum pour le mot de passe)",
    captchaFailed: "Vérification anti-robot échouée, réessayez",
    passwordLeaked:
      "Ce mot de passe figure dans des fuites connues, choisissez-en un autre",
    signUpRefused: "Inscription impossible avec ces informations",
    badCredentials: "Email ou mot de passe incorrect",
    resetRequested: "Si un compte existe, un email a été envoyé.",
    resetLinkInvalid: "Lien invalide ou expiré — refaites une demande",
    passwordUpdated: "Mot de passe mis à jour. Vous pouvez vous connecter.",
    passwordTooShort: "Mot de passe invalide ({min} caractères minimum)",
  },
  mail: {
    resetSubject: "Réinitialisation de votre mot de passe — {site}",
    greeting: "Bonjour,",
    resetIntro: "Vous avez demandé la réinitialisation de votre mot de passe.",
    resetAction: "Cliquez sur le lien ci-dessous (valide une heure) :",
    resetIgnore:
      "Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.",
    signature: "— {site}",
  },
  forum: {
    lead: "Ce que les gens pensent des groupes et des albums référencés ici. Un avis engage celui qui l'écrit, pas l'encyclopédie.",
    activeSubjects: "Sujets actifs",
    latestPosts: "Derniers avis",
    empty: "Aucun avis pour l'instant",
    emptyDescription:
      "Personne n'a encore donné son avis. Vous pouvez commencer depuis la fiche d'un groupe ou d'un album.",
    compose: "Donner votre avis",
    subject: "Sujet",
    chooseSubject: "Choisir un groupe ou un album",
    bodyLabel: "Votre avis",
    bodyHint: "{min} caractères minimum, {max} au maximum.",
    publish: "Publier",
    publishing: "Publication…",
    signInToPost: "{link} pour donner votre avis.",
    remove: "Retirer",
    deletedAccount: "Compte supprimé",
    band: "Groupe",
    discuss: "En discuter",
    seeAll: "Tout voir",
    loadMore: "Charger plus",
    moderationNotice:
      "Les avis sont écrits par leurs auteurs, qui peuvent les retirer. La modération retire ce qui n'a pas sa place ici.",
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
  [Section in Exclude<keyof typeof fr, "count">]: {
    [Key in keyof (typeof fr)[Section]]: string;
  };
} & {
  /**
   * Seule section dont les valeurs ne sont pas des chaînes : un texte
   * compté est un jeu de formes, et les langues n'en emploient pas le
   * même nombre. Les CLÉS restent contraintes par le français.
   */
  count: {
    [Key in keyof (typeof fr)["count"]]: PluralForms;
  };
};
