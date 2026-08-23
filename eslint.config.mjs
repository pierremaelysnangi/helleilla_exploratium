import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import drizzle from "eslint-plugin-drizzle";
import prettier from "eslint-config-prettier";;

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

