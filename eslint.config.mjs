import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import drizzle from "eslint-plugin-drizzle";
import prettier from "eslint-config-prettier";
import i18next from "eslint-plugin-i18next";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: { drizzle },
    rules: {
      // Empêche un delete/update sans .where() → catastrophe en prod
      "drizzle/enforce-delete-with-where": [
        "error",
        { drizzleObjectName: ["db", "tx"] },
      ],
      "drizzle/enforce-update-with-where": [
        "error",
        { drizzleObjectName: ["db", "tx"] },
      ],
    },
  },

  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],
    },
  },

  // Les scripts CLI ont le droit de logger librement
  {
    files: ["scripts/**/*.ts", "lib/queue/**/*.ts"],
    rules: { "no-console": "off" },
  },

  // Les tests ont le droit au any (mocks, fixtures)
  {
    files: ["**/*.test.ts", "**/__tests__/**/*.ts", "vitest.setup.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": "off",
    },
  },

  /**
   * Détecteur de textes non traduits.
   *
   * Toute chaîne lisible par un visiteur doit venir des dictionnaires
   * `lib/i18n/locales/`. Les campagnes de traduction manuelles ont
   * laissé passer, à trois reprises, des libellés figés en français :
   * un scan ponctuel se contente de ce qu'il sait reconnaître, alors
   * qu'une règle de lint échoue à la compilation et ne s'oublie pas.
   *
   * Portée : le texte des éléments JSX et les attributs que l'utilisateur
   * ou un lecteur d'écran restitue. Les attributs techniques
   * (`className`, `href`, `type`…) ne sont pas concernés.
   */
  {
    files: ["app/**/*.tsx", "components/**/*.tsx"],
    plugins: { i18next },
    rules: {
      "i18next/no-literal-string": [
        "error",
        {
          mode: "jsx-only",
          "jsx-attributes": {
            include: [
              "alt",
              "aria-description",
              "aria-label",
              "aria-placeholder",
              "aria-roledescription",
              "aria-valuetext",
              "ctaLabel",
              "heading",
              "label",
              "placeholder",
              "title",
            ],
          },
          // Ponctuation et séparateurs typographiques : ils n'ont rien
          // à traduire et alourdiraient les dictionnaires.
          words: {
            exclude: [
              "^[\\s\\d.,:;!?()\\[\\]{}«»\"'%#@&~^$*+/\\\\|—–\\-·•↗↑↓▾▸✓○×…]+$",
            ],
          },
        },
      ],
    },
  },

  // Ces fichiers n'affichent aucun texte au visiteur : layouts, routes
  // techniques, et tests dont les libellés attendus sont le sujet même
  // de l'assertion.
  {
    files: ["app/**/layout.tsx", "app/**/opengraph-image.tsx", "**/*.test.tsx"],
    rules: { "i18next/no-literal-string": "off" },
  },

  // Prettier en dernier : désactive les règles de formatage
  prettier,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "next-env.d.ts",
    "db/migrations/**",
  ]),
]);

export default eslintConfig;
