"use client";

/**
 * <UserMenu> — zone authentifiée du header.
 * Utilise la session Better Auth côté client (useSession) :
 * - non connecté -> liens Connexion / Inscription ;
 * - connecté     -> accès aux contributions, nom affiché et bouton
 *   Déconnexion (Server Action signOutAction, qui révoque la session
 *   serveur puis redirige).
 *
 * Les liens de contribution vivent ici et non dans <Nav> : celle-ci est la
 * navigation publique du catalogue, alors que ces pages exigent une session.
 * L'affichage suit le rôle par confort ; l'autorisation reste serveur.
 */

// Session Better Auth + action serveur de déconnexion
import { useSession } from "@/lib/auth-client";
import { signOutAction } from "@/lib/actions/auth";
import Link from "next/link";
import { useT } from "@/lib/i18n/client";

type UserMenuProps = {
  /**
   * Disposition en LISTE, pour le menu replié des petits écrans.
   *
   * Les mêmes liens y sont empilés au lieu d'être alignés : à 390 px de
   * large, « Contribuer · Mes dossiers · Relecture · Admin · nom ·
   * Déconnexion » repassait sur trois lignes irrégulières, chaque lien
   * finissant à une position différente et difficile à viser au pouce.
   */
  stacked?: boolean;
};

export function UserMenu({ stacked = false }: UserMenuProps) {
  const t = useT();
  const { data: session, isPending } = useSession();

  /** Classes du conteneur, selon la disposition demandée. */
  const container = stacked
    ? "flex flex-col items-stretch gap-1"
    : "flex flex-wrap items-center gap-x-2 gap-y-1 sm:gap-x-3";

  /** Un lien de menu : pleine largeur et cible confortable en liste. */
  const link = stacked
    ? "hover:bg-accent/30 block rounded-md px-2 py-2.5 text-sm tracking-wide uppercase transition-colors"
    : "metal-nav-link";

  // État pendant le chargement de session : placeholder stable
  if (isPending) {
    return <span className="text-muted-foreground text-sm">{"…"}</span>;
  }

  if (!session) {
    return (
      <div
        className={stacked ? "flex flex-col gap-2" : "flex items-center gap-3"}
      >
        <Link href="/sign-in" className={link}>
          {t.auth.signIn}
        </Link>
        <Link
          href="/sign-up"
          className={`bg-primary text-primary-foreground rounded-md font-semibold tracking-wide uppercase transition-opacity hover:opacity-90 ${
            stacked
              ? "px-3 py-2.5 text-center text-sm"
              : "px-2.5 py-1.5 text-xs sm:px-3 sm:text-sm sm:tracking-widest"
          }`}
        >
          {t.auth.signUp}
        </Link>
      </div>
    );
  }

  // Rôle porté par la session Better Auth ; repli au plus faible
  const role = session.user.role ?? "user";
  const canModerate = role === "moderator" || role === "admin";
  const isAdmin = role === "admin";

  return (
    <div className={container}>
      <Link href="/contributions" className={link}>
        {t.auth.contribute}
      </Link>
      <Link href="/contributions/mes-dossiers" className={link}>
        {t.auth.myContributions}
      </Link>
      {canModerate && (
        <Link href="/contributions/relecture" className={link}>
          {t.auth.review}
        </Link>
      )}
      {isAdmin && (
        <Link href="/admin" className={link}>
          {t.auth.admin}
        </Link>
      )}
      <Link
        href="/profile"
        className={
          stacked
            ? "text-muted-foreground px-2 py-2 text-sm hover:underline"
            : "text-muted-foreground text-sm hover:underline"
        }
      >
        {session.user.name}
      </Link>
      {/* Server Action : révocation serveur + purge du cookie de session */}
      <form
        action={signOutAction}
        className={stacked ? "px-2 pt-1" : undefined}
      >
        <button
          type="submit"
          className="metal-nav-link border-border hover:border-primary/40 w-full rounded-md border px-2 py-1"
        >
          {t.auth.signOut}
        </button>
      </form>
    </div>
  );
}
