import { expect } from "@playwright/test";

import { test } from "./offline";

for (const path of ["/", "/credits", "/privacy"]) {
  test(`${path} の外部リンクはすべて別タブで開く`, async ({ page }) => {
    await page.goto(path);

    // querySelectorAll stays out of shadow roots: the dev server's toolbar has its own links there.
    const external = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLAnchorElement>('a[href^="http"]')].map(
        (a) => ({
          href: a.href,
          target: a.target,
          rel: a.rel,
        }),
      ),
    );

    expect(external.length).toBeGreaterThan(0);
    for (const link of external) {
      expect(link, link.href).toMatchObject({
        target: "_blank",
        rel: expect.stringMatching(/noopener/),
      });
    }
  });
}
