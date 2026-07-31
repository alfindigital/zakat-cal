import base from "/dev-server/playwright.ci.config.ts";
import { defineConfig } from "@playwright/test";
export default defineConfig({
  ...base,
  testDir: "/dev-server/e2e",
  retries: 0,
  use: {
    ...base.use,
    launchOptions: { executablePath: "/opt/ms-playwright/chromium-1194/chrome-linux/chrome" },
  },
});
