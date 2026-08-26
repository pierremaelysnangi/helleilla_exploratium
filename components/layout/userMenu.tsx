"use client";

/**
 * <UserMenu> — zone authentifiée du header.
 * Utilise la session Better Auth côté client (useSession) :
 * - non connecté -> liens Connexion / Inscription ;
 * - connecté     -> nom affiché + bouton Déconnexion (Server Action
 *   signOutAction, qui révoque la session serveur puis redirige).
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

  return (
    <div className="flex items-center gap-3">
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
