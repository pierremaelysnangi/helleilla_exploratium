/**
 * English dictionary.
 *
 * Written by hand against the French reference, not passed through a
 * translation service. British spelling is avoided where it diverges
 * from American ("catalogue"/"catalog") in favour of the form most
 * readers of both variants accept.
 *
 * Genre names are left untranslated throughout the application: they are
 * proper nouns of the scene.
 */

import type { Dictionary } from "./fr";

export const en: Dictionary = {
  nav: {
    home: "Home",
    bands: "Bands",
    albums: "Albums",
    genres: "Genres",
    search: "Search",
    festivals: "Festivals",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    mainNavigation: "Main navigation",
    language: "Language",
    chooseLanguage: "Choose language",
  },
  auth: {
    signIn: "Sign in",
    signUp: "Sign up",
    signOut: "Sign out",
    myContributions: "My contributions",
  },
  home: {
    tagline:
      "Welcome to the free, modern and easy-going collaborative encyclopedia of metal! Enjoy the ride",
    explore: "Browse the catalogue",
    shortcutHint: "Tip: {keys} for quick search",
    recentBands: "Recently added bands",
    recentAlbums: "Latest releases listed",
    topRated: "Highest rated",
  },
  band: {
    country: "Country",
    activity: "Active",
    active: "active",
    disbanded: "disbanded",
    members: "Members",
    formerMembers: "Former members",
    themes: "Themes",
    genres: "Genres",
    gallery: "Gallery",
    officialLinks: "Official links",
    discography: "Discography",
    noReleases: "No releases listed.",
    photoCredit: "Photo of {band}",
    logoCredit: "Logo of {band}",
    by: "by",
    viewSource: "View source",
    close: "Close",
    enlarge: "Enlarge",
    galleryNotice:
      "These photos illustrate an encyclopedia entry. They remain their authors' work, and nothing here is sold or monetised.",
  },
  album: {
    tracklist: "Tracklist",
    totalDuration: "Total length",
    tracks: "tracks",
    track: "track",
    noTracks: "No tracks listed for this release.",
    reviews: "Reviews",
    press: "Press",
    listeners: "Listeners",
    noPressReview: "Nobody has added a review for this album yet.",
    noRating: "No ratings yet",
    listenAt: "Listen at the source",
    lyrics: "Lyrics",
    linksFor: "Links for {track}",
  },
  releaseType: {
    album: "Album",
    ep: "EP",
    single: "Single",
    compilation: "Compilation",
    live: "Live",
    demo: "Demo",
    split: "Split",
  },
  releaseSection: {
    album: "Studio albums",
    ep: "EPs",
    single: "Singles",
    compilation: "Compilations",
    live: "Live albums",
    demo: "Demos",
    split: "Splits",
  },
  catalogue: {
    allGenres: "All genres",
    filterByGenre: "Filter by genre",
    searchBand: "Search for a band…",
    searchAlbum: "Search for an album…",
    searchPlaceholder: "Bands, albums, tracks…",
    sortBy: "Sort by",
    newest: "Newest",
    name: "Name",
    year: "Year",
    ascending: "Ascending",
    descending: "Descending",
    loading: "Loading…",
    noResult: "No results.",
    releases: "releases",
    release: "release",
  },
  search: {
    title: "Search",
    prompt: "Type a term to search bands, albums and tracks.",
    noResultFor: "No results for “{term}”.",
    searching: "Searching…",
    refreshing: "Refreshing…",
  },
  common: {
    error: "Something went wrong.",
    retry: "Try again",
    unavailable: "Temporarily unavailable.",
    noVisual: "No image available for {name}",
    noCoverFor: "No cover for {title} — image of {band}",
    coverOf: "Cover of {title}",
  },
  footer: {
    about: "About",
    credits: "Credits and rights",
    explore: "Browse",
    participate: "Take part",
    project: "The project",
    proposeEntry: "Submit an entry",
    createAccount: "Create an account",
    intro:
      "A metal encyclopedia written by the people who listen to it. Bands, discographies, genres — and a way back to the source of every fact.",
    rights:
      "Cover art and photographs belong to their authors and rights holders. Nothing is hosted here: everything is shown from its original source, for illustration.",
    noMonetisation: "No advertising, no subscription, no revenue.",
    sourcesAndRights: "Sources and rights",
  },
};
