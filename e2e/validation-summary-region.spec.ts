import { test, expect } from "../playwright-fixture";

/**
 * Kontrak aksesibilitas untuk komponen `ValidationSummary`:
 *
 * - region wajib punya `role="region"` dan label via `aria-labelledby`
 * - live-region WAJIB `aria-live="polite"` (bukan assertive) agar tidak
 *   memotong pembacaan screen reader saat daftar error berubah
 * - `aria-relevant="additions text"` memberitahu screen reader bahwa
 *   isi region sedang berkembang, tanpa memaksa interrupt
 * - focus tidak boleh mendarat di region secara default; fokus harus
 *   tetap di input invalid pertama
 * - setiap item di ringkasan harus bisa difokus & diklik untuk memindah
 *   fokus ke input terkait
 */
test.describe("Validation summary region — polite, labeled, non-disruptive", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        window.localStorage.clear();
      } catch {
        /* ignore */
      }
    });
    await page.goto("/");
    await page.goto("/zakat-fitrah");
  });

  test("region ringkasan tidak tampil sebelum validasi di-submit", async ({ page }) => {
    const summary = page.locator('[role="region"][aria-labelledby="validation-summary-title"]');
    await expect(summary).toHaveCount(0);
    await expect(page.locator("#validation-summary-title")).toHaveCount(0);
  });

  test("region ringkasan muncul dengan atribut live-region yang benar & tidak interrupt", async ({ page }) => {
    await page.getByRole("button", { name: "Simpan ke Riwayat" }).first().click();

    const summary = page.locator('[role="region"][aria-labelledby="validation-summary-title"]');
    await expect(summary).toBeVisible();

    // Region label + polite live-region
    await expect(summary).toHaveAttribute("role", "region");
    await expect(summary).toHaveAttribute("aria-labelledby", "validation-summary-title");
    await expect(summary).toHaveAttribute("aria-live", "polite");
    await expect(summary).toHaveAttribute("aria-atomic", "true");
    await expect(summary).toHaveAttribute("aria-relevant", "additions text");
    await expect(summary).toHaveAttribute("tabindex", "-1");

    // Title element exists and is referenced correctly
    const title = page.locator("#validation-summary-title");
    await expect(title).toBeVisible();
    await expect(title).toContainText(/Perbaiki/i);

    // Critical: MUST NOT be assertive, otherwise screen reader is interrupted
    const live = await summary.getAttribute("aria-live");
    expect(live).not.toBe("assertive");
    expect(live).not.toBe("off");
  });

  test("region ringkasan tidak mencuri fokus saat muncul; fokus tetap di input invalid pertama", async ({ page }) => {
    const jiwa = page.locator("#fitrah-jiwa");
    await page.getByRole("button", { name: "Simpan ke Riwayat" }).first().click();

    const summary = page.locator('[role="region"][aria-labelledby="validation-summary-title"]');
    await expect(summary).toBeVisible();

    // Focus should be on the first invalid input, not on the summary region
    await expect(jiwa).toBeFocused();
    await expect(summary).not.toBeFocused();
  });

  test("daftar error di ringkasan ter-update secara polite saat field diperbaiki", async ({ page }) => {
    // Mode uang → 2 field wajib
    await page.getByRole("radio", { name: /Uang/ }).click();
    const jiwa = page.locator("#fitrah-jiwa");
    const uang = page.locator("#fitrah-uang");
    await expect(jiwa).toBeVisible();
    await expect(uang).toBeVisible();

    await page.getByRole("button", { name: "Simpan ke Riwayat" }).first().click();

    const summary = page.locator('[role="region"][aria-labelledby="validation-summary-title"]');
    await expect(summary).toBeVisible();

    const summaryButtons = summary.getByRole("button");
    await expect(summaryButtons).toHaveCount(2);
    await expect(summaryButtons.nth(0)).toContainText(/Jumlah Jiwa/i);
    await expect(summaryButtons.nth(1)).toContainText(/Tarif per Jiwa/i);

    // Fix jiwa only → summary should still list uang, but no longer list jiwa
    await jiwa.fill("3");
    await expect(summaryButtons).toHaveCount(1);
    await expect(summaryButtons.first()).toContainText(/Tarif per Jiwa/i);

    // Fix uang → summary region disappears entirely
    await uang.fill("45000");
    await expect(summary).toHaveCount(0);
    await expect(page.locator("#validation-summary-title")).toHaveCount(0);
  });

  test("tombol di ringkasan dapat difokus via Tab dan memindahkan fokus ke input terkait", async ({ page }) => {
    await page.getByRole("radio", { name: /Uang/ }).click();
    await page.getByRole("button", { name: "Simpan ke Riwayat" }).first().click();

    const uang = page.locator("#fitrah-uang");
    const summary = page.locator('[role="region"][aria-labelledby="validation-summary-title"]');
    const summaryButtons = summary.getByRole("button");
    await expect(summaryButtons).toHaveCount(2);

    // Tab from first invalid input to the summary buttons and then to Save
    const firstButton = summaryButtons.first();
    await firstButton.focus();
    await expect(firstButton).toBeFocused();

    // Clicking the summary button focuses the corresponding input
    await firstButton.click();
    await expect(page.locator("#fitrah-jiwa")).toBeFocused();

    await summaryButtons.nth(1).click();
    await expect(uang).toBeFocused();
  });

  test("ringkasan tidak mengandung elemen alert/live assertive yang memotong pembacaan", async ({ page }) => {
    await page.getByRole("radio", { name: /Uang/ }).click();
    await page.getByRole("button", { name: "Simpan ke Riwayat" }).first().click();

    const summary = page.locator('[role="region"][aria-labelledby="validation-summary-title"]');
    await expect(summary).toBeVisible();

    // Inside the summary there should be no assertive alert (those are for inline errors only)
    const assertiveInside = summary.locator('[aria-live="assertive"], [role="alert"]');
    await expect(assertiveInside).toHaveCount(0);

    // The summary region itself must remain polite
    await expect(summary).toHaveAttribute("aria-live", "polite");
  });
});
