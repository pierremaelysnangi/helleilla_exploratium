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
import { CommandPalette } from "@/components/search/commandPalette";
// Lecteur audio global : élément <audio> unique de l'application
import { MiniPlayer } from "@/components/audio/miniPlayer";
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

// Métadonnées globales : titre par défaut avec template (%s remplacé par chaque page)
// et description du site utilisée pour le SEO.
export const metadata: Metadata = {
  // Base absolue requise pour résoudre les URLs OpenGraph/canonical
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ),
  title: {
    default: "Helleilla Exploratium",
    template: "%s | Helleilla Exploratium",
  },
  description:
    "L'encyclopédie collaborative du metal — genres, groupes, albums, membres.",
  openGraph: {
    type: "website",
    siteName: "Helleilla Exploratium",
    locale: "fr_FR",
  },
};

/**
 * Layout racine de l'application.
 * Définit la structure HTML globale (<html>, <body>), applique les polices,
 * l'anticrénelage et encapsule les pages enfants dans les Providers.
 *
 * @param children - Les pages rendues dans ce layout.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      // `dark` en dur : l'application n'a qu'une apparence. Le thème
      // n'étant plus résolu côté client, `suppressHydrationWarning`
      // devient inutile — et masquait de vrais écarts.
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Providers>
          <Header />
          {/* Avertissement anti-auto-XSS dans la console du navigateur */}
          <ConsoleWarning />
          {/* Palette de recherche rapide, disponible sur toutes les pages */}
          <CommandPalette />
          {/* flex-1 : le contenu pousse le footer en bas de viewport */}
          <main className="site-container flex-1 py-6">
            {/* Capture les erreurs de rendu des composants clients */}
            <ErrorBoundary>{children}</ErrorBoundary>
          </main>
          {/* Barre de lecture persistante, au-dessus du pied de page */}
          <MiniPlayer />
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
