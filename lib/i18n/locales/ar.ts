/**
 * القاموس العربي.
 *
 * كُتب يدويًا انطلاقًا من النص الفرنسي المرجعي. أسماء الأنواع الموسيقية
 * تبقى بالحروف اللاتينية: فهي أسماء علم متداولة في المشهد.
 *
 * العربية تُكتب من اليمين إلى اليسار: القيمة `rtl` مسجَّلة في سجل اللغات
 * وتُطبَّق على الصفحة بأكملها.
 */

import type { Dictionary } from "./fr";

export const ar: Dictionary = {
  nav: {
    home: "الرئيسية",
    bands: "الفرق",
    albums: "الألبومات",
    genres: "الأنواع",
    search: "البحث",
    festivals: "المهرجانات",
    openMenu: "فتح القائمة",
    closeMenu: "إغلاق القائمة",
    mainNavigation: "التنقل الرئيسي",
    language: "اللغة",
    chooseLanguage: "اختيار اللغة",
  },
  auth: {
    signIn: "تسجيل الدخول",
    signUp: "إنشاء حساب",
    signOut: "تسجيل الخروج",
    myContributions: "مساهماتي",
  },
  home: {
    tagline:
      "أهلًا بك في الموسوعة التشاركية لموسيقى الميتال: مجانية وحديثة وسهلة. استكشافًا ممتعًا",
    explore: "تصفَّح الفهرس",
    shortcutHint: "تلميح: {keys} للبحث السريع",
    recentBands: "أحدث الفرق المضافة",
    recentAlbums: "أحدث الإصدارات المسجَّلة",
    topRated: "الأعلى تقييمًا",
  },
  band: {
    country: "البلد",
    activity: "النشاط",
    active: "نشطة",
    disbanded: "منحلَّة",
    members: "الأعضاء",
    formerMembers: "أعضاء سابقون",
    themes: "الموضوعات",
    genres: "الأنواع",
    gallery: "معرض الصور",
    officialLinks: "الروابط الرسمية",
    discography: "قائمة الإصدارات",
    noReleases: "لا توجد إصدارات مسجَّلة.",
    photoCredit: "صورة لفرقة {band}",
    logoCredit: "شعار فرقة {band}",
    by: "تصوير:",
    viewSource: "عرض المصدر",
    close: "إغلاق",
    enlarge: "تكبير",
    galleryNotice:
      "هذه الصور توضِّح مادة موسوعية. حقوقها تبقى لأصحابها، ولا شيء يُباع أو يُستثمر ماديًا هنا.",
  },
  album: {
    tracklist: "قائمة المقطوعات",
    totalDuration: "المدة الإجمالية",
    tracks: "مقطوعات",
    track: "مقطوعة",
    noTracks: "لا توجد مقطوعات مسجَّلة لهذا الإصدار.",
    reviews: "المراجعات",
    press: "الصحافة",
    listeners: "المستمعون",
    noPressReview: "لم يضف أحد بعد مراجعة لهذا الألبوم.",
    noRating: "لا تقييمات بعد",
    listenAt: "الاستماع لدى الناشر",
    lyrics: "الكلمات",
    linksFor: "روابط {track}",
  },
  releaseType: {
    album: "ألبوم",
    ep: "أسطوانة قصيرة",
    single: "أغنية منفردة",
    compilation: "مجموعة مختارات",
    live: "حفل حي",
    demo: "تسجيل تجريبي",
    split: "إصدار مشترك",
  },
  releaseSection: {
    album: "ألبومات الاستوديو",
    ep: "الأسطوانات القصيرة",
    single: "الأغاني المنفردة",
    compilation: "المختارات",
    live: "ألبومات الحفلات",
    demo: "التسجيلات التجريبية",
    split: "الإصدارات المشتركة",
  },
  catalogue: {
    allGenres: "كل الأنواع",
    filterByGenre: "التصفية حسب النوع",
    searchBand: "ابحث عن فرقة…",
    searchAlbum: "ابحث عن ألبوم…",
    searchPlaceholder: "فرق، ألبومات، مقطوعات…",
    sortBy: "الترتيب حسب",
    newest: "الأحدث",
    name: "الاسم",
    year: "السنة",
    ascending: "تصاعدي",
    descending: "تنازلي",
    loading: "جارٍ التحميل…",
    noResult: "لا نتائج.",
    releases: "إصدارات",
    release: "إصدار",
  },
  search: {
    title: "البحث",
    prompt: "اكتب كلمة للبحث في الفرق والألبومات والمقطوعات.",
    noResultFor: "لا نتائج لـ «{term}».",
    searching: "جارٍ البحث…",
    refreshing: "جارٍ التحديث…",
  },
  common: {
    error: "حدث خطأ.",
    retry: "أعد المحاولة",
    unavailable: "غير متاح مؤقتًا.",
    noVisual: "لا توجد صورة لفرقة {name}",
    noCoverFor: "لا غلاف لإصدار {title} — صورة فرقة {band}",
    coverOf: "غلاف إصدار {title}",
  },
  footer: {
    about: "عن المشروع",
    credits: "المصادر والحقوق",
    explore: "تصفَّح",
    participate: "شارِك",
    project: "المشروع",
    proposeEntry: "اقترح مادة",
    createAccount: "أنشئ حسابًا",
    intro:
      "موسوعة للميتال يكتبها من يستمعون إليه: الفرق وقوائم الإصدارات والأنواع — ومع كل معلومة طريق يعود إلى مصدرها.",
    rights:
      "الأغلفة والصور ملك لأصحابها ولأصحاب الحقوق. لا شيء مخزَّن هنا: كل شيء يُعرض من مصدره الأصلي على سبيل التوضيح.",
    noMonetisation: "بلا إعلانات، بلا اشتراك، بلا إيرادات.",
    sourcesAndRights: "المصادر والحقوق",
  },
};
