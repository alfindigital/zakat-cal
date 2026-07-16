import { defineConfig, devices } from "@playwright/test";

/**
 * Konfigurasi Playwright khusus CI (GitHub Actions).
 *
 * Menyalakan dev server Vite di port 8080, lalu menjalankan e2e specs
 * yang memverifikasi kontrak aksesibilitas (aria-live, aria-describedby,
 * role="alert", fokus otomatis, navigasi keyboard). Setiap perubahan
 * yang merusak relasi tersebut membuat build gagal.
 */
export default defineConfig({
  testDir: "./e2e",
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
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } },
    },
  ],
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 8080",
    url: "http://localhost:8080",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
