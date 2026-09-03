/**
 * Deutsches Wörterbuch.
 *
 * Von Hand nach der französischen Referenz verfasst. Genrenamen bleiben
 * unübersetzt: sie sind Eigennamen der Szene.
 *
 * Anrede durchgehend unpersönlich; Substantive groß, wie es die
 * Rechtschreibung verlangt.
 */

import type { Dictionary } from "./fr";

export const de: Dictionary = {
  nav: {
    home: "Startseite",
    bands: "Bands",
    albums: "Alben",
    genres: "Genres",
    search: "Suche",
    openMenu: "Menü öffnen",
    closeMenu: "Menü schließen",
    mainNavigation: "Hauptnavigation",
    language: "Sprache",
    chooseLanguage: "Sprache wählen",
  },
  auth: {
    signIn: "Anmelden",
    signUp: "Registrieren",
    signOut: "Abmelden",
    myContributions: "Meine Beiträge",
  },
  home: {
    tagline:
      "Willkommen bei der freien, modernen und übersichtlichen Gemeinschafts­enzyklopädie des Metal! Viel Freude beim Stöbern",
    explore: "Katalog erkunden",
    shortcutHint: "Tipp: {keys} für die Schnellsuche",
    recentBands: "Zuletzt hinzugefügte Bands",
    recentAlbums: "Zuletzt erfasste Veröffentlichungen",
    topRated: "Am besten bewertet",
  },
  band: {
    country: "Land",
    activity: "Aktiv",
    active: "aktiv",
    disbanded: "aufgelöst",
    members: "Mitglieder",
    formerMembers: "Ehemalige Mitglieder",
    themes: "Themen",
    genres: "Genres",
    gallery: "Galerie",
    officialLinks: "Offizielle Links",
    discography: "Diskografie",
    noReleases: "Keine Veröffentlichungen erfasst.",
    photoCredit: "Foto von {band}",
    logoCredit: "Logo von {band}",
    by: "von",
    viewSource: "Quelle ansehen",
    close: "Schließen",
    enlarge: "Vergrößern",
    galleryNotice:
      "Diese Fotos illustrieren einen Lexikoneintrag. Die Rechte bleiben bei den Urhebern; hier wird nichts verkauft oder monetarisiert.",
  },
  album: {
    tracklist: "Titelliste",
    totalDuration: "Gesamtlänge",
    tracks: "Titel",
    track: "Titel",
    noTracks: "Für diese Veröffentlichung sind keine Titel erfasst.",
    reviews: "Kritiken",
    press: "Presse",
    listeners: "Hörer",
    noPressReview: "Für dieses Album wurde noch keine Kritik erfasst.",
    noRating: "Noch keine Bewertung",
    listenAt: "Beim Anbieter hören",
    lyrics: "Songtexte",
    linksFor: "Links zu {track}",
  },
  releaseType: {
    album: "Album",
    ep: "EP",
    single: "Single",
    compilation: "Kompilation",
    live: "Live",
    demo: "Demo",
    split: "Split",
  },
  releaseSection: {
    album: "Studioalben",
    ep: "EPs",
    single: "Singles",
    compilation: "Kompilationen",
    live: "Livealben",
    demo: "Demos",
    split: "Splits",
  },
  catalogue: {
    allGenres: "Alle Genres",
    filterByGenre: "Nach Genre filtern",
    searchBand: "Band suchen …",
    searchAlbum: "Album suchen …",
    searchPlaceholder: "Bands, Alben, Titel …",
    sortBy: "Sortieren nach",
    newest: "Neueste",
    name: "Name",
    year: "Jahr",
    ascending: "Aufsteigend",
    descending: "Absteigend",
    loading: "Wird geladen …",
    noResult: "Keine Treffer.",
    releases: "Veröffentlichungen",
    release: "Veröffentlichung",
  },
  search: {
    title: "Suche",
    prompt: "Suchbegriff eingeben, um Bands, Alben und Titel zu durchsuchen.",
    noResultFor: "Keine Treffer für „{term}“.",
    searching: "Wird gesucht …",
    refreshing: "Wird aktualisiert …",
  },
  common: {
    error: "Es ist ein Fehler aufgetreten.",
    retry: "Erneut versuchen",
    unavailable: "Vorübergehend nicht verfügbar.",
    noVisual: "Kein Bild verfügbar für {name}",
    noCoverFor: "Kein Cover für {title} — Bild von {band}",
    coverOf: "Cover von {title}",
  },
  footer: {
    about: "Über das Projekt",
    credits: "Nachweise und Rechte",
    explore: "Erkunden",
    participate: "Mitmachen",
    project: "Das Projekt",
    proposeEntry: "Eintrag vorschlagen",
    createAccount: "Konto erstellen",
    intro:
      "Eine Metal-Enzyklopädie, geschrieben von denen, die Metal hören. Bands, Diskografien, Genres — und zu jeder Angabe der Weg zurück zur Quelle.",
    rights:
      "Cover und Fotos gehören ihren Urhebern und Rechteinhabern. Hier wird nichts gespeichert: alles wird von der Originalquelle angezeigt, zur Veranschaulichung.",
    noMonetisation: "Keine Werbung, kein Abonnement, keine Einnahmen.",
    sourcesAndRights: "Quellen und Rechte",
  },
};
