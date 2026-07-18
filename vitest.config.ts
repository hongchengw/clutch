import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    env: {
      // Deterministic key for unit tests only — never used in production.
      TOKEN_ENCRYPTION_KEY: "0GjmMr1FpBYyYoZAbEQAd1pmXDeUOTE41ZLb+F+H97o=",
    },
  },
});
