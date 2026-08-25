/**
 * Composant client affichant la documentation interactive de l'API
 * via Swagger UI. Marqué "use client" car il manipule le DOM et charge
 * dynamiquement la librairie swagger-ui-dist côté navigateur.
 */
"use client";

// `useEffect` / `useRef` : cycle de vie React et référence sur le div hôte.
// Import du CSS officiel de Swagger UI pour le rendu de l'interface.
import { useEffect, useRef } from "react";
import "swagger-ui-dist/swagger-ui.css";

/**
 * Composant `ApiDocs` — monte Swagger UI dans un div.
 *
 * Le bundle Swagger UI est importé dynamiquement dans `useEffect`
 * (chargement paresseux, évite le SSR de la librairie). La config active
 * les liens profonds, l'expansion en liste, "Try it out" avec envoi des
 * cookies (`withCredentials`) et la persistance de l'autorisation.
 *
 * @returns Un élément `<div>` recevant le rendu de Swagger UI.
 */
export function ApiDocs() {
  // Référence sur le conteneur DOM où Swagger UI s'injectera.
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Drapeau anti-fuite : évite d'initialiser Swagger UI si le composant
    // a été démonté avant la fin du chargement asynchrone du module.
    let cancelled = false;

    (async () => {
      // Import dynamique du bundle ES de Swagger UI (côté client uniquement).
      const { default: SwaggerUI } =
        await import("swagger-ui-dist/swagger-ui-es-bundle.js");
      if (cancelled || !ref.current) return;

      // Initialisation : consomme la spécification OpenAPI servie par
      // /api/openapi.json et configure le comportement de l'interface.
      SwaggerUI({
        domNode: ref.current,
        url: "/api/openapi.json",
        deepLinking: true,
        docExpansion: "list",
        defaultModelsExpandDepth: 1,
        tryItOutEnabled: true,
        persistAuthorization: true,
        withCredentials: true,
        presets: [SwaggerUI.presets.apis],
      });
    })();
    // Nettoyage : marque l'effet comme annulé au démontage.
    return () => {
      cancelled = true;
    };
  }, []);

  return <div ref={ref} />;
}
