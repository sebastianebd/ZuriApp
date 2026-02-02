import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    exclude: ["node_modules", "dist", ".idea", ".git", ".cache"],
    coverage: {
      provider: "v8",
      all: true,
      include: ["**/*.ts"],
      exclude: [
        "node_modules",
        "dist",
        "tests/**",
        "**/*.test.ts",
        "**/*.d.ts",
        "**/*.config.ts",
        "app.ts",
        "server.ts",
      ],
    },
  },
});
