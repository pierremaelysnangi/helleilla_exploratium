/**
 * Słownik polski.
 *
 * Napisany ręcznie na podstawie wersji francuskiej. Nazwy gatunków
 * pozostają nieprzetłumaczone: to nazwy własne sceny.
 *
 * Przypadki gramatyczne sprawdzono osobno — w polszczyźnie znaczenie
 * niosą końcówki, nie szyk zdania.
 */

import type { Dictionary } from "./fr";

export const pl: Dictionary = {
  nav: {
    home: "Strona główna",
    bands: "Zespoły",
    albums: "Albumy",
    genres: "Gatunki",
    search: "Szukaj",
    festivals: "Festiwale",
    openMenu: "Otwórz menu",
    closeMenu: "Zamknij menu",
    mainNavigation: "Nawigacja główna",
    language: "Język",
    chooseLanguage: "Wybierz język",
  },
  auth: {
    signIn: "Zaloguj się",
    signUp: "Załóż konto",
    signOut: "Wyloguj się",
    myContributions: "Moje wpisy",
  },
  home: {
    tagline:
      "Witaj w wolnej, nowoczesnej i przejrzystej encyklopedii metalu tworzonej wspólnie! Udanych odkryć",
    explore: "Przeglądaj katalog",
    shortcutHint: "Wskazówka: {keys} — szybkie wyszukiwanie",
    recentBands: "Ostatnio dodane zespoły",
    recentAlbums: "Ostatnio dodane wydawnictwa",
    topRated: "Najwyżej oceniane",
  },
  band: {
    country: "Kraj",
    activity: "Działalność",
    active: "działa",
    disbanded: "rozwiązany",
    members: "Skład",
    formerMembers: "Byli członkowie",
    themes: "Tematyka",
    genres: "Gatunki",
    gallery: "Galeria",
    officialLinks: "Oficjalne odnośniki",
    discography: "Dyskografia",
    noReleases: "Brak zarejestrowanych wydawnictw.",
    photoCredit: "Zdjęcie zespołu {band}",
    logoCredit: "Logo zespołu {band}",
    by: "autor:",
    viewSource: "Zobacz źródło",
    close: "Zamknij",
    enlarge: "Powiększ",
    galleryNotice:
      "Zdjęcia ilustrują hasło encyklopedyczne. Pozostają własnością autorów, a tutaj nic nie jest sprzedawane ani spieniężane.",
  },
  album: {
    tracklist: "Lista utworów",
    totalDuration: "Łączny czas",
    tracks: "utworów",
    track: "utwór",
    noTracks: "Brak utworów zarejestrowanych dla tego wydawnictwa.",
    reviews: "Recenzje",
    press: "Prasa",
    listeners: "Słuchacze",
    noPressReview: "Nikt jeszcze nie dodał recenzji tego albumu.",
    noRating: "Brak ocen",
    listenAt: "Posłuchaj u źródła",
    linksFor: "Odnośniki do utworu {track}",
  },
  releaseType: {
    album: "Album",
    ep: "EP",
    single: "Singel",
    compilation: "Kompilacja",
    live: "Koncertowy",
    demo: "Demo",
    split: "Split",
  },
  releaseSection: {
    album: "Albumy studyjne",
    ep: "EP",
    single: "Single",
    compilation: "Kompilacje",
    live: "Albumy koncertowe",
    demo: "Dema",
    split: "Splity",
  },
  catalogue: {
    allGenres: "Wszystkie gatunki",
    filterByGenre: "Filtruj według gatunku",
    searchBand: "Szukaj zespołu…",
    searchAlbum: "Szukaj albumu…",
    searchPlaceholder: "Zespoły, albumy, utwory…",
    sortBy: "Sortuj według",
    newest: "Najnowsze",
    name: "Nazwa",
    year: "Rok",
    ascending: "Rosnąco",
    descending: "Malejąco",
    loading: "Wczytywanie…",
    noResult: "Brak wyników.",
    releases: "wydawnictw",
    release: "wydawnictwo",
  },
  search: {
    title: "Szukaj",
    prompt: "Wpisz hasło, aby przeszukać zespoły, albumy i utwory.",
    noResultFor: "Brak wyników dla „{term}”.",
    searching: "Szukanie…",
    refreshing: "Odświeżanie…",
  },
  common: {
    error: "Coś poszło nie tak.",
    retry: "Spróbuj ponownie",
    unavailable: "Chwilowo niedostępne.",
    noVisual: "Brak zdjęcia zespołu {name}",
    noCoverFor: "Brak okładki wydawnictwa {title} — zdjęcie zespołu {band}",
    coverOf: "Okładka wydawnictwa {title}",
  },
  footer: {
    about: "O projekcie",
    credits: "Źródła i prawa",
    explore: "Przeglądaj",
    participate: "Współtwórz",
    project: "Projekt",
    proposeEntry: "Zaproponuj hasło",
    createAccount: "Załóż konto",
    intro:
      "Encyklopedia metalu pisana przez tych, którzy go słuchają. Zespoły, dyskografie, gatunki — i przy każdej informacji droga powrotna do źródła.",
    rights:
      "Okładki i zdjęcia należą do ich autorów i właścicieli praw. Nic nie jest tu przechowywane: wszystko wyświetlamy z pierwotnego źródła, w celu ilustracyjnym.",
    noMonetisation: "Bez reklam, bez abonamentu, bez przychodów.",
    sourcesAndRights: "Źródła i prawa",
  },
};
