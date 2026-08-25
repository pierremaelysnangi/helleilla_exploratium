"use client";

/**
 * Page d'erreur locale du segment /genres/[slug].
 * Composant client obligatoire ("use client") : intercepte les erreurs
 * survenant dans ce sous-arbre sans faire planter toute l'application.
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
