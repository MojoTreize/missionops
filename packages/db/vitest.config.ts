import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Reconstruire une base PGlite par fichier prend un peu de temps.
    testTimeout: 30_000,
  },
});
