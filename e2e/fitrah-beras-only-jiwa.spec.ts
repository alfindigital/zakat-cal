import { test, expect } from "../playwright-fixture";

/**
 * Mode beras Zakat Fitrah hanya memiliki SATU field wajib: jumlah jiwa.
 * Field lain yang ikut tampil di mode beras — pemilih jenis beras
 * (`Select`) dan input opsional harga beras kustom (`#fitrah-custom`)
 * — TIDAK boleh ikut ditandai `aria-invalid` atau mendapat error
 * message ketika user menekan "Simpan ke Riwayat" dengan form kosong.
 *
 * Spec ini adalah kontrak yang menjaga agar validasi mode beras tetap
 * fokus pada satu field saja.
 */
test.describe("Zakat Fitrah — mode beras: hanya jiwa yang invalid", () => {
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
    // Pastikan berada di mode beras (default, tapi klik eksplisit agar
    // spec tetap valid jika default berubah di masa depan).
    await page.getByRole("radio", { name: /Beras/ }).click();
  });

  test("Simpan pada form kosong → hanya #fitrah-jiwa yang aria-invalid + aria-describedby", async ({ page }) => {
    const jiwa = page.locator("#fitrah-jiwa");
    const custom = page.locator("#fitrah-custom");

    // Sanity: kedua field yang seharusnya tersedia di mode beras hadir,
    // dan input untuk mode uang tidak ada.
    await expect(jiwa).toBeVisible();
    await expect(custom).toBeVisible();
    await expect(page.locator("#fitrah-uang")).toHaveCount(0);
    await expect(page.locator("#fitrah-uang-error")).toHaveCount(0);

    // Sebelum submit: tidak ada atribut invalid / error yang bocor.
    await expect(jiwa).not.toHaveAttribute("aria-invalid", "true");
    await expect(custom).not.toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#fitrah-jiwa-error")).toHaveCount(0);
    await expect(page.locator("#fitrah-custom-error")).toHaveCount(0);

    await page.getByRole("button", { name: "Simpan ke Riwayat" }).first().click();

    // --- Field jiwa: HARUS ditandai invalid dan di-describe error-nya
    await expect(jiwa).toHaveAttribute("aria-invalid", "true");
    await expect(jiwa).toHaveAttribute("aria-describedby", "fitrah-jiwa-error");
    const jiwaErr = page.locator("#fitrah-jiwa-error");
    await expect(jiwaErr).toBeVisible();
    await expect(jiwaErr).toHaveAttribute("role", "alert");
    await expect(jiwaErr).toHaveAttribute("aria-live", "assertive");
    await expect(jiwaErr).toContainText(/jumlah anggota keluarga/i);

    // --- Field harga beras kustom (opsional): TETAP BERSIH
    await expect(custom).not.toHaveAttribute("aria-invalid", "true");
    // aria-describedby tidak boleh mengarah ke error apapun
    const describedByCustom = await custom.getAttribute("aria-describedby");
    expect(describedByCustom).toBeNull();
    await expect(page.locator("#fitrah-custom-error")).toHaveCount(0);

    // --- Select "Jenis Beras": TETAP BERSIH
    // Trigger Select dari shadcn/Radix pakai role="combobox"
    const jenisBerasTrigger = page.getByRole("combobox").first();
    await expect(jenisBerasTrigger).toBeVisible();
    await expect(jenisBerasTrigger).not.toHaveAttribute("aria-invalid", "true");
    const describedBySelect = await jenisBerasTrigger.getAttribute("aria-describedby");
    // Radix menambahkan aria-describedby internal (mis. untuk deskripsi),
    // yang boleh saja ada — tetapi TIDAK boleh mengarah ke id error kita.
    if (describedBySelect) {
      expect(describedBySelect).not.toContain("fitrah-jiwa-error");
      expect(describedBySelect).not.toContain("fitrah-custom-error");
      expect(describedBySelect).not.toContain("fitrah-uang-error");
    }

    // --- Hanya ada 1 pesan error di seluruh subform Fitrah
    // (batasi pencarian ke area kalkulator agar tidak mengambil elemen
    // di komponen lain yang mungkin muncul di halaman.)
    const alerts = page.locator('[role="alert"][aria-live="assertive"]');
    // Pesan error yang milik Fitrah mengandung id-prefix "fitrah-"
    const fitrahAlerts = page.locator('[role="alert"][aria-live="assertive"][id^="fitrah-"]');
    await expect(fitrahAlerts).toHaveCount(1);
    await expect(fitrahAlerts.first()).toHaveAttribute("id", "fitrah-jiwa-error");

    // --- Setelah jiwa diisi valid: atribut invalid dilepas & tidak ada
    // efek samping ke field lain.
    await jiwa.fill("3");
    await expect(jiwa).not.toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#fitrah-jiwa-error")).toHaveCount(0);
    await expect(custom).not.toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#fitrah-custom-error")).toHaveCount(0);
  });

  test("Mengisi harga kustom tanpa jiwa tetap membuat jiwa satu-satunya field invalid", async ({ page }) => {
    // Isi field opsional saja
    await page.locator("#fitrah-custom").fill("15000");

    await page.getByRole("button", { name: "Simpan ke Riwayat" }).first().click();

    const jiwa = page.locator("#fitrah-jiwa");
    await expect(jiwa).toHaveAttribute("aria-invalid", "true");
    await expect(jiwa).toHaveAttribute("aria-describedby", "fitrah-jiwa-error");

    const custom = page.locator("#fitrah-custom");
    await expect(custom).not.toHaveAttribute("aria-invalid", "true");
    const describedByCustom = await custom.getAttribute("aria-describedby");
    expect(describedByCustom).toBeNull();

    // Fokus otomatis mendarat di jiwa, bukan di harga kustom.
    await expect(jiwa).toBeFocused();
  });
});
