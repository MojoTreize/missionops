import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "**/.turbo/**",
      "**/coverage/**",
      "**/next-env.d.ts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
  },
  // Frontière d'accès aux données (B1.7) : seul `packages/db` peut créer le
  // client de base (driver postgres ou fabrique Drizzle). Partout ailleurs, on
  // passe par l'API typée de `@missionops/db` — impossible d'ouvrir une
  // connexion « nue » qui contournerait l'isolation multi-tenant.
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "postgres",
                "drizzle-orm/postgres-js",
                "drizzle-orm/pglite",
                "drizzle-orm/pglite/*",
                "@electric-sql/pglite",
              ],
              message:
                "Le client de base ne s'instancie que dans packages/db. Ailleurs, importez l'API typée de @missionops/db.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["packages/db/**"],
    rules: {
      "no-restricted-imports": "off",
    },
  },
  prettier,
);
