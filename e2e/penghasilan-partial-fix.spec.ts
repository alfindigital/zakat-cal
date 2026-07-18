import { test, expect } from "../playwright-fixture";

/**
 * Kontrak: setelah user memperbaiki sebagian input dan/atau toggle
 * metode Bruto↔Netto, hanya field yang masih invalid yang boleh
 * mempertahankan `aria-invalid="true"` + `aria-describedby` yang
 * mengarah ke `#<id>-error` yang benar-benar ada di DOM.
 *
 * Yang diverifikasi:
 * - Tidak ada relasi `aria-describedby` yatim (ID target hilang).
 * - Field opsional (bonus, potongan) tidak pernah invalid.
 * - Toggle Bruto↔Netto tidak meninggalkan atribut invalid dari mode
 *   sebelumnya, dan tidak menambah alert baru pada field opsional.
 * - Setelah semua wajib terisi, tidak ada `[aria-invalid="true"]` tersisa
 *   dan tidak ada `[role="alert"]` Penghasilan aktif.
 */
test.describe("Zakat Penghasilan — perbaikan bertahap & toggle metode", () => {
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

  test("Hanya field yang masih salah yang tetap invalid; tidak ada aria-describedby yatim", async ({ page }) => {
    const bulanan = page.locator("#penghasilan-bulanan");
    const bonus = page.locator("#penghasilan-bonus");

    // Trigger attempted=true di mode Bruto (default)
    await page.getByRole("button", { name: "Simpan ke Riwayat" }).first().click();

    // Baseline: wajib invalid, opsional bersih
    await expect(bulanan).toHaveAttribute("aria-invalid", "true");
    await expect(bulanan).toHaveAttribute("aria-describedby", "penghasilan-bulanan-error");
    await expect(bonus).not.toHaveAttribute("aria-invalid", "true");
    expect(await bonus.getAttribute("aria-describedby")).toBeNull();

    // Pindah ke Netto → field potongan muncul
    await page.getByRole("radio", { name: /Netto/ }).click();
    const potongan = page.locator("#penghasilan-potongan");
    await expect(potongan).toBeVisible();

    // Potongan opsional TIDAK boleh invalid meski attempted=true
    await expect(potongan).not.toHaveAttribute("aria-invalid", "true");
    expect(await potongan.getAttribute("aria-describedby")).toBeNull();
    await expect(page.locator("#penghasilan-potongan-error")).toHaveCount(0);

    // Field wajib masih invalid dengan describedby valid
    await expect(bulanan).toHaveAttribute("aria-invalid", "true");
    await expect(bulanan).toHaveAttribute("aria-describedby", "penghasilan-bulanan-error");

    // Isi sebagian nilai opsional → tidak mengubah state invalid wajib
    await bonus.fill("2.000.000");
    await potongan.fill("3.000.000");
    await expect(bulanan).toHaveAttribute("aria-invalid", "true");
    await expect(bonus).not.toHaveAttribute("aria-invalid", "true");
    await expect(potongan).not.toHaveAttribute("aria-invalid", "true");

    // Tidak ada aria-describedby yatim pada seluruh input Penghasilan
    const described = page.locator('input[id^="penghasilan-"][aria-describedby]');
    const count = await described.count();
    for (let i = 0; i < count; i++) {
      const el = described.nth(i);
      const ref = await el.getAttribute("aria-describedby");
      if (!ref) continue;
      // Target harus benar-benar ada di DOM
      await expect(page.locator(`#${ref}`)).toHaveCount(1);
    }

    // Perbaiki wajib → seluruh aria-invalid Penghasilan hilang
    await bulanan.fill("15.000.000");
    await expect(bulanan).not.toHaveAttribute("aria-invalid", "true");
    expect(await bulanan.getAttribute("aria-describedby")).toBeNull();
    await expect(page.locator('input[id^="penghasilan-"][aria-invalid="true"]')).toHaveCount(0);
    await expect(page.locator('[role="alert"][id^="penghasilan-"]')).toHaveCount(0);
  });

  test("Toggle Netto → Bruto membersihkan artefak potongan sepenuhnya", async ({ page }) => {
    // Mulai di Netto, trigger attempted
    await page.getByRole("radio", { name: /Netto/ }).click();
    await page.getByRole("button", { name: "Simpan ke Riwayat" }).first().click();

    const bulanan = page.locator("#penghasilan-bulanan");
    const potongan = page.locator("#penghasilan-potongan");
    await expect(bulanan).toHaveAttribute("aria-invalid", "true");
    // Potongan opsional tetap bersih di Netto
    await expect(potongan).not.toHaveAttribute("aria-invalid", "true");
    expect(await potongan.getAttribute("aria-describedby")).toBeNull();

    // Kembali ke Bruto → potongan hilang total (tidak ada artefak)
    await page.getByRole("radio", { name: /Bruto/ }).click();
    await expect(page.locator("#penghasilan-potongan")).toHaveCount(0);
    await expect(page.locator("#penghasilan-potongan-error")).toHaveCount(0);

    // Field wajib tetap invalid & describedby mengarah ke target yang ada
    await expect(bulanan).toHaveAttribute("aria-invalid", "true");
    const ref = await bulanan.getAttribute("aria-describedby");
    expect(ref).toBe("penghasilan-bulanan-error");
    await expect(page.locator(`#${ref}`)).toHaveCount(1);

    // Perbaiki → bersih total
    await bulanan.fill("20.000.000");
    await expect(page.locator('input[id^="penghasilan-"][aria-invalid="true"]')).toHaveCount(0);
    await expect(page.locator('[role="alert"][id^="penghasilan-"]')).toHaveCount(0);
  });
});
