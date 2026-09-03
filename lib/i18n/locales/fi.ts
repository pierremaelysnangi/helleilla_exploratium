/**
 * Suomenkielinen sanasto.
 *
 * Kirjoitettu käsin ranskankielisen lähtötekstin pohjalta. Genrejen
 * nimiä ei käännetä: ne ovat skenen erisnimiä.
 *
 * Sijapäätteet on tarkistettu erikseen: suomessa merkitys kulkee
 * taivutuksessa, ei sanajärjestyksessä.
 */

import type { Dictionary } from "./fr";

export const fi: Dictionary = {
  nav: {
    home: "Etusivu",
    bands: "Yhtyeet",
    albums: "Albumit",
    genres: "Tyylilajit",
    search: "Haku",
    festivals: "Festivaalit",
    openMenu: "Avaa valikko",
    closeMenu: "Sulje valikko",
    mainNavigation: "Päänavigointi",
    language: "Kieli",
    chooseLanguage: "Valitse kieli",
  },
  auth: {
    signIn: "Kirjaudu sisään",
    signUp: "Luo tili",
    signOut: "Kirjaudu ulos",
    myContributions: "Omat lisäykset",
  },
  home: {
    tagline:
      "Tervetuloa metallin vapaaseen, nykyaikaiseen ja selkeään yhteisölliseen tietosanakirjaan! Antoisia löytöretkiä",
    explore: "Selaa luetteloa",
    shortcutHint: "Vinkki: {keys} pikahakuun",
    recentBands: "Viimeksi lisätyt yhtyeet",
    recentAlbums: "Viimeksi kirjatut julkaisut",
    topRated: "Parhaiten arvioidut",
  },
  band: {
    country: "Maa",
    activity: "Toiminta",
    active: "toiminnassa",
    disbanded: "hajonnut",
    members: "Jäsenet",
    formerMembers: "Entiset jäsenet",
    themes: "Aiheet",
    genres: "Tyylilajit",
    gallery: "Kuvat",
    officialLinks: "Viralliset linkit",
    discography: "Diskografia",
    noReleases: "Julkaisuja ei ole kirjattu.",
    photoCredit: "Kuva yhtyeestä {band}",
    logoCredit: "Yhtyeen {band} logo",
    by: "kuvaaja",
    viewSource: "Katso lähde",
    close: "Sulje",
    enlarge: "Suurenna",
    galleryNotice:
      "Kuvat havainnollistavat tietosanakirja-artikkelia. Ne kuuluvat edelleen tekijöilleen, eikä täällä myydä mitään.",
  },
  album: {
    tracklist: "Kappaleet",
    totalDuration: "Kokonaiskesto",
    tracks: "kappaletta",
    track: "kappale",
    noTracks: "Tälle julkaisulle ei ole kirjattu kappaleita.",
    reviews: "Arviot",
    press: "Lehdistö",
    listeners: "Kuuntelijat",
    noPressReview: "Kukaan ei ole vielä lisännyt arviota tästä albumista.",
    noRating: "Ei vielä arvioita",
    listenAt: "Kuuntele lähteessä",
    linksFor: "Linkit kappaleeseen {track}",
  },
  releaseType: {
    album: "Albumi",
    ep: "EP",
    single: "Single",
    compilation: "Kokoelma",
    live: "Live",
    demo: "Demo",
    split: "Split",
  },
  releaseSection: {
    album: "Studioalbumit",
    ep: "EP:t",
    single: "Singlet",
    compilation: "Kokoelmat",
    live: "Livealbumit",
    demo: "Demot",
    split: "Splitit",
  },
  catalogue: {
    allGenres: "Kaikki tyylilajit",
    filterByGenre: "Rajaa tyylilajin mukaan",
    searchBand: "Hae yhtyettä…",
    searchAlbum: "Hae albumia…",
    searchPlaceholder: "Yhtyeet, albumit, kappaleet…",
    sortBy: "Järjestä",
    newest: "Uusimmat",
    name: "Nimi",
    year: "Vuosi",
    ascending: "Nouseva",
    descending: "Laskeva",
    loading: "Ladataan…",
    noResult: "Ei tuloksia.",
    releases: "julkaisua",
    release: "julkaisu",
  },
  search: {
    title: "Haku",
    prompt: "Kirjoita hakusana etsiäksesi yhtyeitä, albumeita ja kappaleita.",
    noResultFor: "Ei tuloksia haulle ”{term}”.",
    searching: "Haetaan…",
    refreshing: "Päivitetään…",
  },
  common: {
    error: "Jokin meni pieleen.",
    retry: "Yritä uudelleen",
    unavailable: "Tilapäisesti poissa käytöstä.",
    noVisual: "Yhtyeestä {name} ei ole kuvaa",
    noCoverFor: "Julkaisulle {title} ei ole kansikuvaa — kuva yhtyeestä {band}",
    coverOf: "Julkaisun {title} kansi",
  },
  footer: {
    about: "Tietoa hankkeesta",
    credits: "Lähteet ja oikeudet",
    explore: "Selaa",
    participate: "Osallistu",
    project: "Hanke",
    proposeEntry: "Ehdota artikkelia",
    createAccount: "Luo tili",
    intro:
      "Metallin tietosanakirja, jonka kirjoittavat sen kuuntelijat. Yhtyeet, diskografiat, tyylilajit — ja jokaisen tiedon kohdalla polku takaisin lähteelle.",
    rights:
      "Kannet ja valokuvat kuuluvat tekijöilleen ja oikeudenhaltijoilleen. Mitään ei säilytetä täällä: kaikki näytetään alkuperäisestä lähteestä havainnollistamiseksi.",
    noMonetisation: "Ei mainoksia, ei tilausmaksuja, ei tuloja.",
    sourcesAndRights: "Lähteet ja oikeudet",
  },
};
