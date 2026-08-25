// Type des métadonnées exportées
import type { Metadata } from "next";
// Polices Google (Geist et sa variante monospace) auto-hébergées par Next.js
import { Geist, Geist_Mono } from "next/font/google";
// Styles globaux de l'application (thème Tailwind/shadcn)
import "./globals.css";
// Providers clients (theming, etc.) enveloppant toute l'application
import { Providers } from "@/providers";

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
  title: {
    default: "Helleilla Exploratium",
    template: "%s | Helleilla Exploratium",
  },
  description:
    "L'encyclopédie collaborative du metal — genres, groupes, albums, membres.",
};

/**
 * Layout racine de l'application.
 * Définit la structure HTML globale (<html>, <body>), applique les polices,
 * l'anticrénelage et encapsule les pages enfants dans les Providers.
 *
 * @param children - Les pages rendues dans ce layout.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  // suppressHydrationWarning : évite les avertissements d'hydratation
  // causés par l'injection du thème (mode sombre) côté client.
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
