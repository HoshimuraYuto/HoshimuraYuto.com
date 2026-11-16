import { expect } from "@playwright/test";

import { test } from "./offline";

test.describe("Smokeテスト", () => {
  test("JavaScriptエラーが発生しない", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    expect(errors).toHaveLength(0);
  });

  test("存在しないURLは404を返し、見出しで伝える", async ({ page }) => {
    const response = await page.goto("/no-such-page");

    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "ページが見つかりません",
    );
  });

  test("ページの終わりまで来ると、生き物が寝る", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("contentinfo").scrollIntoViewIfNeeded();

    await expect(page.locator(".critter").first()).toHaveAttribute("data-rest");
  });
});
