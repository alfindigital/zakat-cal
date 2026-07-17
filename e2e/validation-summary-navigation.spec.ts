import { test, expect } from "../playwright-fixture";

/**
 * Kontrak navigasi `ValidationSummary`:
 *
 * - setiap item pada daftar ringkasan mengarah ke field yang benar
 *   (klik → fokus & scroll ke input dengan id sesuai)
 * - saat mengklik item, TIDAK ada `role="alert"` tambahan yang muncul
 *   selama navigasi (jumlah alert tetap konsisten)
 * - urutan item ringkasan menghormati urutan visual field
 */
test.describe("Validation summary — navigasi item ke field yang benar", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        window.localStorage.clear();
      } catch {
        /* ignore */
      }
    });
    await page.goto("/");
    await page.getByRole("button", { name: "Zakat Fitrah" }).first().click();
  });

  test("mode uang: klik item 'Jumlah Jiwa' → fokus #fitrah-jiwa; klik 'Tarif per Jiwa' → fokus #fitrah-uang", async ({ page }) => {
    await page.getByRole("radio", { name: /Uang/ }).click();
    await page.getByRole("button", { name: "Simpan ke Riwayat" }).first().click();

    const summary = page.locator('[role="region"][aria-labelledby="validation-summary-title"]');
    await expect(summary).toBeVisible();

    // Klik item 'Tarif per Jiwa' → fokus pindah ke #fitrah-uang
    await summary.getByRole("button", { name: /Tarif per Jiwa/i }).click();
    await expect(page.locator("#fitrah-uang")).toBeFocused();

    // Klik item 'Jumlah Jiwa' → fokus pindah ke #fitrah-jiwa
    await summary.getByRole("button", { name: /Jumlah Jiwa/i }).click();
    await expect(page.locator("#fitrah-jiwa")).toBeFocused();
  });

  test("mode beras: item 'Jumlah Jiwa' mengarah ke #fitrah-jiwa", async ({ page }) => {
    await page.getByRole("button", { name: "Simpan ke Riwayat" }).first().click();

    const summary = page.locator('[role="region"][aria-labelledby="validation-summary-title"]');
    await expect(summary).toBeVisible();

    await summary.getByRole("button", { name: /Jumlah Jiwa/i }).click();
    await expect(page.locator("#fitrah-jiwa")).toBeFocused();
  });

  test("navigasi antar item TIDAK memunculkan role=alert tambahan", async ({ page }) => {
    await page.getByRole("radio", { name: /Uang/ }).click();
    await page.getByRole("button", { name: "Simpan ke Riwayat" }).first().click();

    const summary = page.locator('[role="region"][aria-labelledby="validation-summary-title"]');
    await expect(summary).toBeVisible();

    // Snapshot jumlah role=alert setelah submit (baseline)
    const baselineAlerts = await page.locator('[role="alert"]').count();
    expect(baselineAlerts).toBeGreaterThan(0);

    // Klik beberapa kali antar item — jumlah role=alert harus stabil
    for (let i = 0; i < 3; i++) {
      await summary.getByRole("button", { name: /Tarif per Jiwa/i }).click();
      await expect(page.locator("#fitrah-uang")).toBeFocused();
      expect(await page.locator('[role="alert"]').count()).toBe(baselineAlerts);

      await summary.getByRole("button", { name: /Jumlah Jiwa/i }).click();
      await expect(page.locator("#fitrah-jiwa")).toBeFocused();
      expect(await page.locator('[role="alert"]').count()).toBe(baselineAlerts);
    }

    // Region ringkasan sendiri tidak boleh punya role=alert internal
    await expect(summary.locator('[role="alert"]')).toHaveCount(0);
  });

  test("target field ter-scroll masuk viewport saat item ringkasan diklik", async ({ page }) => {
    await page.getByRole("radio", { name: /Uang/ }).click();
    await page.getByRole("button", { name: "Simpan ke Riwayat" }).first().click();

    const summary = page.locator('[role="region"][aria-labelledby="validation-summary-title"]');
    await expect(summary).toBeVisible();

    const uang = page.locator("#fitrah-uang");
    await summary.getByRole("button", { name: /Tarif per Jiwa/i }).click();
    await expect(uang).toBeFocused();
    await expect(uang).toBeInViewport();

    const jiwa = page.locator("#fitrah-jiwa");
    await summary.getByRole("button", { name: /Jumlah Jiwa/i }).click();
    await expect(jiwa).toBeFocused();
    await expect(jiwa).toBeInViewport();
  });

  test("urutan item ringkasan mengikuti urutan field (Jumlah Jiwa lebih dulu dari Tarif per Jiwa)", async ({ page }) => {
    await page.getByRole("radio", { name: /Uang/ }).click();
    await page.getByRole("button", { name: "Simpan ke Riwayat" }).first().click();

    const items = page.locator('[role="region"][aria-labelledby="validation-summary-title"] ul li button');
    await expect(items).toHaveCount(2);
    await expect(items.nth(0)).toHaveText(/Jumlah Jiwa/i);
    await expect(items.nth(1)).toHaveText(/Tarif per Jiwa/i);
  });
});
