"use client";

import { useEffect, useRef } from "react";
import "swagger-ui-dist/swagger-ui.css";

export function ApiDocs() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { default: SwaggerUI } =
        await import("swagger-ui-dist/swagger-ui-es-bundle.js");
      if (cancelled || !ref.current) return;

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
    return () => {
      cancelled = true;
    };
  }, []);

  return <div ref={ref} />;
}
