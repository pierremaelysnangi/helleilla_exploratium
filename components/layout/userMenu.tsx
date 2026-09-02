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

export function UserMenu() {
  const { data: session, isPending } = useSession();

  // État pendant le chargement de session : placeholder stable
  if (isPending) {
    return <span className="text-muted-foreground text-sm">…</span>;
  }

  if (!session) {
    return (
      <div className="flex items-center gap-3">
        <Link href="/sign-in" className="metal-nav-link">
          Connexion
        </Link>
        <Link
          href="/sign-up"
          className="bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-sm font-semibold tracking-widest uppercase transition-opacity hover:opacity-90"
        >
          Inscription
        </Link>
      </div>
    );
  }

  // Rôle porté par la session Better Auth ; repli au plus faible
  const role = session.user.role ?? "user";
  const canModerate = role === "moderator" || role === "admin";

  return (
    <div className="flex items-center gap-3">
      <Link href="/contributions" className="metal-nav-link">
        Contribuer
      </Link>
      <Link href="/contributions/mes-dossiers" className="metal-nav-link">
        Mes dossiers
      </Link>
      {canModerate && (
        <Link href="/contributions/relecture" className="metal-nav-link">
          Relecture
        </Link>
      )}
      <span className="text-muted-foreground text-sm">{session.user.name}</span>
      {/* Server Action : révocation serveur + purge du cookie de session */}
      <form action={signOutAction}>
        <button
          type="submit"
          className="metal-nav-link border-border hover:border-primary/40 rounded-md border px-2 py-1"
        >
          Déconnexion
        </button>
      </form>
    </div>
  );
}
