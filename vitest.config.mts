/// <reference types="vitest/config" />
import { getViteConfig } from "astro/config";

const inCi = (process.env["CI"] ?? "") !== "";

export default getViteConfig({
  test: {
    passWithNoTests: true,
    environment: "jsdom",
    setupFiles: ["@testing-library/jest-dom/vitest"],
    include: ["src/**/*.test.ts"],
    reporters: inCi ? ["default", "junit"] : ["default"],
    outputFile: { junit: "./test-reports/unit-junit.xml" },
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary", "lcov"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts"],
      thresholds: { lines: 70, functions: 70, branches: 70, statements: 70 },
    },
  },
});
