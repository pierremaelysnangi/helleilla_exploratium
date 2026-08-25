"use client";

/**
 * <TurnstileWidget> — CAPTCHA invisible Cloudflare.
 * Charge le script officiel une seule fois, rend le widget et expose le
 * token via le champ caché `cf-turnstile-response` attendu par la
 * Server Action. Si `NEXT_PUBLIC_TURNSTILE_SITE_KEY` est absent, ne
 * rend rien (vérification désactivée côté serveur également).
 */

// Références DOM pour l'injection du script et du conteneur
import { useEffect, useRef } from "react";

/** Clé de site publique (build-time) ; absent = widget désactivé. */
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

/** Type minimal du global injecté par le script Turnstile. */
type TurnstileGlobal = {
  render: (
    el: HTMLElement,
    options: { sitekey: string; callback: (token: string) => void },
  ) => string;
  reset: (widgetId?: string) => void;
};

/** Injecte le script challenges.cloudflare.com une seule fois par page. */
function loadScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector("script[data-turnstile]")) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src =
      "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.dataset.turnstile = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Chargement Turnstile échoué"));
    document.head.appendChild(script);
  });
}

export function TurnstileWidget() {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!SITE_KEY || !containerRef.current) return;

    let widgetId: string | undefined;
    void loadScript()
      .then(() => {
        const turnstile = (window as unknown as { turnstile?: TurnstileGlobal })
          .turnstile;
        if (!turnstile || !containerRef.current) return;
        widgetId = turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          // Le token est copié dans un input classique : FormData le
          // transmettra à la Server Action comme n'importe quel champ
          callback: (token: string) => {
            if (inputRef.current) inputRef.current.value = token;
          },
        });
      })
      .catch(() => {
        console.error("[turnstile] Script non chargé");
      });

    return () => {
      // Nettoyage React strict-mode : réinitialise si possible
      const turnstile = (window as unknown as { turnstile?: TurnstileGlobal })
        .turnstile;
      if (widgetId !== undefined && turnstile?.reset) turnstile.reset(widgetId);
    };
  }, []);

  // Désactivé : aucun rendu, la Server Action acceptera l'absence de token
  if (!SITE_KEY) return null;

  return (
    <div>
      <div ref={containerRef} />
      {/* Token transmis à la Server Action via FormData */}
      <input type="hidden" name="cf-turnstile-response" ref={inputRef} />
    </div>
  );
}
