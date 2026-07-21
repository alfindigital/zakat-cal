import { defineConfig, devices } from "@playwright/test";

/**
 * Konfigurasi Playwright khusus visual regression.
 *
 * Menjalankan spec `beranda-visual.spec.ts` di dua browser (Chromium & Firefox)
 * agar perubahan spacing/layout terdeteksi konsisten lintas engine render.
 * Snapshot disimpan per-project (chromium/firefox) secara otomatis oleh
 * Playwright — jangan gabungkan baseline antar browser.
 */
export default defineConfig({
  testDir: "./e2e",
  testMatch: /beranda-visual\.spec\.ts/,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: "http://localhost:8080",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
  ],
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 8080",
    url: "http://localhost:8080",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
