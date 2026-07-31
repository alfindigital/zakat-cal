import { test, expect } from "../playwright-fixture";

/**
 * Setelah tombol "Simpan ke Riwayat" ditekan pada form yang belum
 * lengkap, fokus keyboard harus otomatis pindah ke input pertama yang
 * invalid, dan panel ringkasan validasi harus terekspose sebagai
 * live-region yang dapat dibaca screen reader.
 */
test.describe("Focus-first-invalid + validation summary a11y", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        window.localStorage.clear();
      } catch {
        /* ignore */
      }
    });
    await page.goto("/");
  });

  test("Zakat Fitrah (mode uang): fokus pindah ke input JIWA (invalid pertama), bukan ke input tarif", async ({ page }) => {
    await page.goto("/zakat-fitrah");

    // Aktifkan mode uang agar ada 2 field wajib: jiwa + tarif per jiwa
    await page.getByRole("radio", { name: /Uang/ }).click();

    const jiwa = page.locator("#fitrah-jiwa");
    const uang = page.locator("#fitrah-uang");
    await expect(jiwa).toBeVisible();
    await expect(uang).toBeVisible();

    // Kedua field kosong → tekan Simpan
    await page.getByRole("button", { name: "Simpan ke Riwayat" }).first().click();

    // Fokus HARUS di input pertama yang invalid (jiwa), bukan di tarif
    await expect(jiwa).toBeFocused();
    await expect(uang).not.toBeFocused();

    // Panel ringkasan validasi terekspose sebagai live-region
    const summary = page.locator('[role="region"][aria-labelledby="validation-summary-title"]');
    await expect(summary).toBeVisible();
    await expect(summary).toHaveAttribute("aria-live", "polite");
    await expect(summary).toHaveAttribute("aria-atomic", "true");
    await expect(summary).toHaveAttribute("tabindex", "-1");

    // Judul terhubung via aria-labelledby (dibaca screen reader saat region diumumkan)
    await expect(page.locator("#validation-summary-title")).toContainText(/Perbaiki/i);

    // Ringkasan mencantumkan kedua field yang bermasalah sebagai tombol klik-ke-fokus
    const summaryButtons = summary.getByRole("button");
    await expect(summaryButtons).toHaveCount(2);
    await expect(summaryButtons.nth(0)).toContainText(/Jumlah Jiwa/i);
    await expect(summaryButtons.nth(1)).toContainText(/Tarif per Jiwa/i);

    // Klik entry kedua di ringkasan → fokus berpindah ke input tarif
    await summaryButtons.nth(1).click();
    await expect(uang).toBeFocused();
  });

  test("Zakat Maal: setelah invalid dilanjutkan submit valid, fokus terarah dengan benar", async ({ page }) => {
    // Klik Simpan tanpa mengisi apa pun (form default = Maal)
    await page.getByRole("button", { name: "Simpan ke Riwayat" }).first().click();

    // Input pertama yang invalid harus di-fokus
    const focused = page.locator(":focus");
    await expect(focused).toHaveAttribute("aria-invalid", "true");
    const describedBy = await focused.getAttribute("aria-describedby");
    expect(describedBy).toMatch(/-error$/);

    // Pesan error yang direferensikan aria-describedby dapat ditemukan & memiliki aria-live assertive
    const errEl = page.locator(`#${describedBy}`);
    await expect(errEl).toBeVisible();
    await expect(errEl).toHaveAttribute("aria-live", "assertive");
    await expect(errEl).toHaveAttribute("role", "alert");
  });
});
