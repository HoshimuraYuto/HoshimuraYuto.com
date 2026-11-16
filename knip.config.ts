import type { KnipConfig } from "knip";

/** Entry files come from knip's Astro, Vitest and Playwright plugins. */
export default {
  /** Named in .secretlintrc.json, which knip does not read. */
  ignoreDependencies: ["@secretlint/secretlint-rule-preset-recommend"],
} satisfies KnipConfig;
