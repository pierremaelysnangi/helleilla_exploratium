/**
 * Diccionario en español.
 *
 * Redactado a mano a partir de la referencia francesa. Los nombres de
 * los géneros no se traducen: son nombres propios de la escena.
 *
 * Se usa un registro neutro, válido tanto en España como en América.
 */

import type { Dictionary } from "./fr";

export const es: Dictionary = {
  nav: {
    home: "Inicio",
    bands: "Grupos",
    albums: "Álbumes",
    genres: "Géneros",
    search: "Búsqueda",
    festivals: "Festivales",
    openMenu: "Abrir el menú",
    closeMenu: "Cerrar el menú",
    mainNavigation: "Navegación principal",
    language: "Idioma",
    chooseLanguage: "Elegir idioma",
  },
  auth: {
    signIn: "Iniciar sesión",
    signUp: "Registrarse",
    signOut: "Cerrar sesión",
    myContributions: "Mis aportaciones",
  },
  home: {
    tagline:
      "¡Bienvenido a la enciclopedia colaborativa del metal: gratuita, moderna e intuitiva! Que disfrutes la exploración",
    explore: "Explorar el catálogo",
    shortcutHint: "Consejo: {keys} para la búsqueda rápida",
    recentBands: "Últimos grupos añadidos",
    recentAlbums: "Últimas ediciones registradas",
    topRated: "Mejor valorados",
  },
  band: {
    country: "País",
    activity: "Actividad",
    active: "en activo",
    disbanded: "disuelto",
    members: "Miembros",
    formerMembers: "Antiguos miembros",
    themes: "Temáticas",
    genres: "Géneros",
    gallery: "Galería",
    officialLinks: "Enlaces oficiales",
    discography: "Discografía",
    noReleases: "No hay ediciones registradas.",
    photoCredit: "Foto de {band}",
    logoCredit: "Logotipo de {band}",
    by: "por",
    viewSource: "Ver la fuente",
    close: "Cerrar",
    enlarge: "Ampliar",
    galleryNotice:
      "Estas fotos ilustran una ficha enciclopédica. Siguen perteneciendo a sus autores, y aquí no se vende ni se monetiza nada.",
  },
  album: {
    tracklist: "Lista de canciones",
    totalDuration: "Duración total",
    tracks: "pistas",
    track: "pista",
    noTracks: "No hay pistas registradas para esta edición.",
    reviews: "Críticas",
    press: "Prensa",
    listeners: "Oyentes",
    noPressReview: "Todavía nadie ha añadido una crítica de este álbum.",
    noRating: "Aún sin valoraciones",
    listenAt: "Escuchar en la fuente",
    linksFor: "Enlaces de {track}",
  },
  releaseType: {
    album: "Álbum",
    ep: "EP",
    single: "Sencillo",
    compilation: "Recopilatorio",
    live: "En directo",
    demo: "Maqueta",
    split: "Split",
  },
  releaseSection: {
    album: "Álbumes de estudio",
    ep: "EP",
    single: "Sencillos",
    compilation: "Recopilatorios",
    live: "Directos",
    demo: "Maquetas",
    split: "Splits",
  },
  catalogue: {
    allGenres: "Todos los géneros",
    filterByGenre: "Filtrar por género",
    searchBand: "Buscar un grupo…",
    searchAlbum: "Buscar un álbum…",
    searchPlaceholder: "Grupos, álbumes, pistas…",
    sortBy: "Ordenar por",
    newest: "Más recientes",
    name: "Nombre",
    year: "Año",
    ascending: "Ascendente",
    descending: "Descendente",
    loading: "Cargando…",
    noResult: "Sin resultados.",
    releases: "ediciones",
    release: "edición",
  },
  search: {
    title: "Búsqueda",
    prompt: "Escribe un término para buscar grupos, álbumes y pistas.",
    noResultFor: "Sin resultados para «{term}».",
    searching: "Buscando…",
    refreshing: "Actualizando…",
  },
  common: {
    error: "Se ha producido un error.",
    retry: "Reintentar",
    unavailable: "No disponible por el momento.",
    noVisual: "No hay imagen disponible de {name}",
    noCoverFor: "Sin portada de {title} — imagen de {band}",
    coverOf: "Portada de {title}",
  },
  footer: {
    about: "Acerca del proyecto",
    credits: "Créditos y derechos",
    explore: "Explorar",
    participate: "Participar",
    project: "El proyecto",
    proposeEntry: "Proponer una ficha",
    createAccount: "Crear una cuenta",
    intro:
      "Una enciclopedia del metal escrita por quienes lo escuchan. Grupos, discografías, géneros — y el camino de vuelta a la fuente de cada dato.",
    rights:
      "Las portadas y las fotos pertenecen a sus autores y titulares de derechos. Aquí no se aloja nada: todo se muestra desde su fuente original, a modo de ilustración.",
    noMonetisation: "Proyecto sin publicidad, sin suscripción y sin ingresos.",
    sourcesAndRights: "Fuentes y derechos",
  },
};
