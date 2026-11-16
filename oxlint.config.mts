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
    // Runs only while Astro builds the pages, in Node.
    {
      files: ["src/build/**"],
      ...node,
      rules: { ...node.rules, "import/no-nodejs-modules": "off" },
    },
    {
      files: ["src/**/*.astro", "src/components/**", "src/layouts/**"],
      ...astro,
    },
    { files: ["*.config.*"], ...node },
    { files: ["e2e/**"], ...playwright },
  ],
});
