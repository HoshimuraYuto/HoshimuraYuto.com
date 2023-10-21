import { test, expect } from "@playwright/test";

import siteConfig from "../../app/config/siteConfig";

test("should match header navigation title with page title", async ({
  page,
}) => {
  for (const { title, slug } of siteConfig.headerPageNav) {
    await page.goto(`http://localhost:3000${slug}`);

    const el = page.locator(`[aria-label="page title"]`);
    const text = await el.textContent();

    expect(text).toBe(title);
  }
});

test("should navigate to the page when header navigation items are clicked", async ({
  page,
}) => {
  const dropdownOpenEl = page.locator(`[aria-label="page changer"]`);

  for (const { title, slug } of siteConfig.headerPageNav) {
    await page.goto(`http://localhost:3000${slug}`);

    await dropdownOpenEl.click();

    const dropdownTargetEl = page.locator(
      `[aria-label="page dropdown"] div:has-text("${title}")`,
    );
    await dropdownTargetEl.click();

    const el = page.locator(`[aria-label="page title"]`);
    const text = await el.textContent();

    expect(text).toBe(title);
  }
});
