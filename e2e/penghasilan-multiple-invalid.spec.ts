import { test, expect } from "../playwright-fixture";

/**
 * Kontrak validasi Zakat Penghasilan saat beberapa field kosong sekaligus:
 * - Fokus harus pindah ke field pertama yang paling relevan (hanya
 *   "Penghasilan Bulanan" yang wajib).
 * - Field wajib memiliki aria-invalid="true" dan aria-describedby
 *   yang menunjuk ke elemen error yang sesuai.
 * - Field opsional (bonus, potongan) TIDAK boleh mendapatkan atribut
 *   invalid atau error yatim.
 * - Panel ringkasan validasi konsisten dan dapat mengembalikan fokus
 *   ke field yang bermasalah.
 */
test.describe("Zakat Penghasilan — beberapa field kosong saat Simpan", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        window.localStorage.clear();
      } catch {
        /* ignore */
      }
    });
    await page.goto("/");
    await page.getByRole("button", { name: "Zakat Penghasilan" }).first().click();
  });

  test("Mode Bruto: fokus ke penghasilan bulanan, bonus tidak tersentuh", async ({ page }) => {
    const bulanan = page.locator("#penghasilan-bulanan");
    const bonus = page.locator("#penghasilan-bonus");
    await expect(bulanan).toBeVisible();
    await expect(bonus).toBeVisible();

    await page.getByRole("button", { name: "Simpan ke Riwayat" }).first().click();

    // Fokus ke field pertama yang invalid
    await expect(bulanan).toBeFocused();
    await expect(bulanan).toHaveAttribute("aria-invalid", "true");
    await expect(bulanan).toHaveAttribute("aria-describedby", "penghasilan-bulanan-error");

    const error = page.locator("#penghasilan-bulanan-error");
    await expect(error).toBeVisible();
    await expect(error).toHaveAttribute("role", "alert");
    await expect(error).toHaveAttribute("aria-live", "assertive");

    // Bonus adalah field opsional, tidak boleh invalid
    await expect(bonus).not.toHaveAttribute("aria-invalid", "true");
    expect(await bonus.getAttribute("aria-describedby")).toBeNull();
    await expect(page.locator("#penghasilan-bonus-error")).toHaveCount(0);

    // Hanya satu error Penghasilan yang muncul
    const alerts = page.locator('[role="alert"][aria-live="assertive"][id^="penghasilan-"]');
    await expect(alerts).toHaveCount(1);
    await expect(alerts.first()).toHaveAttribute("id", "penghasilan-bulanan-error");

    // Ringkasan validasi menunjukkan satu item yang bisa difokuskan
    const summary = page.locator('[role="region"][aria-labelledby="validation-summary-title"]');
    await expect(summary).toBeVisible();
    const summaryButtons = summary.getByRole("button");
    await expect(summaryButtons).toHaveCount(1);
    await expect(summaryButtons.first()).toContainText(/Penghasilan Bulanan/i);
  });

  test("Mode Netto: fokus ke penghasilan bulanan, potongan tidak tersentuh", async ({ page }) => {
    await page.getByRole("radio", { name: /Netto/ }).click();

    const bulanan = page.locator("#penghasilan-bulanan");
    const bonus = page.locator("#penghasilan-bonus");
    const potongan = page.locator("#penghasilan-potongan");
    await expect(bulanan).toBeVisible();
    await expect(bonus).toBeVisible();
    await expect(potongan).toBeVisible();

    await page.getByRole("button", { name: "Simpan ke Riwayat" }).first().click();

    await expect(bulanan).toBeFocused();
    await expect(bulanan).toHaveAttribute("aria-invalid", "true");
    await expect(bulanan).toHaveAttribute("aria-describedby", "penghasilan-bulanan-error");

    // Potongan adalah opsional, tidak boleh invalid
    await expect(potongan).not.toHaveAttribute("aria-invalid", "true");
    expect(await potongan.getAttribute("aria-describedby")).toBeNull();
    await expect(page.locator("#penghasilan-potongan-error")).toHaveCount(0);

    await expect(bonus).not.toHaveAttribute("aria-invalid", "true");
    expect(await bonus.getAttribute("aria-describedby")).toBeNull();
    await expect(page.locator("#penghasilan-bonus-error")).toHaveCount(0);
  });

  test("Setelah field diperbaiki lalu dikosongkan kembali, fokus dan aria-describedby kembali konsisten", async ({ page }) => {
    const bulanan = page.locator("#penghasilan-bulanan");
    await page.getByRole("button", { name: "Simpan ke Riwayat" }).first().click();
    await expect(bulanan).toBeFocused();
    await expect(bulanan).toHaveAttribute("aria-describedby", "penghasilan-bulanan-error");

    await bulanan.fill("8.000.000");
    await expect(bulanan).not.toHaveAttribute("aria-invalid", "true");
    expect(await bulanan.getAttribute("aria-describedby")).toBeNull();
    await expect(page.locator("#penghasilan-bulanan-error")).toHaveCount(0);

    await bulanan.clear();
    await page.getByRole("button", { name: "Simpan ke Riwayat" }).first().click();

    await expect(bulanan).toBeFocused();
    await expect(bulanan).toHaveAttribute("aria-invalid", "true");
    await expect(bulanan).toHaveAttribute("aria-describedby", "penghasilan-bulanan-error");
    await expect(page.locator("#penghasilan-bulanan-error")).toBeVisible();
  });

  test("Klik tombol ringkasan validasi mengembalikan fokus ke penghasilan bulanan", async ({ page }) => {
    await page.getByRole("button", { name: "Simpan ke Riwayat" }).first().click();

    const bulanan = page.locator("#penghasilan-bulanan");
    await expect(bulanan).toBeFocused();
    await bulanan.blur();

    const summary = page.locator('[role="region"][aria-labelledby="validation-summary-title"]');
    const summaryBtn = summary.getByRole("button").first();
    await summaryBtn.focus();
    await expect(summaryBtn).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(bulanan).toBeFocused();
    await expect(bulanan).toHaveAttribute("aria-invalid", "true");
    await expect(bulanan).toHaveAttribute("aria-describedby", "penghasilan-bulanan-error");
  });
});
