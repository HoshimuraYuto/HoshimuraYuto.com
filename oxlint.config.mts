import {
  astro,
  base,
  browser,
  node,
  playwright,
} from "@hoshimurayuto/code-rules/oxlint";
import { defineConfig } from "oxlint";

export default defineConfig({
  extends: [base],
  overrides: [
    { files: ["src/**"], ...browser },
    {
      files: ["src/**/*.astro", "src/components/**", "src/layouts/**"],
      ...astro,
    },
    { files: ["*.config.*"], ...node },
    { files: ["e2e/**"], ...playwright },
  ],
});
