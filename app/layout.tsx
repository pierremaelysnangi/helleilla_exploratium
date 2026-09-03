// Type des métadonnées exportées
import type { Metadata } from "next";
// Polices Google (Geist et sa variante monospace) auto-hébergées par Next.js
import { Geist, Geist_Mono } from "next/font/google";
// Styles globaux de l'application (thème Tailwind/shadcn)
import "./globals.css";
// Providers clients (theming, etc.) enveloppant toute l'application
import { Providers } from "@/providers";
// Chrome global du site : en-tête, pied de page et palette Ctrl+K
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ConsoleWarning } from "@/components/layout/consoleWarning";
import { SITE_NAME } from "@/lib/site";
import { getTranslations } from "@/lib/i18n/server";
import { localeDir } from "@/lib/i18n/locales";
import { CommandPalette } from "@/components/search/commandPalette";
// Lecteur audio global : élément <audio> unique de l'application
import { ErrorBoundary } from "@/components/shared/errorBoundary";

// Police sans-serif principale, exposée via la variable CSS --font-geist-sans
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Police à chasse fixe, exposée via la variable CSS --font-geist-mono
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Métadonnées globales : titre par défaut avec template (%s remplacé par
 * chaque page) et description du site.
 *
 * Résolues par requête, et non figées : le titre de l'onglet et la
 * description partagée sont des textes lus, au même titre que la page.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getTranslations();
  return {
    // Base absolue requise pour résoudre les URLs OpenGraph/canonical
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    ),
    title: {
      default: SITE_NAME,
      template: `%s | ${SITE_NAME}`,
    },
    description: t.meta.siteDescription,
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale,
    },
  };
}

/**
 * Layout racine de l'application.
 * Définit la structure HTML globale (<html>, <body>), applique les polices,
 * l'anticrénelage et encapsule les pages enfants dans les Providers.
 *
 * @param children - Les pages rendues dans ce layout.
 */
export default async function RootLayout({ children }: LayoutProps<"/">) {
  // La langue est résolue côté serveur : le cookie du visiteur d'abord,
  // sinon les préférences déclarées par son navigateur.
  const { locale, t } = await getTranslations();

  return (
    <html
      lang={locale}
      dir={localeDir(locale)}
      // `dark` en dur : l'application n'a qu'une apparence. Le thème
      // n'étant plus résolu côté client, `suppressHydrationWarning`
      // devient inutile — et masquait de vrais écarts.
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/*
          Dark Reader réécrit le DOM avant l'hydratation de React : il
          pose `style` et `data-darkreader-*` sur chaque SVG, et React
          signale alors un écart entre le rendu serveur et le client sur
          toutes les pages. L'extension reconnaît ce verrou et se retire
          d'elle-même — ce qui est ici la bonne issue, l'application
          étant déjà sombre et n'ayant rien à assombrir.
        */}
        <meta name="darkreader-lock" />
      </head>
      <body className="flex min-h-full flex-col">
        <Providers locale={locale} dictionary={t}>
          <Header locale={locale} t={t} />
          {/* Avertissement anti-auto-XSS dans la console du navigateur */}
          <ConsoleWarning />
          {/* Palette de recherche rapide, disponible sur toutes les pages */}
          <CommandPalette />
          {/* flex-1 : le contenu pousse le footer en bas de viewport */}
          <main className="site-container flex-1 py-6">
            {/* Capture les erreurs de rendu des composants clients */}
            <ErrorBoundary
              labels={{ error: t.common.error, retry: t.common.retry }}
            >
              {children}
            </ErrorBoundary>
          </main>
          <Footer t={t} />
        </Providers>
      </body>
    </html>
  );
}
