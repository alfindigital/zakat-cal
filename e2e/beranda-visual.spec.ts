import { test, expect } from "../playwright-fixture";

/**
 * Visual regression test untuk halaman Beranda (Index).
 *
 * Menyimpan snapshot layout di beberapa breakpoint (mobile, tablet, desktop)
 * agar perubahan spacing/typography/padding di masa depan tidak diam-diam
 * merusak tata letak. Jika layout memang sengaja diubah, jalankan:
 *
 *   npx playwright test --config=playwright.ci.config.ts \
 *     e2e/beranda-visual.spec.ts --update-snapshots
 *
 * lalu commit ulang berkas snapshot yang diperbarui.
 */

const VIEWPORTS = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1280, height: 900 },
] as const;

test.describe("Beranda — visual regression", () => {
  for (const vp of VIEWPORTS) {
    test(`layout stabil di ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.addInitScript(() => {
        try {
          window.localStorage.clear();
        } catch {
          /* ignore */
        }
      });
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/");

      // Tunggu shell utama render + font stabil sebelum snapshot.
      await expect(page.getByRole("heading", { name: /Kalkulator Zakat/ })).toBeVisible();
      await page.evaluate(() => document.fonts?.ready);
      // Beri jeda singkat agar animasi framer-motion (fade/slide) selesai.
      await page.waitForTimeout(600);

      await expect(page).toHaveScreenshot(`beranda-${vp.name}.png`, {
        fullPage: true,
        animations: "disabled",
        caret: "hide",
        // Toleransi kecil untuk anti-aliasing lintas platform.
        maxDiffPixelRatio: 0.02,
      });
    });
  }
});
