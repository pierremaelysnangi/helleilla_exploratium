// Composant Link de Next.js pour la navigation côté client
import Link from "next/link";

/**
 * Page 404 globale (app/not-found.tsx).
 * Rendue automatiquement par Next.js lorsqu'aucune route ne correspond à l'URL demandée.
 * Propose un lien de retour vers la page d'accueil.
 */
export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-8 text-center">
      <h2 className="text-2xl font-bold">404 — Page introuvable</h2>
      <p className="text-muted-foreground mt-2">
        Cette page n&apos;existe pas ou plus.
      </p>
      <Link href="/" className="text-primary mt-4 inline-block underline">
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
