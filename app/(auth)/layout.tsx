/**
 * Layout du segment d'authentification `(auth)`.
 * Route group sans préfixe d'URL : /sign-in et /sign-up partagent ce
 * gabarit centré, hors navigation principale.
 */

import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        padding: "1rem",
      }}
    >
      <div
        style={{
          width: "min(100%, 420px)",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        {children}
      </div>
    </main>
  );
}
