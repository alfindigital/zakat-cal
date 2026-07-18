import { test, expect } from "../playwright-fixture";

/**
 * Kontrak keyboard-nav Zakat Penghasilan saat state error aktif:
 * - Tab / Shift+Tab mengunjungi urutan input yang benar
 *   (bulanan → bonus → [potongan bila Netto] → tombol Simpan),
 *   melewati pesan error non-interaktif (`role="alert"`).
 * - Fokus otomatis mendarat di field pertama yang invalid setelah
 *   Simpan ditekan, dan field tersebut memang punya
 *   `aria-invalid="true"` + `aria-describedby="penghasilan-bulanan-error"`.
 * - Tombol summary "Penghasilan Bulanan" bisa dijangkau via Tab dan,
 *   saat diaktifkan dengan Enter, mengembalikan fokus ke input wajib.
 */
test.describe("Zakat Penghasilan — keyboard nav mempertahankan fokus pada field invalid", () => {
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

  test("Setelah Simpan invalid: fokus di field wajib, Tab lewati pesan error, Shift+Tab kembali", async ({ page }) => {
    await page.getByRole("button", { name: "Simpan ke Riwayat" }).first().click();

    const bulanan = page.locator("#penghasilan-bulanan");
    const bonus = page.locator("#penghasilan-bonus");

    // Fokus otomatis di field wajib pertama, dengan aria-invalid & describedby tepat
    await expect(bulanan).toBeFocused();
    await expect(bulanan).toHaveAttribute("aria-invalid", "true");
    await expect(bulanan).toHaveAttribute("aria-describedby", "penghasilan-bulanan-error");

    // Pesan error tidak fokusable (tidak boleh muncul di urutan Tab)
    const err = page.locator("#penghasilan-bulanan-error");
    await expect(err).toBeVisible();
    expect(await err.getAttribute("tabindex")).toBeNull();

    // Tab → langsung ke input opsional bonus, bukan ke pesan error
    await page.keyboard.press("Tab");
    await expect(bonus).toBeFocused();
    // Bonus opsional: tidak boleh invalid
    await expect(bonus).not.toHaveAttribute("aria-invalid", "true");

    // Shift+Tab → kembali ke bulanan, atribut invalid tetap
    await page.keyboard.press("Shift+Tab");
    await expect(bulanan).toBeFocused();
    await expect(bulanan).toHaveAttribute("aria-invalid", "true");
    await expect(bulanan).toHaveAttribute("aria-describedby", "penghasilan-bulanan-error");
  });

  test("Mode Netto: urutan Tab menyertakan potongan (opsional, tidak invalid) sebelum Simpan", async ({ page }) => {
    await page.getByRole("radio", { name: /Netto/ }).click();
    await page.getByRole("button", { name: "Simpan ke Riwayat" }).first().click();

    const bulanan = page.locator("#penghasilan-bulanan");
    const bonus = page.locator("#penghasilan-bonus");
    const potongan = page.locator("#penghasilan-potongan");

    await expect(bulanan).toBeFocused();
    await expect(bulanan).toHaveAttribute("aria-invalid", "true");

    // Tab: bulanan → bonus
    await page.keyboard.press("Tab");
    await expect(bonus).toBeFocused();

    // Tab lagi: eventually mendarat di potongan (skip radio group internal jika ada)
    // Cari potongan dalam maksimum beberapa Tab agar tidak flaky.
    let landedOnPotongan = false;
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press("Tab");
      if (await potongan.evaluate((el) => el === document.activeElement)) {
        landedOnPotongan = true;
        break;
      }
    }
    expect(landedOnPotongan).toBe(true);
    await expect(potongan).not.toHaveAttribute("aria-invalid", "true");
    expect(await potongan.getAttribute("aria-describedby")).toBeNull();

    // Shift+Tab dari potongan tidak boleh mengubah aria-invalid pada bulanan
    await page.keyboard.press("Shift+Tab");
    await expect(bulanan).toHaveAttribute("aria-invalid", "true");
    await expect(bulanan).toHaveAttribute("aria-describedby", "penghasilan-bulanan-error");
  });

  test("Summary link dapat dijangkau via Tab & Enter mengembalikan fokus ke field invalid", async ({ page }) => {
    await page.getByRole("button", { name: "Simpan ke Riwayat" }).first().click();

    const bulanan = page.locator("#penghasilan-bulanan");
    await expect(bulanan).toBeFocused();

    // Blur dulu, lalu jangkau tombol summary via role-based locator
    await bulanan.blur();
    const summaryBtn = page.getByRole("button", { name: /Penghasilan Bulanan/ });
    await expect(summaryBtn).toBeVisible();
    await summaryBtn.focus();
    await expect(summaryBtn).toBeFocused();

    // Enter → fokus kembali ke field wajib, atribut invalid utuh
    await page.keyboard.press("Enter");
    await expect(bulanan).toBeFocused();
    await expect(bulanan).toHaveAttribute("aria-invalid", "true");
    await expect(bulanan).toHaveAttribute("aria-describedby", "penghasilan-bulanan-error");
  });
});
