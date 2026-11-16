import { test as base } from "@playwright/test";

const FIXTURES = "src/lib/weather/fixtures";

/** The real APIs' answers change, and the unauthenticated GitHub quota is shared by the CI's IP. */
const test = base.extend({
  page: async ({ page, baseURL }, use) => {
    const origin = new URL(baseURL ?? "http://localhost").origin;
    await page.route(
      (url) => url.origin !== origin,
      async (route) => {
        const url = new URL(route.request().url());
        if (url.hostname === "mesonet.agron.iastate.edu") {
          await route.fulfill({
            path: `${FIXTURES}/iem-rjtt-2026-10-24.csv`,
            contentType: "text/csv",
          });
        } else if (url.hostname === "www.jma.go.jp") {
          await route.fulfill({
            path: `${FIXTURES}/jma-forecast-130000.txt`,
            contentType: "application/json",
          });
        } else if (url.hostname === "api.github.com") {
          await route.fulfill({ json: [] });
        } else {
          await route.abort();
        }
      },
    );
    await use(page);
  },
});

export { test };
