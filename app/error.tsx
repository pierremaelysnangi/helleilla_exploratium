"use client";

/**
 * Page d'erreur globale du segment racine (app/error.tsx).
 * Composant client obligatoire ("use client") : intercepte toute erreur
 * non gérée du rendu et propose à l'utilisateur de réessayer.
 *
 * @param error - L'erreur interceptée ; `digest` est l'identifiant optionnel généré en production.
 * @param reset - Fonction fournie par Next.js pour relancer le rendu du segment en erreur.
 */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Affiche le message d'erreur et un bouton "Réessayer" appelant reset()
  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-destructive text-xl font-bold">
        Une erreur est survenue
      </h2>
      <p className="text-muted-foreground mt-2">{error.message}</p>
      <button
        onClick={reset}
        className="bg-primary text-primary-foreground mt-4 rounded px-4 py-2"
      >
        Réessayer
      </button>
    </div>
  );
}
