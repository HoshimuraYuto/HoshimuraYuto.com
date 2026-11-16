import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://hoshimurayuto.com",
  /** The stylesheet is a few kilobytes: inlining it saves a round trip before the first paint. */
  build: { inlineStylesheets: "always" },
  /** Fetch other pages when a link is hovered or tapped, so moving between them feels instant. */
  prefetch: { prefetchAll: true, defaultStrategy: "hover" },
});
