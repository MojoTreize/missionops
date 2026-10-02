import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/**/index.ts"],
      // Plan §2.5 : 90 % sur le domaine ; B3.1 : 100 % sur l'argent, sans exception.
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
        "src/money/**": { lines: 100, functions: 100, branches: 100, statements: 100 },
      },
    },
  },
});
