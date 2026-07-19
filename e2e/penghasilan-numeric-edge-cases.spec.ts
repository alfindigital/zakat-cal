import { test, expect } from "../playwright-fixture";

/**
 * Zakat Penghasilan — kontrak aria untuk nilai numerik ekstrem.
 * Verifikasi:
 *   1. Nilai kosong dan "0" → invalid (aria-invalid="true" + aria-describedby).
 *   2. Nilai negatif ("-1000") disanitasi oleh formatter menjadi angka positif;
 *      atribut invalid harus dilepas karena hasil parse > 0.
 *   3. Nilai sangat besar ("999.999.999.999.999") tetap valid: tidak ada
 *      aria-invalid dan pesan error hilang dari DOM.
 *   4. Field opsional (bonus / potongan) tidak boleh ikut ternoda pada
 *      skenario apa pun di atas.
 */
test.describe("Zakat Penghasilan — nilai 0, negatif, dan sangat besar", () => {
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

  test("Nilai 0 dan kosong menghasilkan aria-invalid + aria-describedby", async ({ page }) => {
    const bulanan = page.locator("#penghasilan-bulanan");
    const bonus = page.locator("#penghasilan-bonus");

    // Simpan tanpa isi → invalid
    await page.getByRole("button", { name: "Simpan ke Riwayat" }).first().click();
    await expect(bulanan).toHaveAttribute("aria-invalid", "true");
    await expect(bulanan).toHaveAttribute("aria-describedby", "penghasilan-bulanan-error");
    await expect(page.locator("#penghasilan-bulanan-error")).toBeVisible();

    // Isi "0" — parser sanitasi ke 0 → tetap invalid
    await bulanan.fill("0");
    await expect(bulanan).toHaveAttribute("aria-invalid", "true");
    await expect(bulanan).toHaveAttribute("aria-describedby", "penghasilan-bulanan-error");
    await expect(page.locator("#penghasilan-bulanan-error")).toBeVisible();

    // Kosongkan kembali → tetap invalid, tidak ada duplikasi alert
    await bulanan.fill("");
    await expect(bulanan).toHaveAttribute("aria-invalid", "true");
    await expect(bulanan).toHaveAttribute("aria-describedby", "penghasilan-bulanan-error");
    const alerts = page.locator('[role="alert"][id^="penghasilan-"]');
    await expect(alerts).toHaveCount(1);

    // Field opsional tidak boleh tersentuh
    await expect(bonus).not.toHaveAttribute("aria-invalid", "true");
    expect(await bonus.getAttribute("aria-describedby")).toBeNull();
    await expect(page.locator("#penghasilan-bonus-error")).toHaveCount(0);
  });

  test("Nilai negatif disanitasi ke angka positif → aria-invalid dilepas", async ({ page }) => {
    const bulanan = page.locator("#penghasilan-bulanan");

    await page.getByRole("button", { name: "Simpan ke Riwayat" }).first().click();
    await expect(bulanan).toHaveAttribute("aria-invalid", "true");

    // Formatter menghilangkan tanda minus; "-1000" → "1.000" (> 0) → valid
    await bulanan.fill("-1000");
    await expect(bulanan).toHaveValue(/^1\.?000$/);
    await expect(bulanan).not.toHaveAttribute("aria-invalid", "true");
    expect(await bulanan.getAttribute("aria-describedby")).toBeNull();
    await expect(page.locator("#penghasilan-bulanan-error")).toHaveCount(0);

    // Angka negatif yang seluruhnya jadi 0 setelah sanitasi ("-0") → invalid
    await bulanan.fill("-0");
    await expect(bulanan).toHaveAttribute("aria-invalid", "true");
    await expect(bulanan).toHaveAttribute("aria-describedby", "penghasilan-bulanan-error");
  });

  test("Nilai sangat besar tetap valid; tidak ada atribut invalid tersisa", async ({ page }) => {
    const bulanan = page.locator("#penghasilan-bulanan");

    await page.getByRole("button", { name: "Simpan ke Riwayat" }).first().click();
    await expect(bulanan).toHaveAttribute("aria-invalid", "true");

    // 15 digit — jauh di atas nisab, tetap finite di JS Number
    await bulanan.fill("999999999999999");
    await expect(bulanan).toHaveValue("999.999.999.999.999");
    await expect(bulanan).not.toHaveAttribute("aria-invalid", "true");
    expect(await bulanan.getAttribute("aria-describedby")).toBeNull();
    await expect(page.locator("#penghasilan-bulanan-error")).toHaveCount(0);

    // Tidak ada alert Penghasilan yang tersisa di DOM
    await expect(page.locator('[role="alert"][id^="penghasilan-"]')).toHaveCount(0);

    // Pindah ke Netto: potongan opsional muncul, isi nilai besar juga —
    // tidak boleh menimbulkan aria-invalid pada field opsional.
    await page.getByRole("radio", { name: /Netto/ }).click();
    const potongan = page.locator("#penghasilan-potongan");
    await potongan.fill("888888888888");
    await expect(potongan).not.toHaveAttribute("aria-invalid", "true");
    expect(await potongan.getAttribute("aria-describedby")).toBeNull();
    await expect(page.locator("#penghasilan-potongan-error")).toHaveCount(0);
  });
});
