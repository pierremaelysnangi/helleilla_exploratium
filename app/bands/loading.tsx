/**
 * État de chargement (loading UI) pour la route /bands.
 * Affiché automatiquement par Next.js pendant le rendu du segment :
 * un squelette (skeleton) avec animation "pulse" imitant la structure de la page.
 */
export default function Loading() {
  // Conteneur principal avec animation de pulsation
  return (
    <div className="container mx-auto animate-pulse px-4 py-8">
      {/* Squelette simulant un titre */}
      <div className="bg-muted mb-4 h-8 w-48 rounded" />
      {/* Squelettes simulant des lignes de texte */}
      <div className="bg-muted mb-2 h-4 w-full rounded" />
      <div className="bg-muted h-4 w-3/4 rounded" />
    </div>
  );
}
