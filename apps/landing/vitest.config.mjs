import { defineConfig } from "vitest/config";

export default defineConfig({
  // Avoid loading postcss.config.mjs (Tailwind v4) during pure unit tests
  css: false,
  test: {
    environment: "node",
    css: false,
  },
});

