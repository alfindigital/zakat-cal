import { test, expect } from "../playwright-fixture";

/**
 * Kontrak aksesibilitas Zakat Penghasilan (pola sama dengan mode beras
 * Zakat Fitrah): hanya field wajib `#penghasilan-bulanan` yang boleh
 * mendapat `aria-invalid="true"` + `aria-describedby="penghasilan-bulanan-error"`
 * setelah Simpan ditekan tanpa input yang valid. Field opsional
 * (`#penghasilan-bonus`, `#penghasilan-potongan`) TIDAK boleh
 * membawa atribut invalid. Ketika nilai diperbaiki, atribut & pesan
 * error harus dilepas dari DOM.
 */
test.describe("Zakat Penghasilan — aria-invalid & aria-describedby", () => {
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

  test("Field wajib mendapat aria-invalid & aria-describedby; opsional tidak tersentuh", async ({ page }) => {
    const bulanan = page.locator("#penghasilan-bulanan");
    const bonus = page.locator("#penghasilan-bonus");
    await expect(bulanan).toBeVisible();
    await expect(bonus).toBeVisible();

    // Sebelum submit: bersih
    await expect(bulanan).not.toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#penghasilan-bulanan-error")).toHaveCount(0);
    expect(await bulanan.getAttribute("aria-describedby")).toBeNull();

    await page.getByRole("button", { name: "Simpan ke Riwayat" }).first().click();

    // Wajib → invalid + describedby
    await expect(bulanan).toHaveAttribute("aria-invalid", "true");
    await expect(bulanan).toHaveAttribute("aria-describedby", "penghasilan-bulanan-error");

    const err = page.locator("#penghasilan-bulanan-error");
    await expect(err).toBeVisible();
    await expect(err).toHaveAttribute("role", "alert");
    await expect(err).toHaveAttribute("aria-live", "assertive");
    await expect(err).toContainText(/penghasilan bulanan/i);

    // Opsional (bonus) tidak boleh diberi aria-invalid
    await expect(bonus).not.toHaveAttribute("aria-invalid", "true");
    expect(await bonus.getAttribute("aria-describedby")).toBeNull();
    await expect(page.locator("#penghasilan-bonus-error")).toHaveCount(0);

    // Hanya 1 alert Penghasilan aktif
    const alerts = page.locator('[role="alert"][aria-live="assertive"][id^="penghasilan-"]');
    await expect(alerts).toHaveCount(1);
    await expect(alerts.first()).toHaveAttribute("id", "penghasilan-bulanan-error");
  });

  test("Atribut invalid dilepas setelah nilai diperbaiki", async ({ page }) => {
    await page.getByRole("button", { name: "Simpan ke Riwayat" }).first().click();

    const bulanan = page.locator("#penghasilan-bulanan");
    await expect(bulanan).toHaveAttribute("aria-invalid", "true");
    await expect(bulanan).toHaveAttribute("aria-describedby", "penghasilan-bulanan-error");

    // Isi nilai valid → atribut & pesan error harus dilepas
    await bulanan.fill("10.000.000");

    await expect(bulanan).not.toHaveAttribute("aria-invalid", "true");
    expect(await bulanan.getAttribute("aria-describedby")).toBeNull();
    await expect(page.locator("#penghasilan-bulanan-error")).toHaveCount(0);
  });

  test("Ganti metode Bruto ↔ Netto tidak menambah aria-invalid pada potongan opsional", async ({ page }) => {
    // Trigger attempted=true
    await page.getByRole("button", { name: "Simpan ke Riwayat" }).first().click();

    const bulanan = page.locator("#penghasilan-bulanan");
    await expect(bulanan).toHaveAttribute("aria-invalid", "true");

    // Baseline: mode bruto → potongan tidak ada di DOM
    await expect(page.locator("#penghasilan-potongan")).toHaveCount(0);

    // Pindah ke Netto → potongan muncul, TIDAK boleh invalid (opsional)
    await page.getByRole("radio", { name: /Netto/ }).click();
    const potongan = page.locator("#penghasilan-potongan");
    await expect(potongan).toBeVisible();
    await expect(potongan).not.toHaveAttribute("aria-invalid", "true");
    expect(await potongan.getAttribute("aria-describedby")).toBeNull();
    await expect(page.locator("#penghasilan-potongan-error")).toHaveCount(0);

    // Kembali ke Bruto → potongan hilang total, tidak meninggalkan artefak
    await page.getByRole("radio", { name: /Bruto/ }).click();
    await expect(page.locator("#penghasilan-potongan")).toHaveCount(0);
    await expect(page.locator("#penghasilan-potongan-error")).toHaveCount(0);

    // Field wajib tetap invalid dengan describedby valid
    await expect(bulanan).toHaveAttribute("aria-invalid", "true");
    await expect(bulanan).toHaveAttribute("aria-describedby", "penghasilan-bulanan-error");

    // Perbaiki → semua aria dilepas
    await bulanan.fill("12.000.000");
    await expect(bulanan).not.toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#penghasilan-bulanan-error")).toHaveCount(0);
  });
});
