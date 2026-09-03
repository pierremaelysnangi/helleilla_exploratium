/**
 * 日本語の辞書。
 *
 * フランス語の原文をもとに手作業で作成。ジャンル名は固有名詞として
 * 英字のまま残す。
 *
 * 文体は「です・ます」を避けた簡潔な体言止めを基本とし、画面上の
 * ラベルとして自然な長さに収めている。
 */

import type { Dictionary } from "./fr";

export const ja: Dictionary = {
  nav: {
    home: "ホーム",
    bands: "バンド",
    albums: "アルバム",
    genres: "ジャンル",
    search: "検索",
    openMenu: "メニューを開く",
    closeMenu: "メニューを閉じる",
    mainNavigation: "メインナビゲーション",
    language: "言語",
    chooseLanguage: "言語を選択",
  },
  auth: {
    signIn: "ログイン",
    signUp: "アカウント作成",
    signOut: "ログアウト",
    myContributions: "自分の投稿",
  },
  home: {
    tagline:
      "無料で、新しく、使いやすい――みんなでつくるメタルの百科事典へようこそ。心ゆくまでどうぞ",
    explore: "カタログを見る",
    shortcutHint: "ヒント: {keys} でクイック検索",
    recentBands: "最近追加されたバンド",
    recentAlbums: "最近登録された作品",
    topRated: "評価の高い作品",
  },
  band: {
    country: "国",
    activity: "活動",
    active: "活動中",
    disbanded: "解散",
    members: "メンバー",
    formerMembers: "旧メンバー",
    themes: "テーマ",
    genres: "ジャンル",
    gallery: "ギャラリー",
    officialLinks: "公式リンク",
    discography: "ディスコグラフィ",
    noReleases: "登録された作品はありません。",
    photoCredit: "{band} の写真",
    logoCredit: "{band} のロゴ",
    by: "撮影:",
    viewSource: "出典を見る",
    close: "閉じる",
    enlarge: "拡大",
    galleryNotice:
      "写真は事典の項目を説明するためのものです。著作権は撮影者にあり、当サイトでは販売も収益化も行いません。",
  },
  album: {
    tracklist: "収録曲",
    totalDuration: "総再生時間",
    tracks: "曲",
    track: "曲",
    noTracks: "この作品の収録曲は登録されていません。",
    reviews: "レビュー",
    press: "メディア",
    listeners: "リスナー",
    noPressReview: "このアルバムのレビューはまだありません。",
    noRating: "評価はまだありません",
    listenAt: "配信元で聴く",
    lyrics: "歌詞",
    linksFor: "{track} のリンク",
  },
  releaseType: {
    album: "アルバム",
    ep: "EP",
    single: "シングル",
    compilation: "コンピレーション",
    live: "ライブ",
    demo: "デモ",
    split: "スプリット",
  },
  releaseSection: {
    album: "スタジオ・アルバム",
    ep: "EP",
    single: "シングル",
    compilation: "コンピレーション",
    live: "ライブ・アルバム",
    demo: "デモ",
    split: "スプリット",
  },
  catalogue: {
    allGenres: "すべてのジャンル",
    filterByGenre: "ジャンルで絞り込む",
    searchBand: "バンドを検索…",
    searchAlbum: "アルバムを検索…",
    searchPlaceholder: "バンド、アルバム、曲…",
    sortBy: "並び替え",
    newest: "新しい順",
    name: "名前",
    year: "年",
    ascending: "昇順",
    descending: "降順",
    loading: "読み込み中…",
    noResult: "該当なし。",
    releases: "作品",
    release: "作品",
  },
  search: {
    title: "検索",
    prompt: "語句を入力してバンド・アルバム・曲を検索してください。",
    noResultFor: "「{term}」に該当する結果はありません。",
    searching: "検索中…",
    refreshing: "更新中…",
  },
  common: {
    error: "エラーが発生しました。",
    retry: "再試行",
    unavailable: "一時的に利用できません。",
    noVisual: "{name} の画像はありません",
    noCoverFor: "{title} のジャケットがないため {band} の写真を表示",
    coverOf: "{title} のジャケット",
  },
  footer: {
    about: "このサイトについて",
    credits: "出典と権利",
    explore: "見る",
    participate: "参加する",
    project: "プロジェクト",
    proposeEntry: "項目を提案",
    createAccount: "アカウントを作成",
    intro:
      "聴き手が書くメタルの百科事典。バンド、ディスコグラフィ、ジャンル――そして、どの記述からも出典にたどり着ける。",
    rights:
      "ジャケットや写真の権利は、撮影者および権利者に帰属します。当サイトは何も保存せず、すべて出典元から表示しています。",
    noMonetisation: "広告なし、有料会員なし、収益なし。",
    sourcesAndRights: "出典と権利",
  },
};
