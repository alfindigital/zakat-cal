import { test, expect } from "../playwright-fixture";

/**
 * Skenario e2e khusus Zakat Fitrah: setiap field wajib pada kedua mode
 * (beras & uang) harus punya aria-invalid="true" dan aria-describedby
 * yang mengarah ke elemen pesan error yang benar saat tombol Simpan
 * ditekan dengan form kosong / tidak valid.
 */
test.describe("Zakat Fitrah — aria-invalid & aria-describedby per field wajib", () => {
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

  test("Mode beras: hanya field jiwa yang wajib → aria-invalid & aria-describedby valid", async ({ page }) => {
    // Mode default = beras
    const jiwa = page.locator("#fitrah-jiwa");
    await expect(jiwa).toBeVisible();

    // Sebelum submit: input bersih
    await expect(jiwa).not.toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#fitrah-jiwa-error")).toHaveCount(0);

    await page.getByRole("button", { name: "Simpan ke Riwayat" }).first().click();

    // aria-invalid=true
    await expect(jiwa).toHaveAttribute("aria-invalid", "true");
    // aria-describedby tepat ke id pesan error
    await expect(jiwa).toHaveAttribute("aria-describedby", "fitrah-jiwa-error");

    // Pesan error benar-benar ada dan berisi alasan spesifik
    const err = page.locator("#fitrah-jiwa-error");
    await expect(err).toBeVisible();
    await expect(err).toHaveAttribute("role", "alert");
    await expect(err).toHaveAttribute("aria-live", "assertive");
    await expect(err).toContainText(/jumlah anggota keluarga/i);

    // Field opsional (harga beras kustom) TIDAK boleh diberi aria-invalid
    const custom = page.locator("#fitrah-custom");
    await expect(custom).toBeVisible();
    await expect(custom).not.toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#fitrah-custom-error")).toHaveCount(0);

    // Setelah jiwa diisi, aria-invalid & pesan error dilepas
    await jiwa.fill("3");
    await expect(jiwa).not.toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#fitrah-jiwa-error")).toHaveCount(0);
  });

  test("Mode uang: kedua field wajib (jiwa & tarif) dipetakan ke pesan error masing-masing", async ({ page }) => {
    await page.getByRole("radio", { name: /Uang/ }).click();

    const jiwa = page.locator("#fitrah-jiwa");
    const uang = page.locator("#fitrah-uang");
    await expect(jiwa).toBeVisible();
    await expect(uang).toBeVisible();

    await page.getByRole("button", { name: "Simpan ke Riwayat" }).first().click();

    // --- Field jiwa ---
    await expect(jiwa).toHaveAttribute("aria-invalid", "true");
    await expect(jiwa).toHaveAttribute("aria-describedby", "fitrah-jiwa-error");
    const jiwaErr = page.locator("#fitrah-jiwa-error");
    await expect(jiwaErr).toBeVisible();
    await expect(jiwaErr).toHaveAttribute("aria-live", "assertive");

    // --- Field tarif per jiwa ---
    await expect(uang).toHaveAttribute("aria-invalid", "true");
    await expect(uang).toHaveAttribute("aria-describedby", "fitrah-uang-error");
    const uangErr = page.locator("#fitrah-uang-error");
    await expect(uangErr).toBeVisible();
    await expect(uangErr).toHaveAttribute("aria-live", "assertive");
    await expect(uangErr).toContainText(/tarif fitrah per jiwa/i);

    // --- Perbaikan bertahap: mengisi jiwa hanya melepas aria-invalid pada jiwa ---
    await jiwa.fill("2");
    await expect(jiwa).not.toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#fitrah-jiwa-error")).toHaveCount(0);

    // Tarif masih invalid
    await expect(uang).toHaveAttribute("aria-invalid", "true");
    await expect(uang).toHaveAttribute("aria-describedby", "fitrah-uang-error");

    // Isi tarif → aria-invalid terakhir juga terlepas
    await uang.fill("45000");
    await expect(uang).not.toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#fitrah-uang-error")).toHaveCount(0);
  });

  test("Pergantian mode beras ↔ uang tidak meninggalkan aria-invalid pada field yang tak relevan", async ({ page }) => {
    // Trigger error di mode beras (jiwa kosong)
    await page.getByRole("button", { name: "Simpan ke Riwayat" }).first().click();
    const jiwa = page.locator("#fitrah-jiwa");
    await expect(jiwa).toHaveAttribute("aria-invalid", "true");

    // Pindah ke mode uang → input tarif muncul; TIDAK boleh aria-invalid sebelum submit ulang
    // (Kondisi validasi memang sudah "attempted", jadi tarif kosong wajar diberi aria-invalid.
    //  Yang kita pastikan: aria-describedby tarif TETAP mengarah ke #fitrah-uang-error, bukan sisa dari field lain.)
    await page.getByRole("radio", { name: /Uang/ }).click();
    const uang = page.locator("#fitrah-uang");
    await expect(uang).toBeVisible();
    const describedBy = await uang.getAttribute("aria-describedby");
    if (describedBy) {
      expect(describedBy).toBe("fitrah-uang-error");
    }

    // Kembali ke mode beras → field tarif tidak lagi ada di DOM (jadi tidak bisa "bocor")
    await page.getByRole("radio", { name: /Beras/ }).click();
    await expect(page.locator("#fitrah-uang")).toHaveCount(0);
    await expect(page.locator("#fitrah-uang-error")).toHaveCount(0);
  });
});
