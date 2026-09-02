/**
 * <Footer> — pied de page global (Server Component, statique).
 * Mention du projet, licence AGPL et avertissement éditorial :
 * contenu encyclopédique contribué, médias hébergés par les plateformes
 * officielles (aucun média généré ni stocké localement).
 */

export function Footer() {
  return (
    <footer className="border-border bg-background/60 border-t">
      <div className="text-muted-foreground site-container flex flex-col gap-2 py-6 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p>
          <span className="metal-title text-sm">Helleilla Exploratium</span> —
          encyclopédie collaborative du metal.
        </p>
        <p className="text-xs">
          Médias © leurs plateformes officielles (Spotify, YouTube, Bandcamp,
          Deezer) · Contenu sous licence AGPL-3.0
        </p>
      </div>
    </footer>
  );
}
