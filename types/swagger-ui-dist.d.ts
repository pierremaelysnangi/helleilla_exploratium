/**
 * @file Déclarations de types pour le module non typé `swagger-ui-dist`.
 *
 * Le paquet `swagger-ui-dist` n'expose pas de définitions TypeScript :
 * ce fichier déclare le module et l'interface de ses options afin
 * d'intégrer Swagger UI (ex. page de documentation d'API) de façon typée.
 */
declare module "swagger-ui-dist/swagger-ui-es-bundle.js" {
  /** Options acceptées par la fonction d'initialisation de Swagger UI. */
  type SwaggerUIOptions = {
    /** Élément DOM dans lequel monter l'interface Swagger. */
    domNode?: Element | null;
    /** URL du document OpenAPI à charger. */
    url?: string;
    /** Spécification OpenAPI inline (alternative à `url`). */
    spec?: unknown;
    /** Autorise les liens profonds vers les opérations (#/paths/...). */
    deepLinking?: boolean;
    /** Mode d'affichage initial des opérations : liste, tout ou rien. */
    docExpansion?: "list" | "full" | "none";
    /** Profondeur d'expansion par défaut des modèles de données. */
    defaultModelsExpandDepth?: number;
    /** Active le mode « Try it out » par défaut. */
    tryItOutEnabled?: boolean;
    /** Conserve l'autorisation entre les rechargements. */
    persistAuthorization?: boolean;
    /** Envoie les identifiants (cookies) lors des requêtes d'essai. */
    withCredentials?: boolean;
    /** Presets Swagger UI à charger (bundles de fonctionnalités). */
    presets?: unknown[];
    /** Plugins personnalisés. */
    plugins?: unknown[];
    /** Nom du layout racine à utiliser. */
    layout?: string;
    /** Tolérance aux options additionnelles non répertoriées. */
    [key: string]: unknown;
  };

  /**
   * Fonction principale d'initialisation de Swagger UI,
   * enrichie des presets et plugins exportés.
   */
  const SwaggerUI: ((options: SwaggerUIOptions) => unknown) & {
    presets: { apis: unknown };
    plugins: Record<string, unknown>;
  };

  export default SwaggerUI;
}
