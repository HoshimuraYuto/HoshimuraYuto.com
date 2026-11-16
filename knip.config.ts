import type { KnipConfig } from "knip";

/** Entry files come from knip's Astro, Vitest and Playwright plugins. */
export default {
  /** Run by hand to regenerate a weather fixture; see src/lib/weather/README.md. */
  entry: ["scripts/*.ts"],
  /** Named in .secretlintrc.json, which knip does not read. */
  ignoreDependencies: ["@secretlint/secretlint-rule-preset-recommend"],
} satisfies KnipConfig;
