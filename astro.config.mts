import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://hoshimurayuto.com",
  /** Workers static assets serve credits.html at /credits; a credits/ folder would answer /credits with a redirect to /credits/. */
  trailingSlash: "never",
  /** The stylesheet is a few kilobytes: inlining it saves a round trip before the first paint. */
  build: { format: "file", inlineStylesheets: "always" },
  /** Fetch other pages when a link is hovered or tapped, so moving between them feels instant. */
  prefetch: { prefetchAll: true, defaultStrategy: "hover" },
});
