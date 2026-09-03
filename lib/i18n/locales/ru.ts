/**
 * Русский словарь.
 *
 * Написан вручную по французскому образцу. Названия жанров не
 * переводятся: это имена собственные сцены.
 *
 * Падежи выверены отдельно: в русском смысл несут окончания, а не
 * порядок слов.
 */

import type { Dictionary } from "./fr";

export const ru: Dictionary = {
  nav: {
    home: "Главная",
    bands: "Группы",
    albums: "Альбомы",
    genres: "Жанры",
    search: "Поиск",
    festivals: "Фестивали",
    openMenu: "Открыть меню",
    closeMenu: "Закрыть меню",
    mainNavigation: "Основная навигация",
    language: "Язык",
    chooseLanguage: "Выбрать язык",
  },
  auth: {
    signIn: "Войти",
    signUp: "Создать аккаунт",
    signOut: "Выйти",
    myContributions: "Мои материалы",
  },
  home: {
    tagline:
      "Добро пожаловать в свободную, современную и понятную совместную энциклопедию метала! Приятных находок",
    explore: "Смотреть каталог",
    shortcutHint: "Подсказка: {keys} — быстрый поиск",
    recentBands: "Недавно добавленные группы",
    recentAlbums: "Последние внесённые издания",
    topRated: "С самыми высокими оценками",
  },
  band: {
    country: "Страна",
    activity: "Деятельность",
    active: "действует",
    disbanded: "распалась",
    members: "Состав",
    formerMembers: "Бывшие участники",
    themes: "Темы",
    genres: "Жанры",
    gallery: "Галерея",
    officialLinks: "Официальные ссылки",
    discography: "Дискография",
    noReleases: "Изданий не внесено.",
    photoCredit: "Фотография группы {band}",
    logoCredit: "Логотип группы {band}",
    by: "автор:",
    viewSource: "Открыть источник",
    close: "Закрыть",
    enlarge: "Увеличить",
    galleryNotice:
      "Эти фотографии иллюстрируют энциклопедическую статью. Права остаются за авторами, здесь ничего не продаётся.",
  },
  album: {
    tracklist: "Список композиций",
    totalDuration: "Общая длительность",
    tracks: "композиций",
    track: "композиция",
    noTracks: "Для этого издания композиции не внесены.",
    reviews: "Рецензии",
    press: "Пресса",
    listeners: "Слушатели",
    noPressReview: "Рецензий на этот альбом пока никто не добавил.",
    noRating: "Оценок пока нет",
    listenAt: "Слушать у источника",
    linksFor: "Ссылки для «{track}»",
  },
  releaseType: {
    album: "Альбом",
    ep: "EP",
    single: "Сингл",
    compilation: "Сборник",
    live: "Концертный",
    demo: "Демо",
    split: "Сплит",
  },
  releaseSection: {
    album: "Студийные альбомы",
    ep: "EP",
    single: "Синглы",
    compilation: "Сборники",
    live: "Концертные альбомы",
    demo: "Демо",
    split: "Сплиты",
  },
  catalogue: {
    allGenres: "Все жанры",
    filterByGenre: "Отбор по жанру",
    searchBand: "Найти группу…",
    searchAlbum: "Найти альбом…",
    searchPlaceholder: "Группы, альбомы, композиции…",
    sortBy: "Сортировать по",
    newest: "Сначала новые",
    name: "Название",
    year: "Год",
    ascending: "По возрастанию",
    descending: "По убыванию",
    loading: "Загрузка…",
    noResult: "Ничего не найдено.",
    releases: "изданий",
    release: "издание",
  },
  search: {
    title: "Поиск",
    prompt: "Введите запрос, чтобы искать группы, альбомы и композиции.",
    noResultFor: "Ничего не найдено по запросу «{term}».",
    searching: "Идёт поиск…",
    refreshing: "Обновление…",
  },
  common: {
    error: "Что-то пошло не так.",
    retry: "Повторить",
    unavailable: "Временно недоступно.",
    noVisual: "Изображения группы {name} нет",
    noCoverFor: "Обложки издания {title} нет — фотография группы {band}",
    coverOf: "Обложка издания {title}",
  },
  footer: {
    about: "О проекте",
    credits: "Источники и права",
    explore: "Смотреть",
    participate: "Участвовать",
    project: "Проект",
    proposeEntry: "Предложить статью",
    createAccount: "Создать аккаунт",
    intro:
      "Энциклопедия метала, которую пишут те, кто его слушает. Группы, дискографии, жанры — и путь к источнику каждого сведения.",
    rights:
      "Обложки и фотографии принадлежат их авторам и правообладателям. Здесь ничего не хранится: всё показывается из первоисточника, в качестве иллюстрации.",
    noMonetisation: "Без рекламы, без подписки, без доходов.",
    sourcesAndRights: "Источники и права",
  },
};
