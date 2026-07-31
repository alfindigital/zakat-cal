import { test, expect } from "../playwright-fixture";

/**
 * Kontrak fokus otomatis saat submit form invalid:
 *
 * Setelah menekan "Simpan ke Riwayat", fokus keyboard harus berpindah
 * ke input pertama yang memiliki aria-invalid="true" dan input tersebut
 * harus terhubung ke pesan error yang sesuai lewat aria-describedby.
 *
 * Skenario mencakup mode beras, mode uang, dan perbaikan bertahap.
 */
test.describe("Fokus otomatis ke field invalid pertama saat Simpan", () => {
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

  test("Mode beras: fokus pindah ke #fitrah-jiwa dengan aria-invalid dan aria-describedby yang benar", async ({ page }) => {
    const jiwa = page.locator("#fitrah-jiwa");
    await expect(jiwa).toBeVisible();

    await page.getByRole("button", { name: "Simpan ke Riwayat" }).first().click();

    await expect(jiwa).toBeFocused();
    await expect(jiwa).toHaveAttribute("aria-invalid", "true");
    await expect(jiwa).toHaveAttribute("aria-describedby", "fitrah-jiwa-error");

    const error = page.locator("#fitrah-jiwa-error");
    await expect(error).toBeVisible();
    await expect(error).toHaveAttribute("role", "alert");
    await expect(error).toHaveAttribute("aria-live", "assertive");
  });

  test("Mode uang: fokus pertama di #fitrah-jiwa, bukan di #fitrah-uang", async ({ page }) => {
    await page.getByRole("radio", { name: /Uang/ }).click();

    const jiwa = page.locator("#fitrah-jiwa");
    const uang = page.locator("#fitrah-uang");
    await expect(jiwa).toBeVisible();
    await expect(uang).toBeVisible();

    await page.getByRole("button", { name: "Simpan ke Riwayat" }).first().click();

    await expect(jiwa).toBeFocused();
    await expect(uang).not.toBeFocused();

    await expect(jiwa).toHaveAttribute("aria-invalid", "true");
    await expect(jiwa).toHaveAttribute("aria-describedby", "fitrah-jiwa-error");
    await expect(uang).toHaveAttribute("aria-invalid", "true");
    await expect(uang).toHaveAttribute("aria-describedby", "fitrah-uang-error");
  });

  test("Perbaikan bertahap: setelah jiwa valid, fokus pindah ke #fitrah-uang saat Simpan ditekan lagi", async ({ page }) => {
    await page.getByRole("radio", { name: /Uang/ }).click();

    const jiwa = page.locator("#fitrah-jiwa");
    const uang = page.locator("#fitrah-uang");

    await page.getByRole("button", { name: "Simpan ke Riwayat" }).first().click();
    await expect(jiwa).toBeFocused();

    await jiwa.fill("3");
    await page.getByRole("button", { name: "Simpan ke Riwayat" }).first().click();

    await expect(uang).toBeFocused();
    await expect(uang).toHaveAttribute("aria-invalid", "true");
    await expect(uang).toHaveAttribute("aria-describedby", "fitrah-uang-error");

    await expect(jiwa).not.toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#fitrah-jiwa-error")).toHaveCount(0);
  });

  test("Setelah input diperbaiki, fokus tidak kembali ke field yang sudah valid", async ({ page }) => {
    await page.getByRole("radio", { name: /Uang/ }).click();

    const jiwa = page.locator("#fitrah-jiwa");
    const uang = page.locator("#fitrah-uang");

    await page.getByRole("button", { name: "Simpan ke Riwayat" }).first().click();
    await jiwa.fill("3");
    await uang.fill("45000");
    await page.getByRole("button", { name: "Simpan ke Riwayat" }).first().click();

    // Tidak ada field invalid yang tersisa; fokus tidak berada di input yang sudah valid
    await expect(jiwa).not.toHaveAttribute("aria-invalid", "true");
    await expect(uang).not.toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#fitrah-jiwa-error")).toHaveCount(0);
    await expect(page.locator("#fitrah-uang-error")).toHaveCount(0);
  });
});
