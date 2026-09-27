import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/e2e/setup.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 90000,
  expect: { timeout: 15000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    channel: "chrome",
  },
  projects: [
    {
      name: "mobile",
      use: { ...devices["Pixel 7"], defaultBrowserType: "chromium" },
    },
    { name: "desktop", use: { viewport: { width: 1440, height: 1000 } } },
    {
      name: "desktop-wide",
      use: { viewport: { width: 1920, height: 1080 } },
      testMatch: /(?:map-ux|guide)\.spec\.ts/,
    },
  ],
  webServer: {
    command: `"${process.execPath}" node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3100`,
    url: "http://127.0.0.1:3100",
    timeout: 180000,
    reuseExistingServer: false,
    env: {
      NEXT_E2E: "1",
      DATA_BACKEND: "local",
      LOCAL_DATA_DIR: ".test-data/e2e",
      LOCAL_ADMIN_PASSWORD: "test-only-password-2026",
      SESSION_SECRET: "test-only-session-secret-at-least-32-characters",
      NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:3100",
      NEXT_PUBLIC_MAPTILER_KEY: "",
    },
  },
});
