import type { ReporterDescription } from "@playwright/test";
import { defineConfig, devices } from "@playwright/test";

const inCi = (process.env["CI"] ?? "") !== "",
  ciReporters: ReporterDescription[] = [
    ["dot"],
    ["github"],
    ["junit", { outputFile: "test-reports/e2e-junit.xml" }],
  ],
  firefox = { name: "firefox", use: { ...devices["Desktop Firefox"] } };

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: inCi,
  retries: inCi ? 2 : 0,
  /** "50%" is Playwright's default; exactOptionalPropertyTypes rejects undefined. */
  workers: inCi ? 1 : "50%",
  reporter: [
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ...(inCi ? ciReporters : []),
  ],
  use: {
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    baseURL: process.env["BASE_URL"] ?? "http://localhost:4321",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    ...(inCi ? [firefox] : []),
  ],
  /** The production build is what visitors get, so e2e runs against it. */
  webServer: {
    command: "pnpm build && pnpm preview",
    port: 4321,
    reuseExistingServer: !inCi,
    timeout: 120_000,
  },
});
