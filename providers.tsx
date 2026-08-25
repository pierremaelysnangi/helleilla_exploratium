"use client";

// Client + Provider de TanStack Query (cache et gestion des requêtes serveur)
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// Fournisseur de thème (clair/sombre) basé sur next-themes
import { ThemeProvider } from "next-themes";
// useState pour créer le QueryClient une seule fois par montage client
import { useState } from "react";

/**
 * Composant englobant tous les providers côté client de l'application.
 * Doit être placé au plus haut niveau du layout pour que tous les composants
 * clients bénéficient du thème et du cache de requêtes.
 *
 * @param children - L'arbre React (pages/layouts) à envelopper.
 * @returns Les providers imbriqués autour des enfants.
 */
export function Providers({ children }: { children: React.ReactNode }) {
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
    // Thème géré via la classe HTML, sombre par défaut, système respecté
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ThemeProvider>
  );
}
