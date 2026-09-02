"use client";

/**
 * <ErrorBoundary> — frontière d'erreur React pour la zone de contenu.
 * Capture les erreurs de rendu des composants clients (réseau, données)
 * et propose une relance sans décharger toute l'application.
 */

// Composant classe obligatoire pour componentDidCatch
import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  /** Journalisation locale (Sentry s'y branchera en prod). */
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div role="alert" className="metal-card m-4 p-6 text-center">
          <p className="metal-title text-base">Une erreur est survenue</p>
          <p className="text-muted-foreground mt-2 text-sm">
            {(this.state.error as Error).message ||
              "Erreur inattendue pendant l'affichage."}
          </p>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="bg-primary text-primary-foreground mt-4 rounded-md px-4 py-2 text-sm font-semibold tracking-wide uppercase"
          >
            Réessayer
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
