/**
 * <AuthHeading> — titre commun aux pages d'authentification.
 *
 * Reprend la composition des en-têtes du catalogue (titre gravé, filet
 * rouge, sous-titre discret) pour que ces pages cessent de paraître
 * étrangères au reste du site.
 */

type AuthHeadingProps = {
  title: string;
  /** Une phrase qui dit ce que la page attend, ou ce qu'elle garantit. */
  subtitle: string;
};

export function AuthHeading({ title, subtitle }: AuthHeadingProps) {
  return (
    <header className="flex flex-col gap-2">
      <h1 className="metal-title text-2xl">{title}</h1>
      <div className="metal-rule w-24" />
      <p className="text-muted-foreground text-sm leading-relaxed">
        {subtitle}
      </p>
    </header>
  );
}
