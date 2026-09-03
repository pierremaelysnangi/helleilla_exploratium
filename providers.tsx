"use client";

// Client + Provider de TanStack Query (cache et gestion des requêtes serveur)
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// Adaptateur nuqs requis pour les query params typés en App Router
import { NuqsAdapter } from "nuqs/adapters/next/app";
// useState pour créer le QueryClient une seule fois par montage client
import { useState } from "react";
// Dictionnaire descendu aux composants clients
import { I18nProvider } from "@/lib/i18n/client";
import type { Locale } from "@/lib/i18n/locales";
import type { Dictionary } from "@/lib/i18n/dictionaries";

/**
 * Composant englobant tous les providers côté client de l'application.
 * Doit être placé au plus haut niveau du layout.
 *
 * Plus de fournisseur de thème : l'application n'a qu'une seule
 * apparence, sombre, appliquée directement sur `<html>`. Un mode clair
 * n'a pas de sens ici — toute la direction artistique repose sur des
 * contrastes de noir, et il était par ailleurs la source d'un décalage
 * d'hydratation sur chaque page.
 *
 * @param children - L'arbre React (pages/layouts) à envelopper.
 * @returns Les providers imbriqués autour des enfants.
 */
export function Providers({
  children,
  locale,
  dictionary,
}: {
  children: React.ReactNode;
  locale: Locale;
  dictionary: Dictionary;
}) {
  // Création paresseuse : une seule instance de QueryClient par cycle de vie,
  // même en cas de re-rendus StrictMode.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // données considérées fraîches pendant 60 s
            refetchOnWindowFocus: false, // pas de rechargement au focus de l'onglet
          },
        },
      }),
  );

  return (
    <I18nProvider locale={locale} t={dictionary}>
      <NuqsAdapter>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </NuqsAdapter>
    </I18nProvider>
  );
}
