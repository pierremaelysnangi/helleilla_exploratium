declare module "swagger-ui-dist/swagger-ui-es-bundle.js" {
  type SwaggerUIOptions = {
    domNode?: Element | null;
    url?: string;
    spec?: unknown;
    deepLinking?: boolean;
    docExpansion?: "list" | "full" | "none";
    defaultModelsExpandDepth?: number;
    tryItOutEnabled?: boolean;
    persistAuthorization?: boolean;
    withCredentials?: boolean;
    presets?: unknown[];
    plugins?: unknown[];
    layout?: string;
    [key: string]: unknown;
  };

  const SwaggerUI: ((options: SwaggerUIOptions) => unknown) & {
    presets: { apis: unknown };
    plugins: Record<string, unknown>;
  };

  export default SwaggerUI;
}
